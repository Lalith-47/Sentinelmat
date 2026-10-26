import { query } from '../db';
import { AlertRule, NotificationLog } from '../types';

export class AlertRepository {
  static async findAllRules(): Promise<AlertRule[]> {
    const res = await query<AlertRule>('SELECT * FROM alert_rules ORDER BY id ASC');
    return res.rows;
  }

  static async findEnabledRules(): Promise<AlertRule[]> {
    const res = await query<AlertRule>('SELECT * FROM alert_rules WHERE enabled = true');
    return res.rows;
  }

  static async updateRule(id: number, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (['name', 'metric_type', 'condition', 'threshold_value', 'duration_seconds', 'severity', 'enabled', 'cooldown_minutes', 'notify_telegram'].includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `UPDATE alert_rules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query<AlertRule>(sql, values);
    return res.rows[0] || null;
  }

  static async updateLastTriggered(id: number): Promise<void> {
    await query('UPDATE alert_rules SET last_triggered_at = NOW() WHERE id = $1', [id]);
  }

  static async insertNotificationLog(log: {
    incident_id?: number | null;
    channel: string;
    recipient: string;
    message: string;
    status: 'sent' | 'failed' | 'skipped';
    error_message?: string | null;
  }): Promise<NotificationLog> {
    const sql = `
      INSERT INTO notification_logs (incident_id, channel, recipient, message, status, error_message, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const res = await query<NotificationLog>(sql, [
      log.incident_id || null,
      log.channel,
      log.recipient,
      log.message,
      log.status,
      log.error_message || null,
    ]);
    return res.rows[0];
  }

  static async findRecentLogs(limit: number = 50): Promise<NotificationLog[]> {
    const res = await query<NotificationLog>('SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT $1', [limit]);
    return res.rows;
  }
}
