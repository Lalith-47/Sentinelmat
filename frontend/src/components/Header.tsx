import React from 'react';
import { Host, HostStatus } from '../types';
import { Activity, Server, Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  hosts: Host[];
  selectedHostId: string;
  onSelectHost: (id: string) => void;
  healthState: HostStatus;
  lastSampleTime?: string;
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
  matlabEngineInfo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  hosts,
  selectedHostId,
  onSelectHost,
  healthState,
  lastSampleTime,
  isAnalyzing,
  onTriggerAnalysis,
  matlabEngineInfo,
}) => {
  // Compute staleness (if last sample > 15 seconds ago)
  const isStale = React.useMemo(() => {
    if (!lastSampleTime) return true;
    const diffSec = (Date.now() - new Date(lastSampleTime).getTime()) / 1000;
    return diffSec > 15;
  }, [lastSampleTime]);

  return (
    <header className="glass-card" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '16px 28px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
            padding: 10,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)'
          }}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>SentinelMAT</h1>
              <span className={`status-badge ${healthState}`}>
                <span className={`pulsing-dot ${healthState}`} />
                {healthState}
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Intelligent Infrastructure Monitoring &amp; MATLAB Numerical Fault Prediction
            </p>
          </div>
        </div>

        {/* Host Selector & Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Host Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface-elevated)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <Server size={16} color="var(--text-secondary)" />
            <select
              value={selectedHostId}
              onChange={(e) => onSelectHost(e.target.value)}
              className="code-font"
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {hosts.map((h) => (
                <option key={h.id} value={h.id} style={{ background: '#111622', color: '#fff' }}>
                  {h.hostname} ({h.id})
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Stream Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: isStale ? 'var(--color-warning)' : 'var(--color-healthy)' }}>
            <span className={`pulsing-dot ${isStale ? 'warning' : 'healthy'}`} />
            <span>{isStale ? 'Stale Stream' : 'Live Stream'}</span>
          </div>

          {/* MATLAB Engine Status Pill */}
          <div className="status-badge matlab" title={matlabEngineInfo || 'MATLAB Numerical Engine'}>
            <Cpu size={14} />
            <span>MATLAB / Octave Active</span>
          </div>

          {/* Run Analysis Trigger Button */}
          <button
            className="btn btn-matlab"
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            title="Invoke genuine MATLAB .m numerical analysis on collected telemetry"
          >
            <RefreshCw size={15} className={isAnalyzing ? 'spin-animation' : ''} />
            <span>{isAnalyzing ? 'Analyzing in MATLAB...' : 'Run MATLAB Analysis'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
