import React, { useState } from 'react';
import { SimulationItem } from '../types';
import { Flame, Cpu, Database, HardDrive, Square, ShieldCheck, Zap } from 'lucide-react';

interface SimulationPanelProps {
  activeSimulations: SimulationItem[];
  onStartSimulation: (type: 'cpu' | 'memory' | 'disk' | 'network', duration: number) => Promise<void>;
  onStopSimulation: (id: string) => Promise<void>;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  activeSimulations,
  onStartSimulation,
  onStopSimulation,
}) => {
  const [duration, setDuration] = useState<number>(30);
  const [isTriggering, setIsTriggering] = useState(false);

  const handleStart = async (type: 'cpu' | 'memory' | 'disk' | 'network') => {
    setIsTriggering(true);
    try {
      await onStartSimulation(type, duration);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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
            <Flame size={18} color="var(--accent-amber)" />
          </div>
          <h2 className="section-title">Controlled Fault Simulation Studio</h2>
        </div>
        <p className="section-desc" style={{ marginTop: 4 }}>
          Reproduce realistic infrastructure stress in a strictly-bounded sandbox to verify MATLAB statistical anomaly triggers and capacity models
        </p>
      </div>

      {/* Strict Safety Banner */}
      <div
        style={{
          background: 'var(--accent-blue-bg)',
          border: '1px solid rgba(41, 151, 255, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: '0.825rem',
          color: 'var(--text-primary)',
        }}
      >
        <ShieldCheck size={22} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
        <div>
          <strong>Deterministic Safety Boundaries:</strong> All simulated loads are bounded by strict cgroups
          ceilings (memory allocation is capped to 20% available RAM, disk growth writes to disposable scratch volumes
          with automatic garbage collection upon test completion).
        </div>
      </div>

      {/* Duration Control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Simulation Duration:
        </span>
        <div className="segmented-control">
          {[15, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`segmented-tab ${duration === d ? 'active' : ''}`}
              style={{ padding: '4px 14px' }}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Trigger Bento Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
        {/* CPU Spike */}
        <div
          className="bento-card"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--accent-blue-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={16} color="var(--accent-blue)" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Multi-Core CPU Spike</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Executes bounded arithmetic matrix multiplication to drive Z-Score &gt; 3.0 anomaly boundary breach.
            </p>
          </div>

          <button
            className="apple-btn apple-btn-glass"
            style={{ width: '100%', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
            disabled={isTriggering}
            onClick={() => handleStart('cpu')}
          >
            <Zap size={14} />
            <span>Simulate CPU Load ({duration}s)</span>
          </button>
        </div>

        {/* Memory Leak */}
        <div
          className="bento-card"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--accent-purple-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={16} color="var(--accent-purple)" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>RAM Buffer Pressure</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Allocates temporary heap buffers with memory page touches, verifying kernel cgroup thresholds.
            </p>
          </div>

          <button
            className="apple-btn apple-btn-glass"
            style={{ width: '100%', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
            disabled={isTriggering}
            onClick={() => handleStart('memory')}
          >
            <Zap size={14} />
            <span>Simulate Memory Surge ({duration}s)</span>
          </button>
        </div>

        {/* Disk Growth */}
        <div
          className="bento-card"
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'var(--accent-amber-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HardDrive size={16} color="var(--accent-amber)" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Monotonic Storage Drift</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generates linear disk writes on disposable scratch volumes to validate MATLAB OLS Time-To-Exhaustion (TTE).
            </p>
          </div>

          <button
            className="apple-btn apple-btn-glass"
            style={{ width: '100%', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
            disabled={isTriggering}
            onClick={() => handleStart('disk')}
          >
            <Zap size={14} />
            <span>Simulate Storage Drift ({duration}s)</span>
          </button>
        </div>
      </div>

      {/* Active Simulations Monitor */}
      {activeSimulations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--accent-amber)' }}>
            Active Sandbox Processes:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeSimulations.map((sim) => (
              <div
                key={sim.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--accent-amber-bg)',
                  border: '1px solid rgba(255, 159, 10, 0.3)',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="status-dot warning" />
                  <span className="font-mono" style={{ fontWeight: 700 }}>
                    {sim.id}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ({sim.type.toUpperCase()} execution for {sim.durationSeconds}s)
                  </span>
                </div>

                {sim.status === 'running' && (
                  <button
                    className="apple-btn apple-btn-danger"
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                    onClick={() => onStopSimulation(sim.id)}
                  >
                    <Square size={12} />
                    <span>Terminate Process</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
