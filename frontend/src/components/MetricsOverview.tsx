import React from 'react';
import { MetricSample } from '../types';
import { Cpu, Database, HardDrive, Network } from 'lucide-react';

interface MetricsOverviewProps {
  sample?: MetricSample;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ sample }) => {
  if (!sample) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        Awaiting telemetry samples from collector...
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024 * 1024) return (bytes / (1024 ** 4)).toFixed(1) + ' TB';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 ** 2)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 85) return 'var(--color-critical)';
    if (pct >= 70) return 'var(--color-warning)';
    return 'var(--color-healthy)';
  };

  return (
    <div className="metrics-grid">
      {/* CPU Card */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <div className="metric-title">
            <Cpu size={18} color="#3b82f6" />
            <span>CPU Utilization</span>
          </div>
          <span className="text-muted code-font">Load: {sample.cpu_load_1m}</span>
        </div>
        <div className="metric-value-box">
          <span className="metric-value-huge" style={{ color: getProgressColor(sample.cpu_utilization) }}>
            {sample.cpu_utilization.toFixed(1)}
          </span>
          <span className="metric-unit">%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, sample.cpu_utilization)}%`, backgroundColor: getProgressColor(sample.cpu_utilization) }}
          />
        </div>
        <div className="metric-footer">
          <span>5m: {sample.cpu_load_5m}</span>
          <span>15m: {sample.cpu_load_15m}</span>
        </div>
      </div>

      {/* Memory Card */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <div className="metric-title">
            <Database size={18} color="#8b5cf6" />
            <span>Memory Usage</span>
          </div>
          <span className="text-muted code-font">
            {formatBytes(sample.memory_used_bytes)} / {formatBytes(sample.memory_total_bytes)}
          </span>
        </div>
        <div className="metric-value-box">
          <span className="metric-value-huge" style={{ color: getProgressColor(sample.memory_utilization) }}>
            {sample.memory_utilization.toFixed(1)}
          </span>
          <span className="metric-unit">%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, sample.memory_utilization)}%`, backgroundColor: getProgressColor(sample.memory_utilization) }}
          />
        </div>
        <div className="metric-footer">
          <span>Free: {formatBytes(Math.max(0, sample.memory_total_bytes - sample.memory_used_bytes))}</span>
          <span>Available</span>
        </div>
      </div>

      {/* Disk Card */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <div className="metric-title">
            <HardDrive size={18} color="#f59e0b" />
            <span>Disk Utilization</span>
          </div>
          <span className="text-muted code-font">
            {formatBytes(sample.disk_used_bytes)} / {formatBytes(sample.disk_total_bytes)}
          </span>
        </div>
        <div className="metric-value-box">
          <span className="metric-value-huge" style={{ color: getProgressColor(sample.disk_utilization) }}>
            {sample.disk_utilization.toFixed(1)}
          </span>
          <span className="metric-unit">%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, sample.disk_utilization)}%`, backgroundColor: getProgressColor(sample.disk_utilization) }}
          />
        </div>
        <div className="metric-footer">
          <span>Remaining: {formatBytes(Math.max(0, sample.disk_total_bytes - sample.disk_used_bytes))}</span>
          <span>Capacity Limit: 90%</span>
        </div>
      </div>

      {/* Network Card */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <div className="metric-title">
            <Network size={18} color="#10b981" />
            <span>Network Throughput</span>
          </div>
          <span className="text-muted code-font">Live I/O</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rx (Receive):</span>
            <span className="code-font" style={{ fontWeight: 600, color: '#38bdf8' }}>
              {formatBytes(sample.network_rx_bytes_sec)}/s
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tx (Transmit):</span>
            <span className="code-font" style={{ fontWeight: 600, color: '#a78bfa' }}>
              {formatBytes(sample.network_tx_bytes_sec)}/s
            </span>
          </div>
        </div>
        <div className="metric-footer" style={{ marginTop: 'auto' }}>
          <span>Interface Active</span>
          <span>Availability: 100%</span>
        </div>
      </div>
    </div>
  );
};
