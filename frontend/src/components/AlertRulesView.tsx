import React from 'react';
import { AlertRule } from '../types';
import { Bell, Send } from 'lucide-react';

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
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} color="#3b82f6" />
            <h2 className="title-md">Alert Rules &amp; Notification Configuration</h2>
          </div>
          <p className="text-muted">Thresholds, statistical Z-score triggers, capacity exhaustion limits, and Telegram dispatch</p>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Metric</th>
              <th>Condition</th>
              <th>Threshold</th>
              <th>Severity</th>
              <th>Cooldown</th>
              <th>Telegram</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td style={{ fontWeight: 600 }}>{rule.name}</td>
                <td className="code-font text-muted">{rule.metric_type.toUpperCase()}</td>
                <td className="code-font" style={{ color: '#38bdf8' }}>
                  {rule.condition === 'gt' ? '> Value' : rule.condition === 'lt' ? '< Value' : rule.condition === 'z_score_gt' ? 'Z-Score >' : 'TTE < (hrs)'}
                </td>
                <td className="code-font" style={{ fontWeight: 700 }}>
                  {rule.threshold_value}
                </td>
                <td>
                  <span className={`status-badge ${rule.severity}`}>{rule.severity}</span>
                </td>
                <td className="code-font text-muted">{rule.cooldown_minutes} min</td>
                <td>
                  <button
                    className={`btn ${rule.notify_telegram ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={() => onToggleTelegram(rule.id, !rule.notify_telegram)}
                    title={rule.notify_telegram ? 'Telegram notifications active' : 'Enable Telegram notifications'}
                  >
                    <Send size={12} />
                    <span>{rule.notify_telegram ? 'ON' : 'OFF'}</span>
                  </button>
                </td>
                <td>
                  <button
                    className={`btn ${rule.enabled ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      background: rule.enabled ? '#059669' : 'transparent',
                      color: rule.enabled ? '#fff' : 'var(--text-muted)',
                    }}
                    onClick={() => onToggleRule(rule.id, !rule.enabled)}
                  >
                    {rule.enabled ? 'ENABLED' : 'PAUSED'}
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
