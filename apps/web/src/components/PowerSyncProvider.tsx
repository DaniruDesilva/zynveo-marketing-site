"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Mock implementation of the PowerSync database for offline/demo use
export type MockDatabase = {
  getAll: (query: string, params?: any[]) => Promise<any[]>;
  execute: (query: string, params?: any[]) => Promise<void>;
};

const MockDatabaseContext = createContext<MockDatabase | null>(null);

export const usePowerSync = () => {
  const context = useContext(MockDatabaseContext);
  if (!context) {
    throw new Error("usePowerSync must be used within a PowerSyncProvider");
  }
  return context;
};

export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<MockDatabase | null>(null);

  useEffect(() => {
    // In-memory data store
    const store = {
      accounts: [] as any[],
      journal_entries: [] as any[],
      journal_lines: [] as any[],
      products: [
        { id: 'PRD-001', name: 'Premium Wireless Headphones', category: 'Electronics' },
        { id: 'PRD-002', name: 'Mechanical Keyboard', category: 'Electronics' },
        { id: 'PRD-003', name: 'Ergonomic Office Chair', category: 'Furniture' },
        { id: 'PRD-004', name: 'USB-C Hub Multiport Adapter', category: 'Accessories' },
        { id: 'PRD-005', name: '4K Monitor 27-inch', category: 'Electronics' },
      ],
      product_variants: [
        { id: 'VAR-001', product_id: 'PRD-001', sku: 'AUD-WH-001', price: 299.99 },
        { id: 'VAR-002', product_id: 'PRD-002', sku: 'PER-MK-104', price: 149.50 },
        { id: 'VAR-003', product_id: 'PRD-003', sku: 'FUR-OC-099', price: 450.00 },
        { id: 'VAR-004', product_id: 'PRD-004', sku: 'ACC-USB-04', price: 45.00 },
        { id: 'VAR-005', product_id: 'PRD-005', sku: 'DIS-4K-27', price: 399.99 },
      ],
      stock_levels: [
        { variant_id: 'VAR-001', quantity: 145 },
        { variant_id: 'VAR-002', quantity: 32 },
        { variant_id: 'VAR-003', quantity: 0 },
        { variant_id: 'VAR-004', quantity: 450 },
        { variant_id: 'VAR-005', quantity: 12 },
      ],
      documents: [
        { id: 'DOC-001', document_number: 'INV-2026-2401', total: 1540.20, status: 'Paid', date: '2026-06-18' },
        { id: 'DOC-002', document_number: 'INV-2026-2402', total: 450.00, status: 'Paid', date: '2026-06-17' },
        { id: 'DOC-003', document_number: 'INV-2026-2403', total: 2300.50, status: 'Pending', date: '2026-06-16' },
        { id: 'DOC-004', document_number: 'INV-2026-2404', total: 890.00, status: 'Paid', date: '2026-06-15' },
        { id: 'DOC-005', document_number: 'INV-2026-2405', total: 5600.00, status: 'Overdue', date: '2026-06-14' },
      ]
    };

    const mockDb: MockDatabase = {
      getAll: async (query: string, params?: any[]) => {
        if (query.includes("FROM tenants")) {
          return [{ id: "00000000-0000-0000-0000-000000000000" }];
        }
        if (query.includes("FROM accounts")) {
          if (query.includes("MAX(CAST(code AS INTEGER))")) {
            const type = params ? params[0] : null;
            const typeAccounts = type ? store.accounts.filter(a => a.type === type) : store.accounts;
            const maxCode = typeAccounts.reduce((max, a) => Math.max(max, parseInt(a.code || "0")), 0);
            return [{ max_code: maxCode > 0 ? maxCode.toString() : null }];
          }
          return store.accounts.map(a => ({
            ...a,
            total_debits: 0,
            total_credits: 0,
          }));
        }
        if (query.includes("FROM journal_entries")) {
          return store.journal_entries;
        }
        if (query.includes("FROM products")) {
          return store.products.map(p => {
            const variant = store.product_variants.find(v => v.product_id === p.id) || store.product_variants[0];
            const stock = store.stock_levels.find(s => s.variant_id === variant.id)?.quantity || 0;
            return {
              id: p.id,
              name: p.name,
              sku: variant.sku,
              category: p.category,
              stock: stock,
              price: variant.price
            };
          });
        }
        if (query.includes("FROM documents")) {
          return store.documents.map(d => ({
            id: d.id,
            customer: d.document_number,
            amount: d.total,
            status: d.status,
            date: d.date
          }));
        }
        return [];
      },
      execute: async (query: string, params?: any[]) => {
        console.log("Mock execute:", query, params);
        if (query.includes("INSERT INTO accounts")) {
          if (params && params.length >= 8) {
            store.accounts.push({
              id: params[0],
              tenant_id: params[1],
              code: params[2],
              name: params[3],
              type: params[4],
              normal_balance: params[5],
              description: params[6],
              is_active: params[7] === 1,
            });
          }
        } else if (query.includes("UPDATE accounts")) {
           if (params && params.length >= 7) {
             const id = params[6];
             const acc = store.accounts.find(a => a.id === id);
             if (acc) {
               acc.code = params[0];
               acc.name = params[1];
               acc.type = params[2];
               acc.normal_balance = params[3];
               acc.description = params[4];
               acc.is_active = params[5] === 1;
             }
           }
        }
      }
    };

    setDb(mockDb);
  }, []);

  if (!db) {
    return <div className="flex h-screen items-center justify-center">Loading local database...</div>;
  }

  return <MockDatabaseContext.Provider value={db}>{children}</MockDatabaseContext.Provider>;
}
