"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, MoreHorizontal, ArrowUpDown } from "lucide-react";



import { usePowerSync } from "../../components/PowerSyncProvider";

export default function InventoryClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const db = usePowerSync();
  const [initialInventory, setInitialInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const results = await db.getAll(`
        SELECT p.id, p.name, v.sku, p.category, s.quantity as stock, v.price
        FROM products p
        JOIN product_variants v ON p.id = v.product_id
        JOIN stock_levels s ON v.id = s.variant_id
      `);
      
      const mapped = results.map(item => {
        const stockNum = Number(item.stock);
        let status = "In Stock";
        if (stockNum === 0) status = "Out of Stock";
        else if (stockNum < 20) status = "Low Stock";
        return { ...item, status };
      });
      setInitialInventory(mapped);
    };
    fetchInventory();
  }, [db]);
  
  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-slate-500">Manage products, variants, and stock levels.</p>
        </div>
        <button className="flex items-center justify-center px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
          <Plus size={16} className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, SKU, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800">
            <Filter size={16} className="mr-2" />
            Filters
          </button>
        </div>

        {/* High-Density Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-zinc-950 uppercase border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-6 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                  <div className="flex items-center">
                    Product Details
                    <ArrowUpDown size={14} className="ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">SKU</th>
                <th className="px-6 py-3 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">Category</th>
                <th className="px-6 py-3 font-medium text-right">Price</th>
                <th className="px-6 py-3 font-medium text-right">Stock</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="w-16 px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {initialInventory.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.sku.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-3">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.id}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{product.sku}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{product.category}</td>
                  <td className="px-6 py-3 text-right font-medium">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-medium">{product.stock}</td>
                  <td className="px-6 py-3 text-center">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
          <span className="text-sm text-slate-500">Showing 1 to 5 of 5 entries</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-slate-200 dark:border-zinc-800 rounded text-sm disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-slate-200 dark:border-zinc-800 rounded text-sm disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let colors = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  
  if (status === "In Stock") {
    colors = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  } else if (status === "Low Stock") {
    colors = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  } else if (status === "Out of Stock") {
    colors = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {status}
    </span>
  );
}
