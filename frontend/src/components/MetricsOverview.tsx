import React from 'react';
import { MetricSample } from '../types';
import { Cpu, Database, HardDrive, Network, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricsOverviewProps {
  sample?: MetricSample;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ sample }) => {
  if (!sample) {
    return (
      <div className="bento-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
        Awaiting live telemetry samples from Linux collector...
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 ** 4) return (bytes / 1024 ** 4).toFixed(1) + ' TB';
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
    if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const getMetricColor = (val: number) => {
    if (val >= 85) return 'var(--accent-crimson)';
    if (val >= 70) return 'var(--accent-amber)';
    return 'var(--accent-emerald)';
  };

  return (
    <div className="metrics-bento-grid">
      {/* CPU Utilization Card */}
      <div className="bento-card metric-bento-card">
        <div>
          <div className="metric-card-top">
            <div className="metric-icon-title">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent-blue-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={18} color="var(--accent-blue)" />
              </div>
              <span>CPU Utilization</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Load 1m: {sample.cpu_load_1m}
            </span>
          </div>

          <div className="metric-main-value">
            <span className="huge-num" style={{ color: getMetricColor(sample.cpu_utilization) }}>
              {sample.cpu_utilization.toFixed(1)}
            </span>
            <span className="metric-unit-label">%</span>
          </div>

          <div className="apple-progress-bar">
            <div
              className="apple-progress-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(0, sample.cpu_utilization))}%`,
                backgroundColor: getMetricColor(sample.cpu_utilization),
              }}
            />
          </div>
        </div>

        <div className="metric-meta-row font-mono">
          <span>5m: {sample.cpu_load_5m}</span>
          <span>15m: {sample.cpu_load_15m}</span>
          <span style={{ color: 'var(--accent-emerald)' }}>Optimal</span>
        </div>
      </div>

      {/* Memory Utilization Card */}
      <div className="bento-card metric-bento-card">
        <div>
          <div className="metric-card-top">
            <div className="metric-icon-title">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent-purple-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={18} color="var(--accent-purple)" />
              </div>
              <span>RAM Working Set</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {formatBytes(sample.memory_used_bytes)} / {formatBytes(sample.memory_total_bytes)}
            </span>
          </div>

          <div className="metric-main-value">
            <span className="huge-num" style={{ color: getMetricColor(sample.memory_utilization) }}>
              {sample.memory_utilization.toFixed(1)}
            </span>
            <span className="metric-unit-label">%</span>
          </div>

          <div className="apple-progress-bar">
            <div
              className="apple-progress-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(0, sample.memory_utilization))}%`,
                backgroundColor: getMetricColor(sample.memory_utilization),
              }}
            />
          </div>
        </div>

        <div className="metric-meta-row font-mono">
          <span>Free: {formatBytes(Math.max(0, sample.memory_total_bytes - sample.memory_used_bytes))}</span>
          <span style={{ color: 'var(--text-secondary)' }}>Cgroups Bounded</span>
        </div>
      </div>

      {/* Disk Storage Card */}
      <div className="bento-card metric-bento-card">
        <div>
          <div className="metric-card-top">
            <div className="metric-icon-title">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent-amber-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HardDrive size={18} color="var(--accent-amber)" />
              </div>
              <span>NVMe Storage Capacity</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {formatBytes(sample.disk_used_bytes)} / {formatBytes(sample.disk_total_bytes)}
            </span>
          </div>

          <div className="metric-main-value">
            <span className="huge-num" style={{ color: getMetricColor(sample.disk_utilization) }}>
              {sample.disk_utilization.toFixed(1)}
            </span>
            <span className="metric-unit-label">%</span>
          </div>

          <div className="apple-progress-bar">
            <div
              className="apple-progress-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(0, sample.disk_utilization))}%`,
                backgroundColor: getMetricColor(sample.disk_utilization),
              }}
            />
          </div>
        </div>

        <div className="metric-meta-row font-mono">
          <span>Remaining: {formatBytes(Math.max(0, sample.disk_total_bytes - sample.disk_used_bytes))}</span>
          <span style={{ color: 'var(--accent-blue)' }}>Limit: 90%</span>
        </div>
      </div>

      {/* Network Bandwidth Card */}
      <div className="bento-card metric-bento-card">
        <div>
          <div className="metric-card-top">
            <div className="metric-icon-title">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent-cyan-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Network size={18} color="var(--accent-cyan)" />
              </div>
              <span>Network Throughput</span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
              Interface Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <ArrowDownRight size={16} color="var(--accent-cyan)" />
                <span>Rx (Ingress)</span>
              </div>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                {formatBytes(sample.network_rx_bytes_sec)}/s
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <ArrowUpRight size={16} color="var(--accent-purple)" />
                <span>Tx (Egress)</span>
              </div>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-purple)' }}>
                {formatBytes(sample.network_tx_bytes_sec)}/s
              </span>
            </div>
          </div>
        </div>

        <div className="metric-meta-row font-mono">
          <span>Packets: Normal</span>
          <span style={{ color: 'var(--accent-emerald)' }}>100% Availability</span>
        </div>
      </div>
    </div>
  );
};
