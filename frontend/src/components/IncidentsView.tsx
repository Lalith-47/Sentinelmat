import React, { useState } from 'react';
import { IncidentRecord } from '../types';
import { ShieldAlert, CheckCircle2, UserCheck, X } from 'lucide-react';

interface IncidentsViewProps {
  incidents: IncidentRecord[];
  onAcknowledge: (id: number, user: string) => Promise<void>;
  onResolve: (id: number, notes: string) => Promise<void>;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onAcknowledge,
  onResolve,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [modalType, setModalType] = useState<'ack' | 'resolve' | null>(null);
  const [operatorName, setOperatorName] = useState('Senior SRE Engineer');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = incidents.filter((i) => {
    if (filterStatus === 'all') return true;
    return i.status === filterStatus;
  });

  const handleAction = async () => {
    if (!selectedIncident || !modalType) return;
    setIsSubmitting(true);
    try {
      if (modalType === 'ack') {
        await onAcknowledge(selectedIncident.id, operatorName);
      } else if (modalType === 'resolve') {
        await onResolve(selectedIncident.id, resolutionNotes || 'Resolved and root cause mitigated.');
      }
      setModalType(null);
      setSelectedIncident(null);
      setResolutionNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--accent-crimson-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={18} color="var(--accent-crimson)" />
            </div>
            <h2 className="section-title">Incident Lifecycle &amp; Triage</h2>
          </div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            Deterministic triaging, acknowledgment audits, and automated root cause resolution records
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="segmented-control">
          {(['all', 'open', 'acknowledged', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`segmented-tab ${filterStatus === st ? 'active' : ''}`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Matching Incidents</div>
          <p className="section-desc" style={{ marginTop: 4 }}>
            No incident records currently matching filter "{filterStatus}".
          </p>
        </div>
      ) : (
        <div className="table-viewport">
          <table className="apple-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Host Target</th>
                <th>Incident Details</th>
                <th>Observed</th>
                <th>Detected At</th>
                <th>Operations</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr key={inc.id}>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    #{inc.id}
                  </td>
                  <td>
                    <span className={`status-pill ${inc.severity}`}>{inc.severity}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        background:
                          inc.status === 'open'
                            ? 'var(--accent-crimson-bg)'
                            : inc.status === 'acknowledged'
                            ? 'var(--accent-amber-bg)'
                            : 'var(--accent-emerald-bg)',
                        color:
                          inc.status === 'open'
                            ? 'var(--accent-crimson)'
                            : inc.status === 'acknowledged'
                            ? 'var(--accent-amber)'
                            : 'var(--accent-emerald)',
                      }}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {inc.host_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inc.title}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{inc.summary}</div>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>
                    {inc.trigger_value.toFixed(1)}
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    {new Date(inc.created_at).toLocaleTimeString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {inc.status === 'open' && (
                        <button
                          className="apple-btn apple-btn-glass"
                          style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedIncident(inc);
                            setModalType('ack');
                          }}
                        >
                          <UserCheck size={13} />
                          <span>Acknowledge</span>
                        </button>
                      )}
                      {inc.status !== 'resolved' && (
                        <button
                          className="apple-btn apple-btn-primary"
                          style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedIncident(inc);
                            setModalType('resolve');
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Acknowledge / Resolve */}
      {modalType && selectedIncident && (
        <div className="apple-modal-overlay" onClick={() => setModalType(null)}>
          <div className="apple-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 className="section-title">
                  {modalType === 'ack' ? `Acknowledge Incident #${selectedIncident.id}` : `Resolve Incident #${selectedIncident.id}`}
                </h3>
                <p className="section-desc" style={{ marginTop: 4 }}>
                  {selectedIncident.title}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="apple-btn apple-btn-glass"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {modalType === 'ack' ? (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  Incident Commander / Operator Identifier:
                </label>
                <input
                  type="text"
                  className="cupertino-input font-mono"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  Root Cause Analysis &amp; Resolution Audit:
                </label>
                <textarea
                  className="cupertino-textarea"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Root cause identified, memory leak cleared, capacity limits expanded."
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="apple-btn apple-btn-glass" onClick={() => setModalType(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="apple-btn apple-btn-primary" onClick={handleAction} disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : modalType === 'ack' ? 'Confirm Acknowledge' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
