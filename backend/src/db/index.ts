import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

export const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development' && duration > 50) {
    console.debug(`[SQL] Executed: ${text.slice(0, 80)}... in ${duration}ms`);
  }
  return res;
}

export async function checkDbHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { healthy: false, latencyMs: Date.now() - start, error: err.message };
  }
}
