export type HostStatus = 'online' | 'warning' | 'critical' | 'offline';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

export interface Host {
  id: string;
  hostname: string;
  ip_address?: string;
  os_info?: string;
  cpu_count: number;
  total_memory_bytes: number;
  total_disk_bytes: number;
  status: HostStatus;
  last_seen_at: string;
  created_at: string;
}

export interface MetricSample {
  id?: number;
  host_id: string;
  timestamp: string;
  cpu_utilization: number;
  cpu_load_1m: number;
  cpu_load_5m: number;
  cpu_load_15m: number;
  memory_utilization: number;
  memory_used_bytes: number;
  memory_total_bytes: number;
  disk_utilization: number;
  disk_used_bytes: number;
  disk_total_bytes: number;
  network_rx_bytes_sec: number;
  network_tx_bytes_sec: number;
  availability: boolean;
}

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  iqr: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  moving_avg_5: number;
  moving_avg_15: number;
}

export interface DetectedAnomalyItem {
  index: number;
  timestamp: string | number;
  observedValue: number;
  baselineMean: number;
  baselineStd: number;
  zScore: number;
  threshold: number;
  severity: Severity;
  explanation: string;
}

export interface AnomalyReport {
  metricName: string;
  totalSamples: number;
  evaluatedSamples: number;
  anomalyCount: number;
  latestZScore: number;
  isCurrentlyAnomaly: boolean;
  anomalies: DetectedAnomalyItem[];
  note?: string;
}

export interface ForecastResult {
  isPredictable: boolean;
  reason: string;
  slope: number;
  slopePerDay: number;
  intercept: number;
  rSquared: number;
  mae: number;
  rmse: number;
  currentValue: number;
  targetThreshold: number;
  timeToExhaustionSeconds: number | null;
  timeToExhaustionHours: number | null;
  projectedTimestamps: number[];
  projectedValues: number[];
}

export interface PredictionEvaluation {
  trainCount: number;
  testCount: number;
  trainRatio: number;
  outOfSampleMAE: number;
  outOfSampleRMSE: number;
  outOfSampleMAPE: number;
  inSampleR2: number;
  directionalAccuracy: number;
  status: string;
}

export interface MatlabPipelineOutput {
  hostId: string;
  analysisTimestamp: number;
  sampleCount: number;
  engineInfo: string;
  pipelineExecutionTimeSec?: number;
  metrics: {
    cpu?: {
      stats: DescriptiveStats;
      anomalies: AnomalyReport;
      forecast: ForecastResult;
      evaluation: PredictionEvaluation;
    };
    memory?: {
      stats: DescriptiveStats;
      anomalies: AnomalyReport;
      forecast: ForecastResult;
      evaluation: PredictionEvaluation;
    };
    disk?: {
      stats: DescriptiveStats;
      anomalies: AnomalyReport;
      forecast: ForecastResult;
      evaluation: PredictionEvaluation;
    };
    networkRx?: {
      stats: DescriptiveStats;
      anomalies: AnomalyReport;
    };
    networkTx?: {
      stats: DescriptiveStats;
      anomalies: AnomalyReport;
    };
  };
  summary: {
    healthState: HostStatus;
    totalAnomalies: number;
    criticalAnomalies: number;
    diskExhaustionHours: number | null;
  };
}

export interface AnomalyRecord {
  id: number;
  host_id: string;
  metric_type: string;
  detected_at: string;
  observed_value: number;
  baseline_mean: number;
  baseline_std: number;
  z_score: number;
  threshold: number;
  severity: Severity;
  explanation: string;
  status: 'active' | 'investigating' | 'resolved';
}

export interface IncidentRecord {
  id: number;
  host_id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  trigger_metric: string;
  trigger_value: number;
  summary: string;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

export interface AlertRule {
  id: number;
  name: string;
  metric_type: string;
  condition: string;
  threshold_value: number;
  duration_seconds: number;
  severity: Severity;
  enabled: boolean;
  cooldown_minutes: number;
  last_triggered_at?: string | null;
  notify_telegram: boolean;
}

export interface SimulationItem {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  startedAt: string;
  durationSeconds: number;
  status: 'running' | 'completed' | 'terminated';
}
