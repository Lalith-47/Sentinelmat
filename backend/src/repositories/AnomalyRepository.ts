import { query } from '../db';
import { AnomalyRecord } from '../types';

export class AnomalyRepository {
  static async insert(anomaly: AnomalyRecord): Promise<AnomalyRecord> {
    const sql = `
      INSERT INTO anomalies (
        host_id, metric_type, detected_at, observed_value,
        baseline_mean, baseline_std, z_score, threshold,
        severity, explanation, status
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11
      ) RETURNING *;
    `;
    const res = await query<AnomalyRecord>(sql, [
      anomaly.host_id,
      anomaly.metric_type,
      anomaly.detected_at,
      anomaly.observed_value,
      anomaly.baseline_mean,
      anomaly.baseline_std,
      anomaly.z_score,
      anomaly.threshold,
      anomaly.severity,
      anomaly.explanation,
      anomaly.status || 'active',
    ]);
    return res.rows[0];
  }

  static async findRecent(limit: number = 100, hostId?: string): Promise<AnomalyRecord[]> {
    let sql = 'SELECT * FROM anomalies';
    const params: any[] = [];
    if (hostId) {
      sql += ' WHERE host_id = $1 ORDER BY detected_at DESC LIMIT $2';
      params.push(hostId, limit);
    } else {
      sql += ' ORDER BY detected_at DESC LIMIT $1';
      params.push(limit);
    }
    const res = await query<AnomalyRecord>(sql, params);
    return res.rows;
  }

  static async updateStatus(id: number, status: 'active' | 'investigating' | 'resolved'): Promise<void> {
    await query('UPDATE anomalies SET status = $1 WHERE id = $2', [status, id]);
  }
}
