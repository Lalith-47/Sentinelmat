import {
  Host,
  MetricSample,
  MatlabPipelineOutput,
  AnomalyRecord,
  IncidentRecord,
  AlertRule,
  SimulationItem,
} from '../types';

// Connection Configuration Storage Key
const STORAGE_KEY_BACKEND_URL = 'sentinelmat_backend_url';
const STORAGE_KEY_FORCE_DEMO = 'sentinelmat_force_demo';
export const DEFAULT_TUNNEL_URL = 'https://serviceably-unmincing-lu.ngrok-free.dev';

export function getStoredBackendUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
  const stored = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
  
  // On HTTPS sites (e.g. stats.lalith.dev or Vercel), plain HTTP is blocked by browsers
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (stored && stored.startsWith('https://')) {
      return stored;
    }
    return envUrl || DEFAULT_TUNNEL_URL;
  }

  if (stored !== null && stored.trim() !== '') return stored;
  return envUrl || 'http://localhost:5000';
}

export function setStoredBackendUrl(url: string) {
  localStorage.setItem(STORAGE_KEY_BACKEND_URL, url.trim().replace(/\/$/, ''));
}

export function isForceDemoMode(): boolean {
  return localStorage.getItem(STORAGE_KEY_FORCE_DEMO) === 'true';
}

export function setForceDemoMode(val: boolean) {
  localStorage.setItem(STORAGE_KEY_FORCE_DEMO, val ? 'true' : 'false');
}

export function shouldFetchBackend(): boolean {
  if (isForceDemoMode()) return false;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const backend = getStoredBackendUrl();
    // Browsers block plain HTTP from HTTPS pages as Mixed Content
    if (backend.startsWith('http://')) {
      return false;
    }
  }
  return true;
}

export function getApiBase(): string {
  const base = getStoredBackendUrl().replace(/\/$/, '');
  return `${base}/api`;
}

export async function fetchFromBackend(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getApiBase()}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set('ngrok-skip-browser-warning', 'true');
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, {
    ...options,
    headers,
  });
}

// ============================================================================
// Realistic Enterprise High-Fidelity Simulation State (for Vercel / Showcase)
// ============================================================================
let mockHistory: MetricSample[] = [];
let mockIncidents: IncidentRecord[] = [
  {
    id: 1042,
    host_id: 'sentinel-prod-01',
    title: 'NVMe Storage Capacity Exhaustion Predicted',
    severity: 'critical',
    status: 'open',
    trigger_metric: 'disk',
    trigger_value: 88.4,
    summary: 'MATLAB OLS linear trend projects critical 90% breach in 4.2 hours.',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: 1041,
    host_id: 'sentinel-prod-01',
    title: 'Multi-Core CPU Z-Score Deviation',
    severity: 'medium',
    status: 'acknowledged',
    trigger_metric: 'cpu',
    trigger_value: 84.2,
    summary: 'Observed CPU spike Z-score 3.12 exceeds baseline 2.5 sigma bound.',
    acknowledged_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged_by: 'Alex M. (SRE Lead)',
    created_at: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
  },
  {
    id: 1039,
    host_id: 'sentinel-prod-01',
    title: 'Kernel Memory Buffer Pressure Mitigated',
    severity: 'high',
    status: 'resolved',
    trigger_metric: 'memory',
    trigger_value: 91.5,
    summary: 'Transient buffer pool cache spike safely reclaimed.',
    acknowledged_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    acknowledged_by: 'Auto-Remediation Service',
    resolved_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    resolution_notes: 'Cgroups memory reclamation executed without user process interruption.',
    created_at: new Date(Date.now() - 125 * 60 * 1000).toISOString(),
  },
];

let mockAlertRules: AlertRule[] = [
  {
    id: 1,
    name: 'Critical CPU Saturation Guard',
    metric_type: 'cpu',
    condition: 'gt',
    threshold_value: 90.0,
    duration_seconds: 60,
    severity: 'critical',
    enabled: true,
    cooldown_minutes: 15,
    notify_telegram: true,
  },
  {
    id: 2,
    name: 'MATLAB Statistical Z-Score Outlier Trigger',
    metric_type: 'cpu',
    condition: 'z_score_gt',
    threshold_value: 2.5,
    duration_seconds: 30,
    severity: 'high',
    enabled: true,
    cooldown_minutes: 10,
    notify_telegram: true,
  },
  {
    id: 3,
    name: 'NVMe Capacity Exhaustion Horizon Guard',
    metric_type: 'disk',
    condition: 'tte_lt',
    threshold_value: 12.0,
    duration_seconds: 120,
    severity: 'critical',
    enabled: true,
    cooldown_minutes: 30,
    notify_telegram: false,
  },
  {
    id: 4,
    name: 'RAM Working-Set Buffer Surge',
    metric_type: 'memory',
    condition: 'gt',
    threshold_value: 85.0,
    duration_seconds: 45,
    severity: 'medium',
    enabled: true,
    cooldown_minutes: 20,
    notify_telegram: false,
  },
];

let mockActiveSimulations: SimulationItem[] = [];

// Initialize 60 rolling samples matching local machine baseline (arch)
function initMockHistory() {
  if (mockHistory.length > 0) return;
  const now = Date.now();
  const baseCpu = 8.5;
  const baseMem = 58.2;
  const baseDisk = 83.1;
  const memTotal = 16437747712;
  const diskTotal = 370761805824;

  for (let i = 59; i >= 0; i--) {
    const t = new Date(now - i * 1500).toISOString();
    const cycle = Math.sin((60 - i) * 0.15);
    const cpuVal = Math.max(2, Math.min(95, baseCpu + cycle * 3.5 + (Math.random() * 2 - 1)));
    const memVal = Math.max(50, Math.min(80, baseMem + cycle * 0.5 + (Math.random() * 0.3 - 0.15)));
    const diskVal = baseDisk;
    mockHistory.push({
      host_id: 'arch',
      timestamp: t,
      cpu_utilization: parseFloat(cpuVal.toFixed(1)),
      cpu_load_1m: parseFloat((1.1 + cpuVal / 30).toFixed(2)),
      cpu_load_5m: 1.25,
      cpu_load_15m: 1.10,
      memory_utilization: parseFloat(memVal.toFixed(1)),
      memory_used_bytes: Math.round((memVal / 100) * memTotal),
      memory_total_bytes: memTotal,
      disk_utilization: parseFloat(diskVal.toFixed(1)),
      disk_used_bytes: Math.round((diskVal / 100) * diskTotal),
      disk_total_bytes: diskTotal,
      network_rx_bytes_sec: 24000 + Math.random() * 12000,
      network_tx_bytes_sec: 48000 + Math.random() * 18000,
      availability: true,
    });
  }
}

// Generate new mock sample on poll
function stepMockSample(): MetricSample {
  initMockHistory();
  const last = mockHistory[mockHistory.length - 1];
  const now = Date.now();
  const memTotal = 16437747712;
  const diskTotal = 370761805824;

  // Check if simulation is boosting metrics
  let cpuBoost = 0;
  let memBoost = 0;
  let diskBoost = 0;

  mockActiveSimulations = mockActiveSimulations.filter((sim) => {
    const elapsed = (now - new Date(sim.startedAt).getTime()) / 1000;
    if (elapsed > sim.durationSeconds) {
      sim.status = 'completed';
      return false;
    }
    if (sim.type === 'cpu') cpuBoost += 55;
    if (sim.type === 'memory') memBoost += 3.5;
    if (sim.type === 'disk') diskBoost += 0.2;
    return true;
  });

  const nextCpu = Math.max(3, Math.min(99, last.cpu_utilization * 0.8 + 8.5 * 0.2 + (Math.random() * 3 - 1.5) + (cpuBoost > 0 ? cpuBoost : 0)));
  const nextMem = Math.max(50, Math.min(85, last.memory_utilization * 0.95 + 58.2 * 0.05 + (Math.random() * 0.4 - 0.2) + (memBoost > 0 ? memBoost : 0)));
  const nextDisk = Math.max(30, Math.min(99, 83.1 + diskBoost));

  const sample: MetricSample = {
    host_id: 'arch',
    timestamp: new Date().toISOString(),
    cpu_utilization: parseFloat(nextCpu.toFixed(1)),
    cpu_load_1m: parseFloat((1.1 + nextCpu / 30).toFixed(2)),
    cpu_load_5m: 1.25,
    cpu_load_15m: 1.10,
    memory_utilization: parseFloat(nextMem.toFixed(1)),
    memory_used_bytes: Math.round((nextMem / 100) * memTotal),
    memory_total_bytes: memTotal,
    disk_utilization: parseFloat(nextDisk.toFixed(1)),
    disk_used_bytes: Math.round((nextDisk / 100) * diskTotal),
    disk_total_bytes: diskTotal,
    network_rx_bytes_sec: 24000 + Math.random() * 12000,
    network_tx_bytes_sec: 48000 + Math.random() * 18000,
    availability: true,
  };

  mockHistory.push(sample);
  if (mockHistory.length > 100) mockHistory.shift();
  return sample;
}

// Generate genuine mathematical stats for mock pipeline
function computeMockMatlabAnalysis(): MatlabPipelineOutput {
  initMockHistory();
  const cpuVals = mockHistory.map((s) => s.cpu_utilization);
  const diskVals = mockHistory.map((s) => s.disk_utilization);
  const memVals = mockHistory.map((s) => s.memory_utilization);

  const calcStats = (vals: number[]) => {
    const n = vals.length;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted[Math.floor(n / 2)];
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1 || 1);
    const std = Math.sqrt(variance);
    const p25 = sorted[Math.floor(n * 0.25)];
    const p75 = sorted[Math.floor(n * 0.75)];
    const p90 = sorted[Math.floor(n * 0.9)];
    const p95 = sorted[Math.floor(n * 0.95)];
    const p99 = sorted[Math.floor(n * 0.99)];
    const recent5 = vals.slice(-5);
    const moving_avg_5 = recent5.reduce((a, b) => a + b, 0) / recent5.length;

    return {
      count: n,
      mean,
      median,
      std,
      variance,
      min: sorted[0],
      max: sorted[n - 1],
      range: sorted[n - 1] - sorted[0],
      iqr: p75 - p25,
      p25,
      p50: median,
      p75,
      p90,
      p95,
      p99,
      moving_avg_5,
      moving_avg_15: moving_avg_5,
    };
  };

  const cpuStats = calcStats(cpuVals);
  const diskStats = calcStats(diskVals);
  const memStats = calcStats(memVals);

  // OLS on disk
  const n = diskVals.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += diskVals[i];
    sumXY += i * diskVals[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  const currentDisk = diskVals[diskVals.length - 1];
  const targetThreshold = 90.0;
  let tteHours: number | null = null;
  if (slope > 0 && currentDisk < targetThreshold) {
    const stepsNeeded = (targetThreshold - currentDisk) / slope;
    tteHours = parseFloat(((stepsNeeded * 4) / 3600).toFixed(1));
  }

  const projectedValues: number[] = [];
  for (let step = 1; step <= 25; step++) {
    projectedValues.push(parseFloat((currentDisk + slope * step).toFixed(2)));
  }

  return {
    hostId: 'sentinel-prod-01',
    analysisTimestamp: Date.now(),
    sampleCount: n,
    engineInfo: 'MATLAB® Engine / GNU Octave 9.2 (Numerical Math Core)',
    pipelineExecutionTimeSec: 0.082,
    metrics: {
      cpu: {
        stats: cpuStats,
        anomalies: {
          metricName: 'cpu',
          totalSamples: n,
          evaluatedSamples: n,
          anomalyCount: 1,
          latestZScore: 1.2,
          isCurrentlyAnomaly: false,
          anomalies: [],
        },
        forecast: {
          isPredictable: false,
          reason: 'Stationary process around baseline mean; no monotonic exhaustion trend.',
          slope: 0.01,
          slopePerDay: 0.24,
          intercept: 35.0,
          rSquared: 0.12,
          mae: 4.2,
          rmse: 5.1,
          currentValue: cpuVals[n - 1],
          targetThreshold: 90.0,
          timeToExhaustionSeconds: null,
          timeToExhaustionHours: null,
          projectedTimestamps: [],
          projectedValues: [],
        },
        evaluation: {
          trainCount: 45,
          testCount: 15,
          trainRatio: 0.75,
          outOfSampleMAE: 4.8,
          outOfSampleRMSE: 5.9,
          outOfSampleMAPE: 8.2,
          inSampleR2: 0.12,
          directionalAccuracy: 78.5,
          status: 'valid',
        },
      },
      disk: {
        stats: diskStats,
        anomalies: {
          metricName: 'disk',
          totalSamples: n,
          evaluatedSamples: n,
          anomalyCount: 0,
          latestZScore: 0.8,
          isCurrentlyAnomaly: false,
          anomalies: [],
        },
        forecast: {
          isPredictable: true,
          reason: 'Monotonic OLS positive drift detected. Valid linear progression modeled.',
          slope: parseFloat(slope.toFixed(4)),
          slopePerDay: parseFloat((slope * 21600).toFixed(2)),
          intercept: parseFloat(intercept.toFixed(2)),
          rSquared: 0.942,
          mae: 0.42,
          rmse: 0.58,
          currentValue: parseFloat(currentDisk.toFixed(2)),
          targetThreshold: 90.0,
          timeToExhaustionSeconds: tteHours ? Math.round(tteHours * 3600) : null,
          timeToExhaustionHours: tteHours,
          projectedTimestamps: [],
          projectedValues,
        },
        evaluation: {
          trainCount: 45,
          testCount: 15,
          trainRatio: 0.75,
          outOfSampleMAE: 0.38,
          outOfSampleRMSE: 0.49,
          outOfSampleMAPE: 0.8,
          inSampleR2: 0.942,
          directionalAccuracy: 95.0,
          status: 'valid',
        },
      },
      memory: {
        stats: memStats,
        anomalies: {
          metricName: 'memory',
          totalSamples: n,
          evaluatedSamples: n,
          anomalyCount: 0,
          latestZScore: 0.6,
          isCurrentlyAnomaly: false,
          anomalies: [],
        },
        forecast: {
          isPredictable: false,
          reason: 'Dynamic memory allocator fluctuates within normal cyclic bounds.',
          slope: 0.02,
          slopePerDay: 0.48,
          intercept: 58.0,
          rSquared: 0.28,
          mae: 2.1,
          rmse: 2.7,
          currentValue: memVals[n - 1],
          targetThreshold: 95.0,
          timeToExhaustionSeconds: null,
          timeToExhaustionHours: null,
          projectedTimestamps: [],
          projectedValues: [],
        },
        evaluation: {
          trainCount: 45,
          testCount: 15,
          trainRatio: 0.75,
          outOfSampleMAE: 2.4,
          outOfSampleRMSE: 3.1,
          outOfSampleMAPE: 3.8,
          inSampleR2: 0.28,
          directionalAccuracy: 82.0,
          status: 'valid',
        },
      },
      networkRx: {
        stats: {
          count: n,
          mean: 16500000,
          median: 16200000,
          std: 3200000,
          variance: 10240000000000,
          min: 11000000,
          max: 24000000,
          range: 13000000,
          iqr: 4500000,
          p25: 14000000,
          p50: 16200000,
          p75: 18500000,
          p90: 21000000,
          p95: 22800000,
          p99: 23900000,
          moving_avg_5: 17100000,
          moving_avg_15: 16800000,
        },
        anomalies: {
          metricName: 'networkRx',
          totalSamples: n,
          evaluatedSamples: n,
          anomalyCount: 0,
          latestZScore: 0.3,
          isCurrentlyAnomaly: false,
          anomalies: [],
        },
      },
      networkTx: {
        stats: {
          count: n,
          mean: 9200000,
          median: 8900000,
          std: 1800000,
          variance: 3240000000000,
          min: 6800000,
          max: 14200000,
          range: 7400000,
          iqr: 2500000,
          p25: 7900000,
          p50: 8900000,
          p75: 10400000,
          p90: 11800000,
          p95: 12900000,
          p99: 13900000,
          moving_avg_5: 9400000,
          moving_avg_15: 9100000,
        },
        anomalies: {
          metricName: 'networkTx',
          totalSamples: n,
          evaluatedSamples: n,
          anomalyCount: 0,
          latestZScore: 0.4,
          isCurrentlyAnomaly: false,
          anomalies: [],
        },
      },
    },
    summary: {
      healthState: tteHours && tteHours < 6 ? 'warning' : 'online',
      totalAnomalies: 1,
      criticalAnomalies: 0,
      diskExhaustionHours: tteHours,
    },
  };
}

function normalizeAnalysisResponse(raw: any, hostId: string): MatlabPipelineOutput {
  if (!raw) return computeMockMatlabAnalysis();
  if (raw.metrics) {
    return raw as MatlabPipelineOutput;
  }
  // From backend GET /api/analysis/latest
  const cpu = raw.cpu?.raw_details || (raw.cpu ? { stats: raw.cpu } : undefined);
  const memory = raw.memory?.raw_details || (raw.memory ? { stats: raw.memory } : undefined);
  const disk = raw.disk?.raw_details || (raw.disk ? { stats: raw.disk } : undefined);
  const networkRx = raw.network_rx?.raw_details || (raw.network_rx ? { stats: raw.network_rx } : undefined);
  const networkTx = raw.network_tx?.raw_details || (raw.network_tx ? { stats: raw.network_tx } : undefined);

  return {
    hostId,
    analysisTimestamp: raw.cpu?.analysis_timestamp ? new Date(raw.cpu.analysis_timestamp).getTime() : Date.now(),
    sampleCount: raw.cpu?.sample_count || 60,
    engineInfo: raw.cpu?.engine_used || 'GNU Octave / MATLAB Numerical Engine',
    pipelineExecutionTimeSec: raw.pipelineExecutionTimeSec || 0.116,
    metrics: {
      cpu,
      memory,
      disk,
      networkRx,
      networkTx,
    },
    summary: {
      healthState: 'online',
      totalAnomalies: (cpu?.anomalies?.anomalyCount || 0) + (disk?.anomalies?.anomalyCount || 0),
      criticalAnomalies: 0,
      diskExhaustionHours: disk?.forecast?.timeToExhaustionHours || null,
    },
  };
}

// ============================================================================
// Public API Client with Seamless Backend Connection & Offline Graceful Fallback
// ============================================================================
// Public API Client with Seamless Backend Connection & Offline Graceful Fallback
// ============================================================================
export const api = {
  // Test connection to backend
  async pingBackend(targetUrl?: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const url = (targetUrl || getStoredBackendUrl()).replace(/\/$/, '') + '/api/health';
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        return { ok: true, latencyMs: latency };
      }
      return { ok: false, latencyMs: latency, error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { ok: false, latencyMs: 0, error: err.message || 'Connection failed' };
    }
  },

  // Hosts
  async getHosts(): Promise<Host[]> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/hosts', { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (e) {
        // Fallback to initial
      }
    }
    return this.getInitialHosts();
  },

  // Health
  async getHealth(): Promise<any> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/health', { signal: AbortSignal.timeout(3000) });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    return { status: 'healthy', mode: 'interactive-showcase' };
  },

  // Telemetry History
  async getHistory(hostId: string, limit: number = 100): Promise<MetricSample[]> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/metrics/history?hostId=${encodeURIComponent(hostId)}&limit=${limit}`, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch (e) {}
    }
    stepMockSample();
    return [...mockHistory];
  },

  // Latest Sample
  async getLatestSample(hostId: string): Promise<MetricSample> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/metrics/latest/${encodeURIComponent(hostId)}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.timestamp) return data;
        }
      } catch (e) {}
    }
    return stepMockSample();
  },

  // Trigger MATLAB Analysis
  async triggerMatlabAnalysis(hostId: string): Promise<MatlabPipelineOutput> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/analysis/run', {
          method: 'POST',
          body: JSON.stringify({ hostId }),
          signal: AbortSignal.timeout(35000),
        });
        if (res.ok) {
          const raw = await res.json();
          return normalizeAnalysisResponse(raw, hostId);
        }
      } catch (e) {}
    }
    // Simulate brief MATLAB compute latency
    await new Promise((r) => setTimeout(r, 600));
    return computeMockMatlabAnalysis();
  },

  async getLatestAnalysis(hostId: string): Promise<MatlabPipelineOutput> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/analysis/latest?hostId=${encodeURIComponent(hostId)}`, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const raw = await res.json();
          return normalizeAnalysisResponse(raw, hostId);
        }
      } catch (e) {}
    }
    return computeMockMatlabAnalysis();
  },

  // Anomalies
  async getAnomalies(hostId?: string): Promise<AnomalyRecord[]> {
    if (shouldFetchBackend()) {
      try {
        const path = hostId ? `/anomalies?hostId=${encodeURIComponent(hostId)}` : '/anomalies';
        const res = await fetchFromBackend(path, { signal: AbortSignal.timeout(3500) });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    return [
      {
        id: 201,
        host_id: hostId || 'arch',
        metric_type: 'cpu',
        detected_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        observed_value: 86.4,
        baseline_mean: 34.2,
        baseline_std: 16.1,
        z_score: 3.24,
        threshold: 2.5,
        severity: 'high',
        explanation: 'Observed CPU load 86.4% exceeds MATLAB rolling mean + 2.5 sigma threshold (74.45%).',
        status: 'active',
      },
      {
        id: 200,
        host_id: hostId || 'arch',
        metric_type: 'disk',
        detected_at: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        observed_value: 88.2,
        baseline_mean: 72.0,
        baseline_std: 5.4,
        z_score: 3.0,
        threshold: 2.5,
        severity: 'critical',
        explanation: 'Persistent positive slope linear drift triggers early capacity exhaustion protocol.',
        status: 'investigating',
      },
    ];
  },

  // Incidents
  async getIncidents(): Promise<IncidentRecord[]> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/incidents', { signal: AbortSignal.timeout(3500) });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    return [...mockIncidents];
  },

  async acknowledgeIncident(id: number, user: string = 'Operator'): Promise<IncidentRecord> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/incidents/${id}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify({ user }),
        });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    const idx = mockIncidents.findIndex((i) => i.id === id);
    if (idx !== -1) {
      mockIncidents[idx] = {
        ...mockIncidents[idx],
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user,
      };
      return mockIncidents[idx];
    }
    throw new Error('Incident not found');
  },

  async resolveIncident(id: number, notes: string): Promise<IncidentRecord> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/incidents/${id}/resolve`, {
          method: 'POST',
          body: JSON.stringify({ notes }),
        });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    const idx = mockIncidents.findIndex((i) => i.id === id);
    if (idx !== -1) {
      mockIncidents[idx] = {
        ...mockIncidents[idx],
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      };
      return mockIncidents[idx];
    }
    throw new Error('Incident not found');
  },

  // Alerts
  async getAlertRules(): Promise<AlertRule[]> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/alerts/rules', { signal: AbortSignal.timeout(3500) });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    return [...mockAlertRules];
  },

  async updateAlertRule(id: number, updates: Partial<AlertRule>): Promise<AlertRule> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/alerts/rules/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    const idx = mockAlertRules.findIndex((r) => r.id === id);
    if (idx !== -1) {
      mockAlertRules[idx] = { ...mockAlertRules[idx], ...updates };
      return mockAlertRules[idx];
    }
    throw new Error('Rule not found');
  },

  // Simulations
  async startSimulation(type: 'cpu' | 'memory' | 'disk' | 'network', durationSeconds: number): Promise<SimulationItem> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/simulation/start', {
          method: 'POST',
          body: JSON.stringify({ type, durationSeconds }),
        });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    const item: SimulationItem = {
      id: `sim-${Date.now().toString(36)}`,
      type,
      startedAt: new Date().toISOString(),
      durationSeconds,
      status: 'running',
    };
    mockActiveSimulations.push(item);
    return item;
  },

  async getSimulationStatus(): Promise<SimulationItem[]> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend('/simulation/status', { signal: AbortSignal.timeout(3500) });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    return [...mockActiveSimulations];
  },

  async stopSimulation(id: string): Promise<any> {
    if (shouldFetchBackend()) {
      try {
        const res = await fetchFromBackend(`/simulation/stop/${id}`, { method: 'POST' });
        if (res.ok) return res.json();
      } catch (e) {}
    }
    mockActiveSimulations = mockActiveSimulations.filter((s) => s.id !== id);
    return { success: true };
  },

  getInitialHosts(): Host[] {
    return [
      {
        id: 'arch',
        hostname: 'arch',
        ip_address: '10.115.157.193',
        os_info: 'Linux 6.18.58-1-lts (x86_64)',
        cpu_count: 16,
        total_memory_bytes: 16437747712,
        total_disk_bytes: 370761805824,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'test-arch-host',
        hostname: 'arch-sentinel-test',
        ip_address: '192.168.1.100',
        os_info: 'Linux Arch 6.10',
        cpu_count: 8,
        total_memory_bytes: 16000000000,
        total_disk_bytes: 500000000000,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: '2026-01-01T00:00:00Z',
      },
    ];
  },

  getInitialSample(): MetricSample {
    initMockHistory();
    return mockHistory[mockHistory.length - 1];
  },

  getInitialHistory(): MetricSample[] {
    initMockHistory();
    return [...mockHistory];
  },

  getInitialAnalysis(): MatlabPipelineOutput {
    return computeMockMatlabAnalysis();
  },
};
