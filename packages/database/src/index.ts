import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/zynveo_erp',
});

export const db = drizzle(pool, { schema });
export * from './client';
export * from './schemas';
