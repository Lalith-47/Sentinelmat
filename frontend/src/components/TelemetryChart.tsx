import React, { useState } from 'react';
import { MetricSample, DescriptiveStats } from '../types';

interface TelemetryChartProps {
  samples: MetricSample[];
  stats?: DescriptiveStats;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ samples, stats }) => {
  const [metricKey, setMetricKey] = useState<'cpu' | 'memory' | 'disk'>('cpu');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!samples || samples.length === 0) {
    return (
      <div className="glass-card" style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
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
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

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
    cpu: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)', label: 'CPU Utilization (%)' },
    memory: { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', label: 'Memory Utilization (%)' },
    disk: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', label: 'Disk Utilization (%)' },
  };

  const currColor = metricColors[metricKey];

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header & Metric Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="title-md">Infrastructure Telemetry Stream</h2>
          <p className="text-muted">Real-time measurements with MATLAB rolling baseline and anomaly boundary</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['cpu', 'memory', 'disk'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setMetricKey(key)}
              className={`btn ${metricKey === key ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {key.toUpperCase()}
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
        >
          {/* Y-Axis Grid Lines & Labels */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
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
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Upper Anomaly Threshold Line (+2.5 sigma) */}
          <line
            x1={padding.left}
            y1={getY(upperThreshold)}
            x2={width - padding.right}
            y2={getY(upperThreshold)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            opacity="0.8"
          />

          {/* Shaded Area */}
          <path d={areaD} fill={currColor.fill} />

          {/* Telemetry Line */}
          <path d={pathD} fill="none" stroke={currColor.line} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Hover Indicators */}
          {values.map((v, i) => {
            const x = getX(i);
            const y = getY(v);
            const isHovered = hoveredIndex === i;
            return (
              <g key={i} onMouseEnter={() => setHoveredIndex(i)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={isHovered ? 6 : 3} fill={isHovered ? '#fff' : currColor.line} stroke="#111622" strokeWidth="2" />
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <g transform={`translate(${getX(hoveredIndex)}, ${getY(values[hoveredIndex]) - 40})`}>
              <rect x="-60" y="-12" width="120" height="32" rx="6" fill="#1e2638" stroke="var(--border-hover)" />
              <text x="0" y="2" fill="#fff" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="var(--font-mono)">
                {values[hoveredIndex].toFixed(2)}% ({timestamps[hoveredIndex]})
              </text>
            </g>
          )}

          {/* X-Axis Labels */}
          {timestamps.length > 0 && (
            <>
              <text x={padding.left} y={height - 8} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">
                {timestamps[0]}
              </text>
              <text x={width - padding.right} y={height - 8} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
                {timestamps[timestamps.length - 1]}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 3, background: currColor.line, borderRadius: 2 }} />
          <span>Observed Telemetry</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 2, background: '#10b981', borderTop: '2px dashed #10b981' }} />
          <span>MATLAB Baseline Mean (&mu;: {meanVal.toFixed(1)}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 2, background: '#ef4444', borderTop: '2px dashed #ef4444' }} />
          <span>Anomaly Threshold (&mu; + 2.5&sigma;: {upperThreshold.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};
