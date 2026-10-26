import React, { useState } from 'react';
import { MetricSample, DescriptiveStats } from '../types';
import { Activity, Radio } from 'lucide-react';

interface TelemetryChartProps {
  samples: MetricSample[];
  stats?: DescriptiveStats;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ samples, stats }) => {
  const [metricKey, setMetricKey] = useState<'cpu' | 'memory' | 'disk'>('cpu');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!samples || samples.length === 0) {
    return (
      <div className="bento-card" style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No historical telemetry data available yet.
      </div>
    );
  }

  // Extract values
  const values = samples.map((s) => {
    if (metricKey === 'cpu') return s.cpu_utilization;
    if (metricKey === 'memory') return s.memory_utilization;
    return s.disk_utilization;
  });

  const timestamps = samples.map((s) => new Date(s.timestamp).toLocaleTimeString());

  // Dimensions
  const width = 900;
  const height = 300;
  const padding = { top: 30, right: 35, bottom: 40, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minVal = 0;
  const maxVal = 100;

  const getX = (idx: number) => padding.left + (idx / Math.max(1, values.length - 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - ((Math.min(100, Math.max(0, val)) - minVal) / (maxVal - minVal)) * chartH;

  // Build SVG path
  const points = values.map((v, i) => `${getX(i)},${getY(v)}`);
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD = points.length > 0
    ? `M ${points[0]} L ${points.join(' L ')} L ${getX(values.length - 1)},${padding.top + chartH} L ${padding.left},${padding.top + chartH} Z`
    : '';

  // Baseline Mean and Threshold from stats
  const meanVal = stats ? stats.mean : values.reduce((a, b) => a + b, 0) / values.length;
  const stdVal = stats ? stats.std : 5.0;
  const upperThreshold = Math.min(100, meanVal + 2.5 * stdVal);

  const metricColors = {
    cpu: { line: '#2997ff', fill: 'url(#gradient-cpu)', label: 'CPU Utilization (%)', strokeId: 'cpu' },
    memory: { line: '#bf5af2', fill: 'url(#gradient-mem)', label: 'Memory Utilization (%)', strokeId: 'mem' },
    disk: { line: '#ff9f0a', fill: 'url(#gradient-disk)', label: 'Disk Utilization (%)', strokeId: 'disk' },
  };

  const currColor = metricColors[metricKey];

  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Metric Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <Activity size={18} color="var(--accent-blue)" />
            </div>
            <h2 className="section-title">Continuous Telemetry Stream</h2>
          </div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            High-frequency Linux kernel observations with MATLAB rolling baseline (&mu;) and 2.5&sigma; anomaly envelope
          </p>
        </div>

        {/* Metric Segmented Control */}
        <div className="segmented-control">
          {(['cpu', 'memory', 'disk'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setMetricKey(key)}
              className={`segmented-tab ${metricKey === key ? 'active' : ''}`}
            >
              <Radio size={12} />
              <span>{key.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            if (mouseX >= padding.left && mouseX <= width - padding.right) {
              const relX = (mouseX - padding.left) / chartW;
              const idx = Math.round(relX * (values.length - 1));
              setHoveredIndex(Math.max(0, Math.min(values.length - 1, idx)));
            }
          }}
        >
          <defs>
            <linearGradient id="gradient-cpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2997ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2997ff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-mem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bf5af2" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#bf5af2" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-disk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff9f0a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff9f0a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y-Axis Grid Lines & Labels */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <text x={padding.left - 12} y={y + 4} fill="var(--text-tertiary)" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Rolling Mean Baseline Line (MATLAB Computed) */}
          <line
            x1={padding.left}
            y1={getY(meanVal)}
            x2={width - padding.right}
            y2={getY(meanVal)}
            stroke="#30d158"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.85"
          />

          {/* Upper Anomaly Threshold Line (+2.5 sigma) */}
          <line
            x1={padding.left}
            y1={getY(upperThreshold)}
            x2={width - padding.right}
            y2={getY(upperThreshold)}
            stroke="#ff453a"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            opacity="0.85"
          />

          {/* Shaded Area Under Curve */}
          <path d={areaD} fill={currColor.fill} />

          {/* Telemetry Smooth Path */}
          <path d={pathD} fill="none" stroke={currColor.line} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Scrub Line & Tooltip */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + chartH}
                stroke="var(--text-secondary)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(values[hoveredIndex])}
                r="6"
                fill="#ffffff"
                stroke={currColor.line}
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.5))' }}
              />

              {/* Tooltip Card */}
              <g
                transform={`translate(${Math.max(
                  padding.left + 70,
                  Math.min(width - padding.right - 70, getX(hoveredIndex))
                )}, ${Math.max(padding.top + 25, getY(values[hoveredIndex]) - 40)})`}
              >
                <rect
                  x="-75"
                  y="-18"
                  width="150"
                  height="36"
                  rx="8"
                  fill="var(--bg-surface-elevated)"
                  stroke="var(--border-medium)"
                  style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))' }}
                />
                <text x="0" y="-1" fill="var(--text-primary)" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                  {values[hoveredIndex].toFixed(2)}%
                </text>
                <text x="0" y="12" fill="var(--text-tertiary)" fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">
                  {timestamps[hoveredIndex]}
                </text>
              </g>
            </g>
          )}

          {/* X-Axis Range Timestamps */}
          {timestamps.length > 0 && (
            <>
              <text x={padding.left} y={height - 12} fill="var(--text-tertiary)" fontSize="11" fontFamily="var(--font-mono)">
                {timestamps[0]}
              </text>
              <text x={width - padding.right} y={height - 12} fill="var(--text-tertiary)" fontSize="11" textAnchor="end" fontFamily="var(--font-mono)">
                {timestamps[timestamps.length - 1]} (Now)
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend & Stats Details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 3, background: currColor.line, borderRadius: 2 }} />
            <span style={{ color: 'var(--text-secondary)' }}>Live Telemetry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 2, background: '#30d158', borderTop: '2px dashed #30d158' }} />
            <span style={{ color: 'var(--text-secondary)' }}>MATLAB Mean (&mu;: {meanVal.toFixed(1)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 2, background: '#ff453a', borderTop: '2px dashed #ff453a' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Anomaly Boundary (&mu; + 2.5&sigma;: {upperThreshold.toFixed(1)}%)</span>
          </div>
        </div>

        <div className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          Sampling Rate: 4.0s &bull; Buffer: {samples.length} points
        </div>
      </div>
    </div>
  );
};
