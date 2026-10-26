import React from 'react';
import { ForecastResult, PredictionEvaluation } from '../types';
import { TrendingUp, Clock, CheckCircle, Cpu } from 'lucide-react';

interface ForecastChartProps {
  forecast?: ForecastResult;
  evaluation?: PredictionEvaluation;
  metricTitle?: string;
  historicalValues?: number[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecast,
  evaluation,
  metricTitle = 'Storage Exhaustion Model (OLS Regression)',
  historicalValues = [],
}) => {
  if (!forecast) {
    return (
      <div className="bento-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Cpu size={32} color="var(--accent-purple)" style={{ marginBottom: 12 }} />
        <h3 className="section-title">MATLAB Predictive Engine Ready</h3>
        <p className="section-desc" style={{ marginTop: 6 }}>
          Run MATLAB Analysis above to generate Ordinary Least Squares (OLS) capacity exhaustion forecasts.
        </p>
      </div>
    );
  }

  // Combine historical and projected data points for visualization
  const history = historicalValues.length > 0 ? historicalValues.slice(-24) : [62, 64, 65, 68, 70, 72];
  const projected = forecast.projectedValues || [];

  const width = 900;
  const height = 320;
  const padding = { top: 35, right: 45, bottom: 45, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const totalPoints = history.length + projected.length;
  const targetThreshold = forecast.targetThreshold || 90.0;

  const getX = (idx: number) => padding.left + (idx / Math.max(1, totalPoints - 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - (Math.min(100, Math.max(0, val)) / 100) * chartH;

  // Historical path
  const histPoints = history.map((v, i) => `${getX(i)},${getY(v)}`);
  const histPathD = histPoints.length > 0 ? `M ${histPoints.join(' L ')}` : '';

  // Projected path connects from last historical point
  const lastHistIdx = history.length - 1;
  const projCoords = [
    `${getX(lastHistIdx)},${getY(history[lastHistIdx])}`,
    ...projected.map((v, i) => `${getX(lastHistIdx + 1 + i)},${getY(v)}`),
  ];
  const projPathD = `M ${projCoords.join(' L ')}`;

  const thresholdY = getY(targetThreshold);

  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <TrendingUp size={18} color="var(--accent-purple)" />
            </div>
            <h2 className="section-title">{metricTitle}</h2>
          </div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            Ordinary Least Squares (OLS) regression &amp; Time-To-Exhaustion (TTE) prediction derived via MATLAB .m routines
          </p>
        </div>

        {/* TTE Status Pill */}
        <div>
          {forecast.isPredictable && forecast.timeToExhaustionHours !== null ? (
            <div className="status-pill critical" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              <Clock size={16} />
              <span>Breach Horizon: {forecast.timeToExhaustionHours.toFixed(1)} hrs</span>
            </div>
          ) : (
            <div className="status-pill healthy" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              <CheckCircle size={16} />
              <span>Stable (No Monotonic Exhaustion)</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Projection Visualizer */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Y Grid */}
          {[0, 25, 50, 75, 90, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  fill={tick === targetThreshold ? 'var(--accent-crimson)' : 'var(--text-tertiary)'}
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Critical Threshold Line */}
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={width - padding.right}
            y2={thresholdY}
            stroke="#ff453a"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          <text
            x={width - padding.right - 10}
            y={thresholdY - 8}
            fill="#ff453a"
            fontSize="11"
            textAnchor="end"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            CRITICAL CAPACITY THRESHOLD ({targetThreshold}%)
          </text>

          {/* Historical Observed Path */}
          <path d={histPathD} fill="none" stroke="#ff9f0a" strokeWidth="2.8" strokeLinecap="round" />

          {/* Projected Path (Dashed Cyan) */}
          <path d={projPathD} fill="none" stroke="#64d2ff" strokeWidth="2.8" strokeDasharray="6 4" strokeLinecap="round" />

          {/* Historical Nodes */}
          {history.map((v, i) => (
            <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill="#ff9f0a" />
          ))}

          {/* Forecast Horizon Divider */}
          <line
            x1={getX(lastHistIdx)}
            y1={padding.top}
            x2={getX(lastHistIdx)}
            y2={padding.top + chartH}
            stroke="var(--text-tertiary)"
            strokeDasharray="2 2"
          />
          <text
            x={getX(lastHistIdx) - 8}
            y={padding.top + 16}
            fill="var(--text-tertiary)"
            fontSize="10"
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            Present Observation
          </text>
          <text
            x={getX(lastHistIdx) + 8}
            y={padding.top + 16}
            fill="#64d2ff"
            fontSize="10"
            textAnchor="start"
            fontWeight="600"
            fontFamily="var(--font-mono)"
          >
            Projected Horizon &rarr;
          </text>
        </svg>
      </div>

      {/* Regression Diagnostics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Growth Trajectory</div>
          <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: forecast.slope > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            {forecast.slopePerDay >= 0 ? `+${forecast.slopePerDay.toFixed(2)}` : forecast.slopePerDay.toFixed(2)}% / day
          </div>
        </div>

        <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Goodness of Fit (R&sup2;)</div>
          <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
            {forecast.rSquared.toFixed(3)}
          </div>
        </div>

        <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>In-Sample RMSE</div>
          <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
            {forecast.rmse.toFixed(3)}
          </div>
        </div>

        {evaluation && evaluation.status === 'valid' && (
          <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Out-of-Sample MAE</div>
            <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              {evaluation.outOfSampleMAE.toFixed(3)} ({evaluation.testCount} pts)
            </div>
          </div>
        )}
      </div>

      {/* Rationale explanation */}
      {forecast.reason && (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-hover)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--accent-purple)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Mathematical Interpretation:</strong> {forecast.reason}
        </div>
      )}
    </div>
  );
};
