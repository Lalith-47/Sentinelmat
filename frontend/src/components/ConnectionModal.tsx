import React, { useState } from 'react';
import {
  getStoredBackendUrl,
  setStoredBackendUrl,
  isForceDemoMode,
  setForceDemoMode,
  api,
} from '../services/api';
import { Globe, Radio, CheckCircle, XCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
}) => {
  const [backendUrl, setBackendUrl] = useState(getStoredBackendUrl());
  const [demoMode, setDemoMode] = useState(isForceDemoMode());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.pingBackend(backendUrl);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setStoredBackendUrl(backendUrl);
    setForceDemoMode(demoMode);
    onConnectionChange();
    onClose();
  };

  return (
    <div className="apple-modal-overlay" onClick={onClose}>
      <div className="apple-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--accent-blue-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Globe size={22} />
            </div>
            <div>
              <h2 className="section-title" style={{ fontSize: '1.25rem' }}>Engine Connection &amp; Vercel Bridge</h2>
              <p className="section-desc">Connect frontend on Vercel to your local backend engine or public tunnel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-btn apple-btn-glass"
            style={{ width: 34, height: 34, padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* How it works note */}
        <div
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: '0.825rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            <span>Hybrid Architecture Explained</span>
          </div>
          When SentinelMAT frontend is deployed on Vercel, the MATLAB engine, database, and telemetry collector continue running locally.
          To stream live telemetry into your deployed Vercel frontend, expose your local backend (port 5000) using a secure HTTPS tunnel:
          <div className="font-mono" style={{ background: 'var(--bg-base)', padding: '6px 10px', borderRadius: 6, margin: '8px 0', color: 'var(--accent-cyan)' }}>
            ngrok http 5000 &nbsp;or&nbsp; cloudflared tunnel --url http://localhost:5000
          </div>
          Paste the resulting HTTPS URL below, or run in <strong>Interactive Enterprise Simulation Mode</strong> for zero-config presentation.
        </div>

        {/* Mode Toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Engine Operating Mode:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div
              onClick={() => setDemoMode(false)}
              style={{
                border: `1.5px solid ${!demoMode ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                background: !demoMode ? 'var(--accent-blue-bg)' : 'var(--bg-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: !demoMode ? 'var(--accent-blue)' : 'var(--text-primary)', marginBottom: 2 }}>
                Live Backend Engine
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Streams directly from localhost or public tunnel URL
              </div>
            </div>

            <div
              onClick={() => setDemoMode(true)}
              style={{
                border: `1.5px solid ${demoMode ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                background: demoMode ? 'var(--accent-purple-bg)' : 'var(--bg-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: demoMode ? 'var(--accent-purple)' : 'var(--text-primary)', marginBottom: 2 }}>
                Enterprise Simulator
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Autonomous simulation with full mathematical OLS &amp; Z-scores
              </div>
            </div>
          </div>
        </div>

        {/* Backend URL Input */}
        {!demoMode && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Backend API Base URL:
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="cupertino-input font-mono"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:5000 or https://xyz.ngrok-free.app"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !backendUrl}
                className="apple-btn apple-btn-glass"
                style={{ padding: '0 16px', flexShrink: 0 }}
              >
                {testing ? <RefreshCw size={15} className="spin-anim" /> : <Radio size={15} />}
                <span>{testing ? 'Testing...' : 'Ping'}</span>
              </button>
            </div>

            {/* Test Feedback */}
            {testResult && (
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: testResult.ok ? 'var(--color-healthy-bg)' : 'var(--color-critical-bg)',
                  color: testResult.ok ? 'var(--color-healthy)' : 'var(--color-critical)',
                  border: `1px solid ${testResult.ok ? 'rgba(48,209,88,0.3)' : 'rgba(255,69,58,0.3)'}`,
                }}
              >
                {testResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>
                  {testResult.ok
                    ? `Connection successful (${testResult.latencyMs}ms latency)`
                    : `Connection failed: ${testResult.error}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="apple-btn apple-btn-glass">
            Cancel
          </button>
          <button onClick={handleSave} className="apple-btn apple-btn-primary">
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
