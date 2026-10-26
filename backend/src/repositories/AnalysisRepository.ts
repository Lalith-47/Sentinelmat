import { query } from '../db';
import { AnalysisResultRecord, MetricType } from '../types';

export class AnalysisRepository {
  static async insert(record: AnalysisResultRecord): Promise<AnalysisResultRecord> {
    const sql = `
      INSERT INTO analysis_results (
        host_id, analysis_timestamp, metric_type,
        mean, median, std_dev, min_val, max_val,
        p25, p75, p90, p95, p99,
        trend_slope, trend_intercept, r_squared, mae, rmse,
        forecast_exhaustion_hours, forecast_exhaustion_timestamp,
        sample_count, window_minutes, engine_used, raw_details
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20,
        $21, $22, $23, $24
      ) RETURNING *;
    `;
    const res = await query<AnalysisResultRecord>(sql, [
      record.host_id,
      record.analysis_timestamp,
      record.metric_type,
      record.mean,
      record.median,
      record.std_dev,
      record.min_val,
      record.max_val,
      record.p25,
      record.p75,
      record.p90,
      record.p95,
      record.p99,
      record.trend_slope,
      record.trend_intercept,
      record.r_squared,
      record.mae,
      record.rmse,
      record.forecast_exhaustion_hours,
      record.forecast_exhaustion_timestamp,
      record.sample_count,
      record.window_minutes,
      record.engine_used,
      JSON.stringify(record.raw_details || {}),
    ]);
    return res.rows[0];
  }

  static async findLatestByHost(hostId: string): Promise<Record<MetricType, AnalysisResultRecord | null>> {
    const metricTypes: MetricType[] = ['cpu', 'memory', 'disk', 'network_rx', 'network_tx'];
    const results: Record<string, AnalysisResultRecord | null> = {
      cpu: null,
      memory: null,
      disk: null,
      network_rx: null,
      network_tx: null,
    };

    for (const m of metricTypes) {
      const sql = `
        SELECT * FROM analysis_results
        WHERE host_id = $1 AND metric_type = $2
        ORDER BY analysis_timestamp DESC
        LIMIT 1;
      `;
      const res = await query<AnalysisResultRecord>(sql, [hostId, m]);
      if (res.rows.length > 0) {
        results[m] = res.rows[0];
      }
    }

    return results as Record<MetricType, AnalysisResultRecord | null>;
  }

  static async findHistoryByHost(hostId: string, metricType?: string, limit: number = 50): Promise<AnalysisResultRecord[]> {
    let sql = 'SELECT * FROM analysis_results WHERE host_id = $1';
    const params: any[] = [hostId];

    if (metricType) {
      sql += ' AND metric_type = $2 ORDER BY analysis_timestamp DESC LIMIT $3';
      params.push(metricType, limit);
    } else {
      sql += ' ORDER BY analysis_timestamp DESC LIMIT $2';
      params.push(limit);
    }

    const res = await query<AnalysisResultRecord>(sql, params);
    return res.rows;
  }
}
