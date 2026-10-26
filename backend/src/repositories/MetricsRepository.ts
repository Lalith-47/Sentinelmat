import { query } from '../db';
import { MetricSample } from '../types';

export class MetricsRepository {
  static async insert(sample: MetricSample): Promise<MetricSample> {
    const sql = `
      INSERT INTO metric_samples (
        host_id, timestamp, cpu_utilization, cpu_load_1m, cpu_load_5m, cpu_load_15m,
        memory_utilization, memory_used_bytes, memory_total_bytes,
        disk_utilization, disk_used_bytes, disk_total_bytes,
        network_rx_bytes_sec, network_tx_bytes_sec, availability
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15
      ) RETURNING *;
    `;
    const res = await query<MetricSample>(sql, [
      sample.host_id,
      sample.timestamp,
      sample.cpu_utilization,
      sample.cpu_load_1m,
      sample.cpu_load_5m,
      sample.cpu_load_15m,
      sample.memory_utilization,
      sample.memory_used_bytes,
      sample.memory_total_bytes,
      sample.disk_utilization,
      sample.disk_used_bytes,
      sample.disk_total_bytes,
      sample.network_rx_bytes_sec,
      sample.network_tx_bytes_sec,
      sample.availability,
    ]);

    // Also update host's last_seen_at
    await query('UPDATE hosts SET last_seen_at = NOW(), status = CASE WHEN status = \'offline\' THEN \'online\' ELSE status END WHERE id = $1', [sample.host_id]);

    return res.rows[0];
  }

  static async findLatestByHost(hostId: string): Promise<MetricSample | null> {
    const sql = `
      SELECT * FROM metric_samples
      WHERE host_id = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `;
    const res = await query<MetricSample>(sql, [hostId]);
    return res.rows[0] || null;
  }

  static async findHistoryByHost(hostId: string, limit: number = 300): Promise<MetricSample[]> {
    const sql = `
      SELECT * FROM (
        SELECT * FROM metric_samples
        WHERE host_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      ) sub
      ORDER BY timestamp ASC;
    `;
    const res = await query<MetricSample>(sql, [hostId, limit]);
    return res.rows;
  }

  static async findHistorySince(hostId: string, sinceDate: Date): Promise<MetricSample[]> {
    const sql = `
      SELECT * FROM metric_samples
      WHERE host_id = $1 AND timestamp >= $2
      ORDER BY timestamp ASC;
    `;
    const res = await query<MetricSample>(sql, [hostId, sinceDate]);
    return res.rows;
  }
}
