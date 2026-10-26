import React, { useState } from 'react';
import { SimulationItem } from '../types';
import { Flame, Cpu, Database, HardDrive, Square, AlertOctagon } from 'lucide-react';

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
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={20} color="#f59e0b" />
          <h2 className="title-md">Controlled Fault Simulation Studio</h2>
        </div>
        <p className="text-muted">
          Reproduce real infrastructure stress in a safe, strictly-bounded sandbox to verify MATLAB anomaly detection and capacity forecasting.
        </p>
      </div>

      {/* Safety Notice Box */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: '0.85rem',
        color: '#93c5fd'
      }}>
        <AlertOctagon size={20} color="#60a5fa" style={{ flexShrink: 0 }} />
        <div>
          <strong>Strict Safety Boundaries Active:</strong> Memory pressure is capped to 20% free RAM; disk growth runs on a disposable scratch volume with instant automatic cleanup; all simulations have hard watchdog timers.
        </div>
      </div>

      {/* Duration Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Simulation Duration:</span>
        {[15, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`btn ${duration === d ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
          >
            {d}s
          </button>
        ))}
      </div>

      {/* Trigger Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* CPU Stress */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <Cpu size={18} color="#3b82f6" />
            <span>CPU Stress Spike</span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Fires multi-core arithmetic load to trigger statistical Z-Score &gt; 3.0 anomaly.
          </p>
          <button
            className="btn btn-outline"
            style={{ marginTop: 'auto', borderColor: '#3b82f6', color: '#60a5fa' }}
            disabled={isTriggering}
            onClick={() => handleStart('cpu')}
          >
            Trigger CPU Stress ({duration}s)
          </button>
        </div>

        {/* Memory Pressure */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <Database size={18} color="#8b5cf6" />
            <span>Memory Pressure</span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Commits bounded RAM buffer (350MB) with page touches, safely released.
          </p>
          <button
            className="btn btn-outline"
            style={{ marginTop: 'auto', borderColor: '#8b5cf6', color: '#c084fc' }}
            disabled={isTriggering}
            onClick={() => handleStart('memory')}
          >
            Trigger Memory Pressure ({duration}s)
          </button>
        </div>

        {/* Disk Growth */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <HardDrive size={18} color="#f59e0b" />
            <span>Gradual Disk Growth</span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Writes dummy volume chunks to verify MATLAB linear regression &amp; TTE.
          </p>
          <button
            className="btn btn-outline"
            style={{ marginTop: 'auto', borderColor: '#f59e0b', color: '#fbbf24' }}
            disabled={isTriggering}
            onClick={() => handleStart('disk')}
          >
            Trigger Disk Growth ({duration}s)
          </button>
        </div>
      </div>

      {/* Active Simulations Status */}
      {activeSimulations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: '#f59e0b' }}>
            Active Simulation Processes:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeSimulations.map((sim) => (
              <div
                key={sim.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '8px 14px',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="pulsing-dot warning" />
                  <span className="code-font" style={{ fontWeight: 600 }}>{sim.id}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ({sim.type.toUpperCase()} for {sim.durationSeconds}s)
                  </span>
                </div>
                {sim.status === 'running' && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => onStopSimulation(sim.id)}
                  >
                    <Square size={12} />
                    <span>Stop Process</span>
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
