import {
  Host,
  MetricSample,
  MatlabPipelineOutput,
  AnomalyRecord,
  IncidentRecord,
  AlertRule,
  SimulationItem,
} from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';

export const api = {
  // Hosts
  async getHosts(): Promise<Host[]> {
    const res = await fetch(`${API_BASE}/hosts`);
    if (!res.ok) throw new Error('Failed to fetch hosts');
    return res.json();
  },

  // Health
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getMatlabHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health/matlab`);
    return res.json();
  },

  // Telemetry
  async getHistory(hostId: string, limit: number = 100): Promise<MetricSample[]> {
    const res = await fetch(`${API_BASE}/metrics/history?hostId=${encodeURIComponent(hostId)}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch metric history');
    return res.json();
  },

  async getLatestSample(hostId: string): Promise<MetricSample> {
    const res = await fetch(`${API_BASE}/metrics/latest/${encodeURIComponent(hostId)}`);
    if (!res.ok) throw new Error('Failed to fetch latest sample');
    return res.json();
  },

  // MATLAB Analysis
  async triggerMatlabAnalysis(hostId: string): Promise<MatlabPipelineOutput> {
    const res = await fetch(`${API_BASE}/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to trigger MATLAB analysis');
    }
    return res.json();
  },

  async getLatestAnalysis(hostId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/analysis/latest?hostId=${encodeURIComponent(hostId)}`);
    if (!res.ok) throw new Error('Failed to fetch analysis');
    return res.json();
  },

  async getAnomalies(hostId?: string): Promise<AnomalyRecord[]> {
    const url = hostId ? `${API_BASE}/anomalies?hostId=${encodeURIComponent(hostId)}` : `${API_BASE}/anomalies`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  // Incidents
  async getIncidents(): Promise<IncidentRecord[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async acknowledgeIncident(id: number, user: string = 'Operator'): Promise<IncidentRecord> {
    const res = await fetch(`${API_BASE}/incidents/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    if (!res.ok) throw new Error('Failed to acknowledge incident');
    return res.json();
  },

  async resolveIncident(id: number, notes: string): Promise<IncidentRecord> {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve incident');
    return res.json();
  },

  // Alerts
  async getAlertRules(): Promise<AlertRule[]> {
    const res = await fetch(`${API_BASE}/alerts/rules`);
    if (!res.ok) throw new Error('Failed to fetch alert rules');
    return res.json();
  },

  async updateAlertRule(id: number, updates: Partial<AlertRule>): Promise<AlertRule> {
    const res = await fetch(`${API_BASE}/alerts/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update alert rule');
    return res.json();
  },

  // Simulations
  async startSimulation(type: 'cpu' | 'memory' | 'disk' | 'network', durationSeconds: number): Promise<SimulationItem> {
    const res = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, durationSeconds }),
    });
    if (!res.ok) throw new Error('Failed to start simulation');
    return res.json();
  },

  async getSimulationStatus(): Promise<SimulationItem[]> {
    const res = await fetch(`${API_BASE}/simulation/status`);
    if (!res.ok) throw new Error('Failed to fetch simulation status');
    return res.json();
  },

  async stopSimulation(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/stop/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop simulation');
    return res.json();
  },
};
