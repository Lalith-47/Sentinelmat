import React, { useState } from 'react';
import { AnomalyRecord } from '../types';
import { AlertTriangle, Filter, CheckCircle2 } from 'lucide-react';

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
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <AlertTriangle size={18} color="var(--accent-amber)" />
            </div>
            <h2 className="section-title">Statistical Anomalies Ledger</h2>
          </div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            Anomalies flagged by MATLAB rolling baseline standard deviation scoring (|Z| &ge; 2.5&sigma;)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="var(--text-tertiary)" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="cupertino-select font-mono"
            style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <option value="all">All Severities ({anomalies.length})</option>
            <option value="warning">Warning Only</option>
            <option value="high">High Only</option>
            <option value="critical">Critical Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Anomalies Detected</div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            Infrastructure is operating inside healthy 3-sigma statistical baselines.
          </p>
        </div>
      ) : (
        <div className="table-viewport">
          <table className="apple-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Metric Stream</th>
                <th>Timestamp</th>
                <th>Observed</th>
                <th>Baseline (&mu; &plusmn; &sigma;)</th>
                <th>Z-Score</th>
                <th>Mathematical Explanation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={`status-pill ${item.severity}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.metric_type.toUpperCase()}
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    {new Date(item.detected_at).toLocaleString()}
                  </td>
                  <td
                    className="font-mono"
                    style={{
                      fontWeight: 700,
                      color: item.severity === 'critical' ? 'var(--accent-crimson)' : 'var(--accent-amber)',
                    }}
                  >
                    {item.observed_value.toFixed(2)}
                  </td>
                  <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {item.baseline_mean.toFixed(1)} &plusmn; {item.baseline_std.toFixed(2)}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>
                    Z = {item.z_score.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
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
