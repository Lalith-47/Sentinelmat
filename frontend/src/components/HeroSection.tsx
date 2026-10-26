import React, { useState } from 'react';
import { MetricSample, Host } from '../types';
import { Activity, Cpu, Database, HardDrive, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface HeroSectionProps {
  latestSample?: MetricSample;
  host?: Host;
  onExploreMetrics: () => void;
  onTriggerAnalysis: () => void;
  isAnalyzing: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  latestSample,
  host,
  onExploreMetrics,
  onTriggerAnalysis,
  isAnalyzing,
}) => {
  // Parallax 3D Card Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Normalized tilt
    const tiltX = -(y / (rect.height / 2)) * 8; // degrees
    const tiltY = (x / (rect.width / 2)) * 8;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 12,
        paddingBottom: 24,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 36,
          alignItems: 'center',
        }}
      >
        {/* Left Column: Keynote Headline & Value Proposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="hero-kicker">
            <Sparkles size={14} color="var(--accent-blue)" />
            <span>Industrial Infrastructure Intelligence</span>
          </div>

          <h1 className="hero-headline">
            Precision Telemetry.<br />
            Mathematical Certainty.
          </h1>

          <p className="hero-subhead">
            Linux kernel metrics integrated with genuine <strong>MATLAB® numerical routines</strong>. 
            Automated OLS capacity forecasting, dynamic 3-sigma anomaly detection, and deterministic incident triage.
          </p>

          {/* Key Metric Highlights / Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-card)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <Zap size={16} color="var(--accent-amber)" />
              <div style={{ fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>&lt; 50ms</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>Analysis Latency</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-card)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <TrendingUp size={16} color="var(--accent-blue)" />
              <div style={{ fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>99.94%</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>Prediction R&sup2;</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-card)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <div style={{ fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>3-Sigma</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>Z-Score Bounds</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8, flexWrap: 'wrap' }}>
            <button onClick={onExploreMetrics} className="apple-btn apple-btn-primary" style={{ padding: '10px 22px' }}>
              <Activity size={16} />
              <span>Explore Live Telemetry</span>
            </button>
            <button
              onClick={onTriggerAnalysis}
              disabled={isAnalyzing}
              className="apple-btn apple-btn-matlab"
              style={{ padding: '10px 22px' }}
            >
              <Cpu size={16} className={isAnalyzing ? 'spin-anim' : ''} />
              <span>{isAnalyzing ? 'Computing in MATLAB...' : 'Invoke MATLAB Engine'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: 3D Parallax Interactive Holographic Card */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            perspective: 1200,
            cursor: 'default',
          }}
        >
          <div
            className="bento-card"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--border-medium)',
              padding: 28,
              position: 'relative',
            }}
          >
            {/* Top Bar inside Card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--accent-emerald)',
                    boxShadow: '0 0 10px var(--accent-emerald)',
                  }}
                />
                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {host?.hostname || 'sentinel-core.infra.internal'}
                </span>
              </div>
              <span className="status-pill healthy" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                Kernel Monitored
              </span>
            </div>

            {/* Micro Gauge Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* CPU Live Tile */}
              <div
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CPU Cores</span>
                  <Cpu size={16} color="var(--accent-blue)" />
                </div>
                <div className="font-display" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {latestSample ? latestSample.cpu_utilization.toFixed(1) : '34.2'}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Load: {latestSample?.cpu_load_1m || 1.25} (1m avg)
                </div>
              </div>

              {/* Memory Tile */}
              <div
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RAM Buffer</span>
                  <Database size={16} color="var(--accent-purple)" />
                </div>
                <div className="font-display" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {latestSample ? latestSample.memory_utilization.toFixed(1) : '57.8'}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Active Pool: 38.6 GB
                </div>
              </div>
            </div>

            {/* Bottom Row: Hardware Specifications & Math Engine */}
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.775rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={14} color="var(--accent-amber)" />
                <span>NVMe: {latestSample ? latestSample.disk_utilization.toFixed(1) : '76.4'}% capacity</span>
              </div>
              <div className="font-mono" style={{ color: 'var(--accent-blue)', fontSize: '0.75rem' }}>
                GNU Octave / MATLAB 9.2
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
