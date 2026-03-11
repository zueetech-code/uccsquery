import pkg from 'pg';
const { Pool } = pkg;

let pool: InstanceType<typeof Pool> | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/uccsquery',
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = getPool();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('[v0] Database query error:', error);
    throw error;
  }
}

export async function queryOne(text: string, params?: any[]) {
  const rows = await query(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  return queryOne(text, values);
}

export async function update(table: string, id: number, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const text = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`;
  return queryOne(text, [...values, id]);
}

export async function deleteRecord(table: string, id: number) {
  const text = `DELETE FROM ${table} WHERE id = $1`;
  return query(text, [id]);
}

export async function findById(table: string, id: number) {
  const text = `SELECT * FROM ${table} WHERE id = $1`;
  return queryOne(text, [id]);
}

export async function findByColumn(table: string, column: string, value: any) {
  const text = `SELECT * FROM ${table} WHERE ${column} = $1`;
  return queryOne(text, [value]);
}

export async function findAll(table: string, limit?: number) {
  let text = `SELECT * FROM ${table}`;
  const params = [];
  if (limit) {
    text += ` LIMIT $1`;
    params.push(limit);
  }
  return query(text, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
