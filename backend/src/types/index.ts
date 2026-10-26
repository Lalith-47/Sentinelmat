export type HostStatus = 'online' | 'warning' | 'critical' | 'offline';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';
export type MetricType = 'cpu' | 'memory' | 'disk' | 'network_rx' | 'network_tx';
export type AlertCondition = 'gt' | 'lt' | 'z_score_gt' | 'tte_lt';

export interface Host {
  id: string;
  hostname: string;
  ip_address?: string;
  os_info?: string;
  cpu_count: number;
  total_memory_bytes: number;
  total_disk_bytes: number;
  status: HostStatus;
  last_seen_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MetricSample {
  id?: number;
  host_id: string;
  timestamp: string | Date;
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
  created_at?: Date;
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
  actualTestValues: number[];
  predictedValues: number[];
  residuals: number[];
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

export interface AnalysisResultRecord {
  id?: number;
  host_id: string;
  analysis_timestamp: Date;
  metric_type: MetricType;
  mean: number;
  median: number;
  std_dev: number;
  min_val: number;
  max_val: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  trend_slope: number;
  trend_intercept: number;
  r_squared: number;
  mae: number;
  rmse: number;
  forecast_exhaustion_hours: number | null;
  forecast_exhaustion_timestamp: Date | null;
  sample_count: number;
  window_minutes: number;
  engine_used: string;
  raw_details: any;
  created_at?: Date;
}

export interface AnomalyRecord {
  id?: number;
  host_id: string;
  metric_type: string;
  detected_at: Date;
  observed_value: number;
  baseline_mean: number;
  baseline_std: number;
  z_score: number;
  threshold: number;
  severity: Severity;
  explanation: string;
  status: 'active' | 'investigating' | 'resolved';
  created_at?: Date;
}

export interface IncidentRecord {
  id?: number;
  host_id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  trigger_metric: string;
  trigger_value: number;
  summary: string;
  acknowledged_at?: Date | null;
  acknowledged_by?: string | null;
  resolved_at?: Date | null;
  resolution_notes?: string | null;
  created_at?: Date;
}

export interface AlertRule {
  id?: number;
  name: string;
  metric_type: string;
  condition: AlertCondition;
  threshold_value: number;
  duration_seconds: number;
  severity: Severity;
  enabled: boolean;
  cooldown_minutes: number;
  last_triggered_at?: Date | null;
  notify_telegram: boolean;
  created_at?: Date;
}

export interface NotificationLog {
  id?: number;
  incident_id?: number | null;
  channel: string;
  recipient: string;
  message: string;
  status: 'sent' | 'failed' | 'skipped';
  error_message?: string | null;
  sent_at?: Date;
}
