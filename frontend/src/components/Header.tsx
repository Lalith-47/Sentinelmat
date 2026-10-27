import React from 'react';
import { Host, HostStatus } from '../types';
import { Activity, Server, RefreshCw, Sun, Moon, Globe } from 'lucide-react';

interface HeaderProps {
  hosts: Host[];
  selectedHostId: string;
  onSelectHost: (id: string) => void;
  healthState: HostStatus;
  lastSampleTime?: string;
  isAnalyzing: boolean;
  onTriggerAnalysis: () => void;
  matlabEngineInfo?: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenConnectionModal: () => void;
  isDemoMode: boolean;
  onResetToOverview?: () => void;
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
  theme,
  onToggleTheme,
  onOpenConnectionModal,
  isDemoMode,
  onResetToOverview,
}) => {
  // Compute staleness (if last sample > 15 seconds ago)
  const isStale = React.useMemo(() => {
    if (!lastSampleTime) return false;
    const diffSec = (Date.now() - new Date(lastSampleTime).getTime()) / 1000;
    return diffSec > 15;
  }, [lastSampleTime]);

  const handleBrandClick = () => {
    if (onResetToOverview) {
      onResetToOverview();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar-shell">
      <div className="navbar-inner">
        {/* Brand Lockup */}
        <div className="brand-lockup" onClick={handleBrandClick} style={{ cursor: 'pointer' }} title="Return to Overview">
          <div className="brand-icon-box">
            <Activity size={22} color="#ffffff" />
          </div>
          <div className="brand-text-box">
            <h1>
              <span>SentinelMAT</span>
              <span className={`status-pill ${healthState}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                <span className={`status-dot ${healthState}`} />
                {healthState}
              </span>
            </h1>
            <p>Infrastructure Telemetry &amp; MATLAB® Fault Intelligence</p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Host Selector Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontSize: '0.8rem',
            }}
          >
            <Server size={14} color="var(--text-secondary)" />
            <select
              value={selectedHostId}
              onChange={(e) => onSelectHost(e.target.value)}
              className="font-mono"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {hosts.map((h) => (
                <option
                  key={h.id}
                  value={h.id}
                  style={{
                    background: theme === 'dark' ? '#18181b' : '#ffffff',
                    color: theme === 'dark' ? '#f4f4f5' : '#18181b',
                  }}
                >
                  {h.hostname} ({h.cpu_count}C &bull; {(h.total_memory_bytes / 1e9).toFixed(0)}GB)
                </option>
              ))}
            </select>
          </div>

          {/* Engine Bridge / Connection Status Button */}
          <button
            onClick={onOpenConnectionModal}
            className="apple-btn apple-btn-glass"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            title="Configure Backend Connection & Vercel Bridge"
          >
            <Globe size={14} color={isDemoMode ? 'var(--accent-purple)' : 'var(--accent-blue)'} />
            <span>{isDemoMode ? 'Simulator' : 'Live Engine'}</span>
          </button>

          {/* Telemetry Stream Status Pill */}
          <div
            className={`status-pill ${isStale ? 'warning' : 'healthy'}`}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <span className={`status-dot ${isStale ? 'warning' : 'healthy'}`} />
            <span>{isStale ? 'Stale Stream' : 'Live Pulse • 1.5s'}</span>
          </div>

          {/* Light / Dark Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="apple-btn apple-btn-glass"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun size={15} color="#f59e0b" />
            ) : (
              <Moon size={15} color="#0071e3" />
            )}
            <span style={{ fontSize: '0.78rem' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* MATLAB Analysis Action Button */}
          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            className="apple-btn apple-btn-matlab"
            style={{ padding: '7px 16px', fontSize: '0.82rem' }}
            title={matlabEngineInfo || 'Invoke genuine MATLAB .m numerical analysis'}
          >
            <RefreshCw size={14} className={isAnalyzing ? 'spin-anim' : ''} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Run MATLAB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
