const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set. Run with: node --env-file=.env packages/database/apply-migration.js');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'migrations', '0001_schemas.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    const client = await pool.connect();
    try {
      console.log('Applying 0001_schemas.sql (8 isolated schemas + extensions)...');
      await client.query(sql);
      const res = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name IN ('iam', 'finance', 'hr', 'scm', 'inventory', 'manufacturing', 'sales_crm', 'bi')
        ORDER BY schema_name;
      `);
      console.log(
        'Successfully verified ERP schemas:',
        res.rows.map((r) => r.schema_name).join(', '),
      );
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed to apply 0001_schemas.sql:', err.message || err);
  process.exit(1);
});

