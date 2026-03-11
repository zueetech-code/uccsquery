import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/uccsquery',
});

async function runMigrations() {
  try {
    console.log('[v0] Starting database migrations...');
    
    const migrationFile = path.join(process.cwd(), 'scripts', '001-init-schema.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('[v0] Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
