import { AbstractPowerSyncDatabase, CrudEntry, PowerSyncBackendConnector, UpdateType } from '@powersync/web';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  powersyncUrl: string;
};

export class SupabaseConnector implements PowerSyncBackendConnector {
  client: SupabaseClient;
  powersyncUrl: string;

  constructor(config: SupabaseConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseAnonKey);
    this.powersyncUrl = config.powersyncUrl;
  }

  async fetchCredentials() {
    const { data: { session }, error } = await this.client.auth.getSession();
    
    if (error || !session) {
      throw new Error("Could not fetch Supabase session");
    }

    // Return the token to PowerSync to authenticate to the Sync server
    return {
      endpoint: this.powersyncUrl,
      token: session.access_token,
      // Pass the JWT expiration to PowerSync
      expiresAt: new Date(session.expires_at ? session.expires_at * 1000 : Date.now() + 60 * 60 * 1000)
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastEntry: CrudEntry | null = null;
    try {
      // Loop through each entry/mutation in the transaction sequentially
      for (const entry of transaction.crud) {
        lastEntry = entry;
        
        switch (entry.op) {
          case UpdateType.PUT: {
            const { error } = await this.client.from(entry.table).upsert(entry.opData!);
            if (error) throw error;
            break;
          }
          case UpdateType.PATCH: {
            const { error } = await this.client.from(entry.table).update(entry.opData!).eq('id', entry.id);
            if (error) throw error;
            break;
          }
          case UpdateType.DELETE: {
            const { error } = await this.client.from(entry.table).delete().eq('id', entry.id);
            if (error) throw error;
            break;
          }
        }
      }
      // If successful, tell PowerSync to discard this transaction
      await transaction.complete();
    } catch (ex) {
      console.error(`Caught error syncing data to Supabase. Table: ${lastEntry?.table}, ID: ${lastEntry?.id}`, ex);
      // Wait a moment before retrying if there's a network issue
      throw ex;
    }
  }
}
