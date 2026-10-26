import { MetricsRepository } from '../repositories/MetricsRepository';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { AnomalyRepository } from '../repositories/AnomalyRepository';
import { HostRepository } from '../repositories/HostRepository';
import { AlertService } from './AlertService';
import { MatlabRunner } from '../matlab/MatlabRunner';
import { config } from '../config';
import { AnalysisResultRecord, MetricType, MatlabPipelineOutput, HostStatus } from '../types';

export class AnalysisService {
  /**
   * Executes the MATLAB numerical pipeline for a specific host.
   */
  static async runAnalysisForHost(hostId: string): Promise<MatlabPipelineOutput | null> {
    const windowDate = new Date(Date.now() - config.analysis.sampleWindowMinutes * 60 * 1000);
    const samples = await MetricsRepository.findHistorySince(hostId, windowDate);

    if (samples.length < config.analysis.minSamplesRequired) {
      console.log(`[AnalysisService] Host ${hostId} has ${samples.length} samples, below minimum required (${config.analysis.minSamplesRequired}). Skipping.`);
      return null;
    }

    // Prepare arrays for MATLAB input
    const timestamps = samples.map((s) => Math.floor(new Date(s.timestamp).getTime() / 1000));
    const cpu = samples.map((s) => s.cpu_utilization);
    const memory = samples.map((s) => s.memory_utilization);
    const disk = samples.map((s) => s.disk_utilization);
    const networkRx = samples.map((s) => s.network_rx_bytes_sec);
    const networkTx = samples.map((s) => s.network_tx_bytes_sec);

    console.log(`[AnalysisService] Invoking MATLAB analysis pipeline for host ${hostId} with ${samples.length} observations...`);
    
    // Call authentic MATLAB .m script
    const results = await MatlabRunner.runPipeline({
      hostId,
      timestamps,
      cpu,
      memory,
      disk,
      networkRx,
      networkTx,
      diskThreshold: 90.0,
    });

    const analysisTime = new Date(results.analysisTimestamp * 1000);

    // 1. Persist Analytical Results for CPU, Memory, Disk, Net
    const metricMapping: { key: 'cpu' | 'memory' | 'disk' | 'networkRx' | 'networkTx'; type: MetricType }[] = [
      { key: 'cpu', type: 'cpu' },
      { key: 'memory', type: 'memory' },
      { key: 'disk', type: 'disk' },
      { key: 'networkRx', type: 'network_rx' },
      { key: 'networkTx', type: 'network_tx' },
    ];

    for (const mapping of metricMapping) {
      const metricBlock = results.metrics[mapping.key];
      if (!metricBlock || !metricBlock.stats) continue;

      const stats = metricBlock.stats;
      const forecast = (metricBlock as any).forecast;

      let exhaustionTimestamp: Date | null = null;
      if (forecast && forecast.timeToExhaustionSeconds && !isNaN(forecast.timeToExhaustionSeconds)) {
        exhaustionTimestamp = new Date(Date.now() + forecast.timeToExhaustionSeconds * 1000);
      }

      const record: AnalysisResultRecord = {
        host_id: hostId,
        analysis_timestamp: analysisTime,
        metric_type: mapping.type,
        mean: stats.mean,
        median: stats.median,
        std_dev: stats.std,
        min_val: stats.min,
        max_val: stats.max,
        p25: stats.p25,
        p75: stats.p75,
        p90: stats.p90,
        p95: stats.p95,
        p99: stats.p99,
        trend_slope: forecast ? forecast.slope : 0.0,
        trend_intercept: forecast ? forecast.intercept : 0.0,
        r_squared: forecast ? forecast.rSquared : 0.0,
        mae: forecast ? forecast.mae : 0.0,
        rmse: forecast ? forecast.rmse : 0.0,
        forecast_exhaustion_hours: forecast && !isNaN(forecast.timeToExhaustionHours) ? forecast.timeToExhaustionHours : null,
        forecast_exhaustion_timestamp: exhaustionTimestamp,
        sample_count: stats.count,
        window_minutes: config.analysis.sampleWindowMinutes,
        engine_used: results.engineInfo,
        raw_details: metricBlock,
      };

      await AnalysisRepository.insert(record);

      // 2. Persist any anomalies identified in this metric
      if (metricBlock.anomalies && metricBlock.anomalies.anomalies) {
        const rawAnoms = metricBlock.anomalies.anomalies;
        const anomList = Array.isArray(rawAnoms)
          ? rawAnoms
          : (rawAnoms && typeof rawAnoms === 'object' && Object.keys(rawAnoms).length > 0 ? [rawAnoms] : []);

        for (const anom of anomList) {
          if (!anom || !anom.observedValue) continue;
          await AnomalyRepository.insert({
            host_id: hostId,
            metric_type: mapping.type,
            detected_at: new Date(typeof anom.timestamp === 'number' ? anom.timestamp * 1000 : anom.timestamp),
            observed_value: anom.observedValue,
            baseline_mean: anom.baselineMean,
            baseline_std: anom.baselineStd,
            z_score: anom.zScore,
            threshold: anom.threshold,
            severity: anom.severity,
            explanation: anom.explanation,
            status: 'active',
          });

          // Evaluate anomaly rule
          await AlertService.evaluateAnomalyAlert({
            host_id: hostId,
            metric_type: mapping.type,
            observed_value: anom.observedValue,
            z_score: anom.zScore,
            severity: anom.severity,
            explanation: anom.explanation,
          });
        }
      }

      // 3. Evaluate forecast capacity alert
      if (forecast && forecast.isPredictable) {
        await AlertService.evaluateForecastAlert({
          host_id: hostId,
          metric_type: mapping.type,
          current_value: forecast.currentValue,
          time_to_exhaustion_hours: forecast.timeToExhaustionHours,
          reason: forecast.reason,
        });
      }
    }

    // 4. Update Host Health Status
    const dbStatus: HostStatus = results.summary.healthState === ('healthy' as any) ? 'online' : results.summary.healthState;
    await HostRepository.updateStatus(hostId, dbStatus);

    return results;
  }

  /**
   * Runs analysis across all registered active hosts.
   */
  static async runScheduledAnalyses(): Promise<void> {
    const hosts = await HostRepository.findAll();
    for (const host of hosts) {
      try {
        await this.runAnalysisForHost(host.id);
      } catch (err: any) {
        console.error(`[AnalysisService] Error executing MATLAB pipeline for host ${host.id}:`, err.message);
      }
    }
  }
}
