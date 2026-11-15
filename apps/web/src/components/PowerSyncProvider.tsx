"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Local SQLite / PowerSync read-replica store (`@zynveo/sync`) for offline-first UI reads.
 * Per GEMINI.md Rule 5: All state-changing ERP mutations must route through `apps/api-gateway` (`erpApi`),
 * never direct client SQLite/database writes or hardcoded mock rows.
 */
export type PowerSyncReadAdapter = {
  isConnected: boolean;
  syncMode: "powersync" | "gateway-only";
  getAll: (query: string, params?: any[]) => Promise<any[]>;
  execute: (query: string, params?: any[]) => Promise<void>;
};

export type MockDatabase = PowerSyncReadAdapter;

const PowerSyncContext = createContext<PowerSyncReadAdapter | null>(null);

export const usePowerSync = () => {
  const context = useContext(PowerSyncContext);
  if (!context) {
    throw new Error("usePowerSync must be used within a PowerSyncProvider");
  }
  return context;
};

export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const [adapter, setAdapter] = useState<PowerSyncReadAdapter>({
    isConnected: false,
    syncMode: "gateway-only",
    getAll: async () => [],
    execute: async () => {
      console.warn(
        "[Zynveo] Direct client SQL writes are disabled. Route mutations through apps/api-gateway (erpApi)."
      );
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function initRealPowerSync() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const powersyncUrl = process.env.NEXT_PUBLIC_POWERSYNC_URL || "";

      if (!supabaseUrl || !supabaseAnonKey || !powersyncUrl) {
        return;
      }

      try {
        const { initializeSync } = await import("@zynveo/sync");
        const instance = initializeSync({
          supabaseUrl,
          supabaseAnonKey,
          powersyncUrl,
          apiGatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000",
        });

        if (cancelled) return;

        setAdapter({
          isConnected: true,
          syncMode: "powersync",
          getAll: async (query: string, params?: any[]) => {
            return instance.getAll(query, params || []);
          },
          execute: async () => {
            throw new Error(
              "Direct local SQLite mutations are prohibited (GEMINI.md Rule 5). Use apps/api-gateway."
            );
          },
        });
      } catch (err) {
        console.warn("[Zynveo Sync] PowerSync WASM initialization skipped, using API Gateway:", err);
      }
    }

    initRealPowerSync();

    return () => {
      cancelled = true;
    };
  }, []);

  return <PowerSyncContext.Provider value={adapter}>{children}</PowerSyncContext.Provider>;
}
