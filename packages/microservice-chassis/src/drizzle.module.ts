import { createServiceDb, ServiceDbConnection } from '@zynveo/database/client';
import { DynamicModule, Global, Module, OnApplicationShutdown } from './nest-compat';

export const DRIZZLE_DB = 'ZYNVEO_DRIZZLE_DB';
export const DRIZZLE_POOL = 'ZYNVEO_DRIZZLE_POOL';
export const DRIZZLE_SCHEMA_NAME = 'ZYNVEO_DRIZZLE_SCHEMA_NAME';

@Global()
@Module({})
export class DrizzleModule implements OnApplicationShutdown {
  private static activeConnections: Array<ServiceDbConnection<any>> = [];

  static forService<TSchema extends Record<string, unknown>>(
    schemaName: string,
    schemaModule: TSchema,
    connectionString?: string,
  ): DynamicModule {
    const conn = createServiceDb(schemaModule, connectionString);
    DrizzleModule.activeConnections.push(conn);

    return {
      module: DrizzleModule,
      global: true,
      providers: [
        {
          provide: DRIZZLE_SCHEMA_NAME,
          useValue: schemaName,
        },
        {
          provide: DRIZZLE_POOL,
          useValue: conn.pool,
        },
        {
          provide: DRIZZLE_DB,
          useValue: conn.db,
        },
      ],
      exports: [DRIZZLE_SCHEMA_NAME, DRIZZLE_POOL, DRIZZLE_DB],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    while (DrizzleModule.activeConnections.length > 0) {
      const conn = DrizzleModule.activeConnections.pop();
      if (conn?.pool?.end) {
        await conn.pool.end().catch(() => {});
      }
    }
  }
}

