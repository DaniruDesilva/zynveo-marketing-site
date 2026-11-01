"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Local SQLite / PowerSync read-replica store for instant offline-first UI rendering
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
    const store = {
      accounts: [
        {
          id: "11111111-1111-4111-8111-000000001000",
          code: "1000",
          name: "Cash & Bank",
          type: "ASSET",
          normal_balance: "DEBIT",
          total_debits: 125400,
          total_credits: 0,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000001100",
          code: "1100",
          name: "Accounts Receivable",
          type: "ASSET",
          normal_balance: "DEBIT",
          total_debits: 18450,
          total_credits: 0,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000001200",
          code: "1200",
          name: "Inventory Asset",
          type: "ASSET",
          normal_balance: "DEBIT",
          total_debits: 64800,
          total_credits: 0,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000002000",
          code: "2000",
          name: "Accounts Payable",
          type: "LIABILITY",
          normal_balance: "CREDIT",
          total_debits: 0,
          total_credits: 9300,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000002100",
          code: "2100",
          name: "Output Tax Payable",
          type: "LIABILITY",
          normal_balance: "CREDIT",
          total_debits: 0,
          total_credits: 19134,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000003000",
          code: "3000",
          name: "Retained Earnings",
          type: "EQUITY",
          normal_balance: "CREDIT",
          total_debits: 0,
          total_credits: 129016,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000004000",
          code: "4000",
          name: "Sales Revenue",
          type: "REVENUE",
          normal_balance: "CREDIT",
          total_debits: 0,
          total_credits: 125400,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000005000",
          code: "5000",
          name: "Cost of Goods Sold (COGS)",
          type: "EXPENSE",
          normal_balance: "DEBIT",
          total_debits: 48200,
          total_credits: 0,
          is_active: 1,
        },
        {
          id: "11111111-1111-4111-8111-000000006000",
          code: "6000",
          name: "Operating Expenses",
          type: "EXPENSE",
          normal_balance: "DEBIT",
          total_debits: 26000,
          total_credits: 0,
          is_active: 1,
        },
      ] as any[],
      journal_entries: [] as any[],
      journal_lines: [] as any[],
      customers: [
        { id: "22222222-2222-4222-8222-000000000001", name: "Acme Holdings Ltd", is_active: 1 },
        { id: "22222222-2222-4222-8222-000000000002", name: "Ceylon Global Logistics", is_active: 1 },
        { id: "22222222-2222-4222-8222-000000000003", name: "Apex Retail Group", is_active: 1 },
      ],
      suppliers: [
        { id: "77777777-7777-4777-8777-000000000001", name: "Alpha Component Supplies", is_active: 1 },
        { id: "77777777-7777-4777-8777-000000000002", name: "Global Audio OEM Ltd", is_active: 1 },
      ],
      warehouses: [
        {
          id: "33333333-3333-4333-8333-000000000001",
          code: "WH-CMB-01",
          name: "Colombo Central Warehouse",
        },
        {
          id: "33333333-3333-4333-8333-000000000002",
          code: "WH-KDY-02",
          name: "Kandy Regional Hub",
        },
      ],
      products: [
        {
          id: "44444444-4444-4444-8444-000000000001",
          sku: "AUD-WH-001",
          name: "Premium Wireless Headphones",
          category: "Electronics",
          selling_price: "299.99",
          weighted_avg_cost: "180.00",
          price: 299.99,
          stock: 145,
          reserved: 10,
          reorder_level: 25,
          warehouse_code: "WH-CMB-01",
          bin_location: "Zone-A • Bin A12-04",
          batch_number: "LOT-2026-10A",
          uom: "PCS",
        },
        {
          id: "44444444-4444-4444-8444-000000000002",
          sku: "PER-MK-104",
          name: "Mechanical Tactile Keyboard",
          category: "Electronics",
          selling_price: "149.50",
          weighted_avg_cost: "85.00",
          price: 149.5,
          stock: 32,
          reserved: 4,
          reorder_level: 20,
          warehouse_code: "WH-CMB-01",
          bin_location: "Zone-A • Bin A08-11",
          batch_number: "LOT-2026-09C",
          uom: "PCS",
        },
        {
          id: "44444444-4444-4444-8444-000000000003",
          sku: "FUR-OC-099",
          name: "Ergonomic Mesh Office Chair",
          category: "Furniture",
          selling_price: "450.00",
          weighted_avg_cost: "260.00",
          price: 450.0,
          stock: 18,
          reserved: 2,
          reorder_level: 20,
          warehouse_code: "WH-KDY-02",
          bin_location: "Zone-C • Bulk Rack B02",
          batch_number: "LOT-2026-08B",
          uom: "UNIT",
        },
        {
          id: "44444444-4444-4444-8444-000000000004",
          sku: "ACC-USB-04",
          name: "USB-C Multiport Hub Adapter",
          category: "Accessories",
          selling_price: "45.00",
          weighted_avg_cost: "22.50",
          price: 45.0,
          stock: 450,
          reserved: 30,
          reorder_level: 100,
          warehouse_code: "WH-CMB-01",
          bin_location: "Zone-B • Bin B04-02",
          batch_number: "LOT-2026-10D",
          uom: "PCS",
        },
        {
          id: "44444444-4444-4444-8444-000000000005",
          sku: "DIS-4K-27",
          name: "UltraSharp 4K IPS Monitor 27\"",
          category: "Electronics",
          selling_price: "399.99",
          weighted_avg_cost: "240.00",
          price: 399.99,
          stock: 12,
          reserved: 3,
          reorder_level: 15,
          warehouse_code: "WH-CMB-01",
          bin_location: "Zone-A • High-Bay H01",
          batch_number: "LOT-2026-10E",
          uom: "UNIT",
        },
      ],
      purchase_orders: [
        {
          id: "55555555-5555-4555-8555-000000000001",
          po_number: "PO-2026-1001",
          supplier_id: "77777777-7777-4777-8777-000000000001",
          status: "ISSUED",
        },
        {
          id: "55555555-5555-4555-8555-000000000002",
          po_number: "PO-2026-1002",
          supplier_id: "77777777-7777-4777-8777-000000000002",
          status: "PARTIALLY_RECEIVED",
        },
      ],
      po_lines: [
        {
          id: "66666666-6666-4666-8666-000000000001",
          purchase_order_id: "55555555-5555-4555-8555-000000000001",
          product_id: "44444444-4444-4444-8444-000000000001",
          ordered_qty: "50.0000",
          received_qty: "0.0000",
          unit_cost: "180.00",
        },
        {
          id: "66666666-6666-4666-8666-000000000002",
          purchase_order_id: "55555555-5555-4555-8555-000000000001",
          product_id: "44444444-4444-4444-8444-000000000002",
          ordered_qty: "30.0000",
          received_qty: "0.0000",
          unit_cost: "85.00",
        },
        {
          id: "66666666-6666-4666-8666-000000000003",
          purchase_order_id: "55555555-5555-4555-8555-000000000002",
          product_id: "44444444-4444-4444-8444-000000000005",
          ordered_qty: "20.0000",
          received_qty: "5.0000",
          unit_cost: "240.00",
        },
      ],
      documents: [
        { id: "DOC-001", document_number: "INV-2026-2401", total: 1540.2, status: "Paid", date: "2026-06-18" },
        { id: "DOC-002", document_number: "INV-2026-2402", total: 450.0, status: "Paid", date: "2026-06-17" },
        { id: "DOC-003", document_number: "INV-2026-2403", total: 2300.5, status: "Pending", date: "2026-06-16" },
        { id: "DOC-004", document_number: "INV-2026-2404", total: 890.0, status: "Paid", date: "2026-06-15" },
        { id: "DOC-005", document_number: "INV-2026-2405", total: 5600.0, status: "Overdue", date: "2026-06-14" },
      ],
    };

    const mockDb: MockDatabase = {
      getAll: async (query: string, params?: any[]) => {
        if (query.includes("FROM tenants")) {
          return [{ id: "22222222-2222-4222-8222-222222222222" }];
        }
        if (query.includes("FROM accounts")) {
          if (query.includes("MAX(CAST(code AS INTEGER))")) {
            const type = params ? params[0] : null;
            const typeAccounts = type ? store.accounts.filter((a) => a.type === type) : store.accounts;
            const maxCode = typeAccounts.reduce((max, a) => Math.max(max, parseInt(a.code || "0")), 0);
            return [{ max_code: maxCode > 0 ? maxCode.toString() : null }];
          }
          let accs = store.accounts.map((a) => ({
            ...a,
            total_debits: a.total_debits ?? 0,
            total_credits: a.total_credits ?? 0,
          }));
          if (query.includes("HAVING") || query.includes("SUM(")) {
            accs = accs.filter((a) => a.total_debits > 0 || a.total_credits > 0);
          }
          const lowerQ = query.toLowerCase();
          if (lowerQ.includes("'revenue'") && lowerQ.includes("'expense'")) {
            accs = accs.filter((a) => a.type?.toLowerCase() === 'revenue' || a.type?.toLowerCase() === 'expense');
          } else if (lowerQ.includes("'asset'") && lowerQ.includes("'liability'")) {
            accs = accs.filter((a) => ['asset', 'liability', 'equity'].includes(a.type?.toLowerCase()));
          }
          return accs;
        }
        if (query.includes("FROM customers")) {
          if (query.includes("count(id)")) {
            return [{ count: store.customers.length }];
          }
          return store.customers;
        }
        if (query.includes("FROM suppliers")) {
          if (query.includes("count(id)")) {
            return [{ count: store.suppliers.length }];
          }
          return store.suppliers;
        }
        if (query.includes("FROM grns")) {
          if (query.includes("count(id)")) {
            return [{ count: 2, total: 11550.00 }];
          }
          if (query.includes("strftime")) {
            return [
              { month: "2026-05", total_exp: 28000 },
              { month: "2026-06", total_exp: 34000 },
              { month: "2026-07", total_exp: 29500 },
              { month: "2026-08", total_exp: 41000 },
              { month: "2026-09", total_exp: 38200 },
              { month: "2026-10", total_exp: 42000 },
              { month: "2026-11", total_exp: 39500 },
            ];
          }
          return [];
        }
        if (query.includes("FROM warehouses")) {
          return store.warehouses;
        }
        if (query.includes("FROM purchase_orders")) {
          return store.purchase_orders;
        }
        if (query.includes("FROM po_lines")) {
          if (params && params[0]) {
            return store.po_lines.filter((l) => l.purchase_order_id === params[0]);
          }
          return store.po_lines;
        }
        if (query.includes("FROM journal_entries")) {
          return store.journal_entries;
        }
        if (query.includes("FROM products")) {
          return store.products;
        }
        if (query.includes("FROM documents")) {
          if (query.includes("count(id)")) {
            return [{ count: 4, total: 18450.00 }];
          }
          if (query.includes("daily_sales")) {
            const today = new Date();
            const days = [];
            for (let i = 13; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const dayStr = d.toISOString().split("T")[0];
              const val = Math.round(800 + Math.sin(i) * 500 + (13 - i) * 60);
              days.push({ day: dayStr, daily_sales: val });
            }
            return days;
          }
          if (query.includes("strftime")) {
            return [
              { month: "2026-05", total_rev: 32000 },
              { month: "2026-06", total_rev: 45000 },
              { month: "2026-07", total_rev: 38000 },
              { month: "2026-08", total_rev: 52000 },
              { month: "2026-09", total_rev: 48000 },
              { month: "2026-10", total_rev: 61000 },
              { month: "2026-11", total_rev: 58000 },
            ];
          }
          return store.documents.map((d) => ({
            id: d.id,
            customer: d.document_number,
            amount: d.total,
            status: d.status,
            date: d.date,
          }));
        }
        return [];
      },
      execute: async (query: string, params?: any[]) => {
        if (query.includes("INSERT INTO accounts") && params && params.length >= 8) {
          store.accounts.push({
            id: params[0],
            tenant_id: params[1],
            code: params[2],
            name: params[3],
            type: params[4],
            normal_balance: params[5],
            description: params[6],
            is_active: params[7] === 1 ? 1 : 0,
          });
        } else if (query.includes("UPDATE accounts") && params && params.length >= 7) {
          const id = params[6];
          const acc = store.accounts.find((a) => a.id === id);
          if (acc) {
            acc.code = params[0];
            acc.name = params[1];
            acc.type = params[2];
            acc.normal_balance = params[3];
            acc.description = params[4];
            acc.is_active = params[5] === 1 ? 1 : 0;
          }
        }
      },
    };

    setDb(mockDb);
  }, []);

  if (!db) {
    return <div className="flex h-screen items-center justify-center">Loading local database...</div>;
  }

  return <MockDatabaseContext.Provider value={db}>{children}</MockDatabaseContext.Provider>;
}
