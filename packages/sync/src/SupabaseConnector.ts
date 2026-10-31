import { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/web';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  powersyncUrl: string;
  apiGatewayUrl?: string;
};

/**
 * PowerSync Connector enforcing GEMINI.md Rule 5:
 * - Local SQLite WASM (`@zynveo/sync`) is strictly Read-Only for instant table/dashboard rendering.
 * - Direct client-to-Supabase table writes are disabled (`uploadData` never mutates Supabase tables directly).
 * - All state-changing ERP mutations (`POST`, `PATCH`) route through `apps/api-gateway` validated with `@zynveo/contracts`.
 */
export class SupabaseConnector implements PowerSyncBackendConnector {
  client: SupabaseClient;
  powersyncUrl: string;
  apiGatewayUrl: string;

  constructor(config: SupabaseConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseAnonKey);
    this.powersyncUrl = config.powersyncUrl;
    this.apiGatewayUrl =
      config.apiGatewayUrl ||
      process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
      'http://localhost:4000';
  }

  async fetchCredentials() {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();

    if (error || !session) {
      throw new Error('Could not fetch Supabase session');
    }

    return {
      endpoint: this.powersyncUrl,
      token: session.access_token,
      expiresAt: new Date(
        session.expires_at ? session.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
      ),
    };
  }

  /**
   * Per GEMINI.md Rule 5: PowerSync client sync is strictly Read-Only.
   * Any accidental local SQLite CRUD transaction is acknowledged and discarded rather than
   * bypassing `apps/api-gateway` and writing directly to PostgreSQL.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    console.warn(
      '[Zynveo Sync] Discarding direct local SQLite CRUD mutation; all ERP state mutations must go through apps/api-gateway (/api/v1/*).',
    );
    await transaction.complete();
  }
}
