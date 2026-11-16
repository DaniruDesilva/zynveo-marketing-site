const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const REQUIRED_SCHEMAS = ['iam', 'finance', 'hr', 'scm', 'inventory', 'manufacturing', 'sales_crm', 'bi'];

function computeSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set. Run with: node --env-file=.env packages/database/apply-migration.js');
    process.exit(1);
  }

  const forceRerun = process.argv.includes('--force');
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  if (migrationFiles.length === 0) {
    console.error(`Error: No .sql migration files found in ${migrationsDir}`);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public._zynveo_migrations (
          filename VARCHAR(255) PRIMARY KEY,
          checksum VARCHAR(64) NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      const appliedRes = await client.query(
        'SELECT filename, checksum FROM public._zynveo_migrations',
      );
      const appliedChecksums = new Map(
        appliedRes.rows.map((row) => [row.filename, row.checksum]),
      );

      for (const file of migrationFiles) {
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const checksum = computeSha256(sql);
        const recordedChecksum = appliedChecksums.get(file);

        if (!forceRerun && recordedChecksum === checksum) {
          console.log(`Skipping already applied migration: ${file}`);
          continue;
        }

        if (file === '0001_schemas.sql') {
          const checkSchemas = await client.query(
            `
              SELECT count(*)::int AS count
              FROM information_schema.schemata
              WHERE schema_name = ANY($1::text[])
            `,
            [REQUIRED_SCHEMAS],
          );
          if (checkSchemas.rows[0].count === REQUIRED_SCHEMAS.length) {
            console.log(
              'ERP schemas already exist. Dropping dependent materialized views for idempotent rerun...',
            );
            await client.query(`
              DROP MATERIALIZED VIEW IF EXISTS bi.mv_trial_balance CASCADE;
              DROP MATERIALIZED VIEW IF EXISTS bi.mv_ar_aging_buckets CASCADE;
              DROP MATERIALIZED VIEW IF EXISTS bi.mv_inventory_valuation_wac CASCADE;
              DROP MATERIALIZED VIEW IF EXISTS bi.mv_daily_sales_summary CASCADE;
            `);
          }
        }

        console.log(`Applying migration ${file}...`);
        await client.query(sql);
        await client.query(
          `
            INSERT INTO public._zynveo_migrations (filename, checksum, applied_at)
            VALUES ($1, $2, now())
            ON CONFLICT (filename)
            DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now()
          `,
          [file, checksum],
        );
      }

      const res = await client.query(
        `
          SELECT schema_name
          FROM information_schema.schemata
          WHERE schema_name = ANY($1::text[])
          ORDER BY schema_name;
        `,
        [REQUIRED_SCHEMAS],
      );
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
  console.error('Failed to apply migrations:', err.message || err);
  process.exit(1);
});

