import { query } from '../db';
import { IncidentRecord, IncidentStatus, Severity } from '../types';

export class IncidentRepository {
  static async insert(incident: {
    host_id: string;
    title: string;
    severity: Severity;
    status: IncidentStatus;
    trigger_metric: string;
    trigger_value: number;
    summary: string;
  }): Promise<IncidentRecord> {
    const sql = `
      INSERT INTO incidents (
        host_id, title, severity, status,
        trigger_metric, trigger_value, summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await query<IncidentRecord>(sql, [
      incident.host_id,
      incident.title,
      incident.severity,
      incident.status,
      incident.trigger_metric,
      incident.trigger_value,
      incident.summary,
    ]);
    return res.rows[0];
  }

  static async findActiveByMetric(hostId: string, metric: string): Promise<IncidentRecord | null> {
    const sql = `
      SELECT * FROM incidents
      WHERE host_id = $1 AND trigger_metric = $2 AND status IN ('open', 'acknowledged')
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const res = await query<IncidentRecord>(sql, [hostId, metric]);
    return res.rows[0] || null;
  }

  static async findAll(status?: IncidentStatus, limit: number = 50): Promise<IncidentRecord[]> {
    let sql = 'SELECT * FROM incidents';
    const params: any[] = [];
    if (status) {
      sql += ' WHERE status = $1 ORDER BY created_at DESC LIMIT $2';
      params.push(status, limit);
    } else {
      sql += ' ORDER BY created_at DESC LIMIT $1';
      params.push(limit);
    }
    const res = await query<IncidentRecord>(sql, params);
    return res.rows;
  }

  static async acknowledge(id: number, acknowledgedBy: string): Promise<IncidentRecord | null> {
    const sql = `
      UPDATE incidents
      SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
      WHERE id = $2
      RETURNING *;
    `;
    const res = await query<IncidentRecord>(sql, [acknowledgedBy, id]);
    return res.rows[0] || null;
  }

  static async resolve(id: number, notes: string): Promise<IncidentRecord | null> {
    const sql = `
      UPDATE incidents
      SET status = 'resolved', resolved_at = NOW(), resolution_notes = $1
      WHERE id = $2
      RETURNING *;
    `;
    const res = await query<IncidentRecord>(sql, [notes, id]);
    return res.rows[0] || null;
  }
}
