import React from 'react';
import { MatlabPipelineOutput } from '../types';
import { Calculator } from 'lucide-react';

interface MatlabStatsTableProps {
  analysis?: MatlabPipelineOutput;
}

export const MatlabStatsTable: React.FC<MatlabStatsTableProps> = ({ analysis }) => {
  if (!analysis || !analysis.metrics) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        No MATLAB statistical analysis available yet. Click "Run MATLAB Analysis" above to generate.
      </div>
    );
  }

  const metrics = [
    { key: 'cpu', label: 'CPU Utilization (%)', block: analysis.metrics.cpu },
    { key: 'memory', label: 'Memory Usage (%)', block: analysis.metrics.memory },
    { key: 'disk', label: 'Disk Utilization (%)', block: analysis.metrics.disk },
    { key: 'networkRx', label: 'Network Rx (B/s)', block: analysis.metrics.networkRx },
    { key: 'networkTx', label: 'Network Tx (B/s)', block: analysis.metrics.networkTx },
  ];

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={20} color="#8b5cf6" />
            <h2 className="title-md">MATLAB Descriptive &amp; Distribution Statistics</h2>
          </div>
          <p className="text-muted">Rigorous numerical evaluation derived from genuine MATLAB .m mathematical routines</p>
        </div>
        <div className="status-badge matlab">
          <span>Engine: {analysis.engineInfo}</span>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table code-font">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Count (N)</th>
              <th>Mean (&mu;)</th>
              <th>Median (M)</th>
              <th>Std Dev (&sigma;)</th>
              <th>Min / Max</th>
              <th>IQR (Q3-Q1)</th>
              <th>P90</th>
              <th>P95</th>
              <th>P99</th>
              <th>MA (5-pt)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label, block }) => {
              if (!block || !block.stats) return null;
              const s = block.stats;
              return (
                <tr key={key}>
                  <td style={{ fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-sans)' }}>{label}</td>
                  <td>{s.count}</td>
                  <td style={{ color: '#38bdf8', fontWeight: 600 }}>{s.mean.toFixed(2)}</td>
                  <td>{s.median.toFixed(2)}</td>
                  <td style={{ color: '#f59e0b' }}>{s.std.toFixed(2)}</td>
                  <td>
                    {s.min.toFixed(1)} / {s.max.toFixed(1)}
                  </td>
                  <td>{s.iqr.toFixed(2)}</td>
                  <td>{s.p90.toFixed(2)}</td>
                  <td>{s.p95.toFixed(2)}</td>
                  <td style={{ color: '#ec4899', fontWeight: 600 }}>{s.p99.toFixed(2)}</td>
                  <td>{s.moving_avg_5.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Sample Window: {analysis.sampleCount} observations</span>
        <span>Pipeline Execution Latency: {analysis.pipelineExecutionTimeSec ? `${analysis.pipelineExecutionTimeSec.toFixed(3)}s` : 'N/A'}</span>
      </div>
    </div>
  );
};
