import React, { useState } from 'react';
import { AnomalyRecord } from '../types';
import { AlertTriangle, Filter } from 'lucide-react';

interface AnomaliesListProps {
  anomalies: AnomalyRecord[];
}

export const AnomaliesList: React.FC<AnomaliesListProps> = ({ anomalies }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filtered = anomalies.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <h2 className="title-md">Statistical Anomalies Log</h2>
          </div>
          <p className="text-muted">Anomalies flagged by MATLAB rolling baseline standard deviation scoring</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="form-select code-font"
            style={{ width: 'auto', padding: '6px 12px' }}
          >
            <option value="all">All Severities ({anomalies.length})</option>
            <option value="warning">Warning Only</option>
            <option value="critical">Critical Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No statistical anomalies detected. Infrastructure operating within normal standard deviation baselines.
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Metric</th>
                <th>Time</th>
                <th>Observed</th>
                <th>Baseline (&mu; &plusmn; &sigma;)</th>
                <th>Z-Score</th>
                <th>Statistical Rationale</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={`status-badge ${item.severity}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="code-font" style={{ fontWeight: 600 }}>{item.metric_type.toUpperCase()}</td>
                  <td className="code-font text-muted">{new Date(item.detected_at).toLocaleString()}</td>
                  <td className="code-font" style={{ fontWeight: 700, color: item.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                    {item.observed_value.toFixed(2)}
                  </td>
                  <td className="code-font text-muted">
                    {item.baseline_mean.toFixed(1)} &plusmn; {item.baseline_std.toFixed(2)}
                  </td>
                  <td className="code-font" style={{ fontWeight: 700, color: '#ec4899' }}>
                    Z = {item.z_score.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
