import React from 'react';
import { ForecastResult, PredictionEvaluation } from '../types';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface ForecastChartProps {
  forecast?: ForecastResult;
  evaluation?: PredictionEvaluation;
  metricTitle?: string;
  historicalValues?: number[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecast,
  evaluation,
  metricTitle = 'Disk Capacity Exhaustion Model',
  historicalValues = [],
}) => {
  if (!forecast) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Run MATLAB Analysis to generate capacity exhaustion forecasts.
      </div>
    );
  }

  // Combine historical and projected data points for visualization
  const history = historicalValues.length > 0 ? historicalValues.slice(-20) : [60, 62, 64, 66, 68, 70];
  const projected = forecast.projectedValues || [];

  const width = 800;
  const height = 280;
  const padding = { top: 30, right: 40, bottom: 40, left: 50 };

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
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="#8b5cf6" />
            <h2 className="title-md">{metricTitle}</h2>
          </div>
          <p className="text-muted">Ordinary Least Squares (OLS) regression &amp; Time-To-Exhaustion (TTE) prediction</p>
        </div>

        {/* TTE Status Pill */}
        <div>
          {forecast.isPredictable && forecast.timeToExhaustionHours !== null ? (
            <div className="status-badge critical" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              <Clock size={16} />
              <span>Breach in {forecast.timeToExhaustionHours.toFixed(1)} hrs</span>
            </div>
          ) : (
            <div className="status-badge healthy" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              <CheckCircle size={16} />
              <span>Stable (No Exhaustion Projected)</span>
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
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} fill={tick === targetThreshold ? '#ef4444' : 'var(--text-muted)'} fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
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
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          <text x={width - padding.right - 5} y={thresholdY - 6} fill="#ef4444" fontSize="10" textAnchor="end" fontWeight="600" fontFamily="var(--font-mono)">
            Critical Threshold ({targetThreshold}%)
          </text>

          {/* Historical Observed Path */}
          <path d={histPathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Projected Path (Dashed Cyan) */}
          <path d={projPathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />

          {/* Dots on historical */}
          {history.map((v, i) => (
            <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill="#f59e0b" />
          ))}

          {/* Forecast Horizon Divider */}
          <line
            x1={getX(lastHistIdx)}
            y1={padding.top}
            x2={getX(lastHistIdx)}
            y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="2 2"
          />
          <text x={getX(lastHistIdx) - 6} y={padding.top + 14} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-mono)">
            Current Time
          </text>
          <text x={getX(lastHistIdx) + 6} y={padding.top + 14} fill="#06b6d4" fontSize="9" textAnchor="start" fontFamily="var(--font-mono)">
            Projected Horizon &rarr;
          </text>
        </svg>
      </div>

      {/* Regression Diagnostics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, paddingTop: 6 }}>
        <div style={{ background: 'var(--bg-surface-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Growth Rate</div>
          <div className="code-font" style={{ fontSize: '1.05rem', fontWeight: 600, color: forecast.slope > 0 ? '#f59e0b' : '#10b981' }}>
            {forecast.slopePerDay >= 0 ? `+${forecast.slopePerDay.toFixed(2)}` : forecast.slopePerDay.toFixed(2)}% / day
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Goodness of Fit (R&sup2;)</div>
          <div className="code-font" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#8b5cf6' }}>
            {forecast.rSquared.toFixed(3)}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>In-Sample RMSE</div>
          <div className="code-font" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#38bdf8' }}>
            {forecast.rmse.toFixed(3)}
          </div>
        </div>

        {evaluation && evaluation.status === 'valid' && (
          <div style={{ background: 'var(--bg-surface-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Out-of-Sample MAE</div>
            <div className="code-font" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#10b981' }}>
              {evaluation.outOfSampleMAE.toFixed(3)} ({evaluation.testCount} pts)
            </div>
          </div>
        )}
      </div>

      {/* Rationale explanation */}
      {forecast.reason && (
        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8 }}>
          <strong>Mathematical Interpretation:</strong> {forecast.reason}
        </div>
      )}
    </div>
  );
};
