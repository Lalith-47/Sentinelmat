import React from 'react';
import { AlertRule } from '../types';
import { Bell, Send, CheckCircle2 } from 'lucide-react';

interface AlertRulesViewProps {
  rules: AlertRule[];
  onToggleRule: (id: number, enabled: boolean) => Promise<void>;
  onToggleTelegram: (id: number, notify: boolean) => Promise<void>;
}

export const AlertRulesView: React.FC<AlertRulesViewProps> = ({
  rules,
  onToggleRule,
  onToggleTelegram,
}) => {
  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--accent-blue-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} color="var(--accent-blue)" />
            </div>
            <h2 className="section-title">Telemetry Rules &amp; Automated Guardrails</h2>
          </div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            Statistical Z-score thresholds, monotonic capacity exhaustion limits, and Telegram dispatcher
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="table-viewport">
        <table className="apple-table">
          <thead>
            <tr>
              <th>Guardrail Name</th>
              <th>Target Metric</th>
              <th>Mathematical Condition</th>
              <th>Threshold</th>
              <th>Severity</th>
              <th>Cooldown</th>
              <th>Telegram Dispatch</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</td>
                <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {rule.metric_type.toUpperCase()}
                </td>
                <td className="font-mono" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                  {rule.condition === 'gt'
                    ? '> Value'
                    : rule.condition === 'lt'
                    ? '< Value'
                    : rule.condition === 'z_score_gt'
                    ? 'Z-Score >'
                    : 'TTE < (hrs)'}
                </td>
                <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {rule.threshold_value}
                </td>
                <td>
                  <span className={`status-pill ${rule.severity}`}>{rule.severity}</span>
                </td>
                <td className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  {rule.cooldown_minutes} min
                </td>
                <td>
                  <button
                    className={`apple-btn ${rule.notify_telegram ? 'apple-btn-primary' : 'apple-btn-glass'}`}
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                    onClick={() => onToggleTelegram(rule.id, !rule.notify_telegram)}
                    title={rule.notify_telegram ? 'Telegram active' : 'Enable Telegram'}
                  >
                    <Send size={12} />
                    <span>{rule.notify_telegram ? 'Active' : 'Muted'}</span>
                  </button>
                </td>
                <td>
                  <button
                    className="apple-btn"
                    style={{
                      padding: '4px 14px',
                      fontSize: '0.75rem',
                      background: rule.enabled ? 'var(--color-healthy-bg)' : 'var(--bg-hover)',
                      color: rule.enabled ? 'var(--color-healthy)' : 'var(--text-tertiary)',
                      border: `1px solid ${rule.enabled ? 'rgba(48,209,88,0.3)' : 'var(--border-subtle)'}`,
                    }}
                    onClick={() => onToggleRule(rule.id, !rule.enabled)}
                  >
                    <CheckCircle2 size={12} />
                    <span>{rule.enabled ? 'ARMED' : 'PAUSED'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
