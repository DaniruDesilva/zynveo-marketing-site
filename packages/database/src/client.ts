import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';

export type ServiceDbConnection<TSchema extends Record<string, unknown>> = {
  pool: Pool;
  db: NodePgDatabase<TSchema>;
};

/**
 * Factory creating a schema-isolated Drizzle database instance for a specific microservice.
 * Each microservice passes ONLY its own schema module (e.g. `import * as financeSchema from '@zynveo/database/finance'`).
 */
export function createServiceDb<TSchema extends Record<string, unknown>>(
  schema: TSchema,
  config?: string | PoolConfig,
): ServiceDbConnection<TSchema> {
  const poolConfig: PoolConfig =
    typeof config === 'string'
      ? { connectionString: config }
      : config ?? {
          connectionString:
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5433/zynveo_erp',
        };

  const pool = new Pool(poolConfig);
  const db = drizzle(pool, { schema });
  return { pool, db };
}

