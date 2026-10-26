import { query } from '../db';
import { Host, HostStatus } from '../types';

export class HostRepository {
  static async upsert(host: {
    id: string;
    hostname: string;
    ip_address?: string;
    os_info?: string;
    cpu_count: number;
    total_memory_bytes: number;
    total_disk_bytes: number;
  }): Promise<Host> {
    const sql = `
      INSERT INTO hosts (id, hostname, ip_address, os_info, cpu_count, total_memory_bytes, total_disk_bytes, status, last_seen_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'online', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        hostname = EXCLUDED.hostname,
        ip_address = COALESCE(EXCLUDED.ip_address, hosts.ip_address),
        os_info = COALESCE(EXCLUDED.os_info, hosts.os_info),
        cpu_count = EXCLUDED.cpu_count,
        total_memory_bytes = EXCLUDED.total_memory_bytes,
        total_disk_bytes = EXCLUDED.total_disk_bytes,
        status = CASE WHEN hosts.status = 'offline' THEN 'online' ELSE hosts.status END,
        last_seen_at = NOW(),
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await query<Host>(sql, [
      host.id,
      host.hostname,
      host.ip_address || null,
      host.os_info || null,
      host.cpu_count,
      host.total_memory_bytes,
      host.total_disk_bytes,
    ]);
    return res.rows[0];
  }

  static async findAll(): Promise<Host[]> {
    const res = await query<Host>('SELECT * FROM hosts ORDER BY last_seen_at DESC');
    return res.rows;
  }

  static async findById(id: string): Promise<Host | null> {
    const res = await query<Host>('SELECT * FROM hosts WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async updateStatus(id: string, status: HostStatus): Promise<void> {
    await query('UPDATE hosts SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  }
}
