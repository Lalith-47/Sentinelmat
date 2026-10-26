import React, { useState } from 'react';
import { IncidentRecord } from '../types';
import { ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

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
  const [operatorName, setOperatorName] = useState('On-Call Engineer');
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
        await onResolve(selectedIncident.id, resolutionNotes || 'Resolved verified by operator.');
      }
      setModalType(null);
      setSelectedIncident(null);
      setResolutionNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} color="#ef4444" />
            <h2 className="title-md">Incident Lifecycle &amp; Triage</h2>
          </div>
          <p className="text-muted">Track, acknowledge, and resolve automated alerts and incident triggers</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'open', 'acknowledged', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table / Cards */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No incidents matching status "{filterStatus}".
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Host</th>
                <th>Title / Trigger</th>
                <th>Observed</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr key={inc.id}>
                  <td className="code-font" style={{ fontWeight: 700 }}>#{inc.id}</td>
                  <td>
                    <span className={`status-badge ${inc.severity}`}>{inc.severity}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: inc.status === 'open' ? 'rgba(239,68,68,0.2)' : inc.status === 'acknowledged' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                        color: inc.status === 'open' ? '#f87171' : inc.status === 'acknowledged' ? '#fbbf24' : '#34d399',
                      }}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="code-font">{inc.host_id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{inc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.summary}</div>
                  </td>
                  <td className="code-font" style={{ fontWeight: 700 }}>
                    {inc.trigger_value.toFixed(2)}
                  </td>
                  <td className="code-font text-muted">{new Date(inc.created_at).toLocaleTimeString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inc.status === 'open' && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
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
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}
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
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="title-md" style={{ marginBottom: 12 }}>
              {modalType === 'ack' ? `Acknowledge Incident #${selectedIncident.id}` : `Resolve Incident #${selectedIncident.id}`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              {selectedIncident.title}: {selectedIncident.summary}
            </p>

            {modalType === 'ack' ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Operator / Engineer Identifier:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Resolution Notes &amp; Root Cause Analysis:
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Root cause identified, system load mitigated, capacity scaled."
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setModalType(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAction} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : modalType === 'ack' ? 'Confirm Acknowledge' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
