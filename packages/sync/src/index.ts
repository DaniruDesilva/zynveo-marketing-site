import { PowerSyncDatabase } from '@powersync/web';
import { AppSchema } from './AppSchema';
import { SupabaseConnector, SupabaseConfig } from './SupabaseConnector';

export * from './AppSchema';
export * from './SupabaseConnector';

let powerSyncInstance: PowerSyncDatabase | null = null;

/**
 * Initializes the PowerSync SQLite database and connects it to Supabase
 */
export const initializeSync = (config?: SupabaseConfig): PowerSyncDatabase => {
  if (powerSyncInstance) return powerSyncInstance;

  powerSyncInstance = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'erp_local.db'
    }
  });

  if (config && config.supabaseUrl && config.supabaseAnonKey) {
    const connector = new SupabaseConnector(config);
    // Initiate the background sync loop
    powerSyncInstance.connect(connector);
  } else {
    console.warn("PowerSync is running in local-only mode because no Supabase config was provided.");
  }

  return powerSyncInstance;
};

export const getPowerSync = (): PowerSyncDatabase => {
  if (!powerSyncInstance) {
    throw new Error("PowerSync not initialized. Call initializeSync first.");
  }
  return powerSyncInstance;
};
