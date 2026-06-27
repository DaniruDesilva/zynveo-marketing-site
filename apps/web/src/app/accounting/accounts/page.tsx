"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePowerSync } from "../../../components/PowerSyncProvider";
import { Plus, Search, Edit2 } from "lucide-react";
import AccountModal from "./AccountModal";

export default function ChartOfAccountsPage() {
  const db = usePowerSync();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const fetchAccounts = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAll(`
        SELECT 
          a.id, a.code, a.name, a.type, a.normal_balance, a.is_active,
          SUM(jl.debit) as total_debits,
          SUM(jl.credit) as total_credits
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        GROUP BY a.id, a.code, a.name, a.type, a.normal_balance, a.is_active
        ORDER BY a.code ASC
      `);

      const formattedAccounts = result.map((row: any) => {
        const debit = Number(row.total_debits || 0);
        const credit = Number(row.total_credits || 0);
        const balance = row.normal_balance === 'debit' ? (debit - credit) : (credit - debit);
        
        return {
          ...row,
          balance
        };
      });

      setAccounts(formattedAccounts);
    } catch (e) {
      console.error("Failed to fetch accounts:", e);
    }
  }, [db]);

  useEffect(() => {
    fetchAccounts();
    
    // Subscribe to changes if possible, or just re-fetch when modal closes
    if (db) {
       // In a real scenario we use db.watch
    }
  }, [fetchAccounts, db]);

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    acc.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAccounts = filteredAccounts.reduce((acc: any, account: any) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {});

  const typeOrder = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  const openNewModal = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const openEditModal = (account: any) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your general ledger accounts</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <button onClick={openNewModal} className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Balance</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {typeOrder.map(type => {
                const typeAccounts = groupedAccounts[type];
                if (!typeAccounts || typeAccounts.length === 0) return null;
                return (
                  <React.Fragment key={type}>
                    {/* Group Header */}
                    <tr className="bg-slate-50/50 border-y border-slate-100">
                      <td colSpan={6} className="p-3 text-sm font-semibold text-slate-700 capitalize pl-4">
                        {type}s
                      </td>
                    </tr>
                    {/* Accounts */}
                    {typeAccounts.map((account: any) => (
                      <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-sm font-medium text-slate-700">{account.code}</td>
                        <td className="p-4 text-sm text-slate-600">{account.name}</td>
                        <td className="p-4 text-sm text-slate-500 capitalize">{account.type}</td>
                        <td className="p-4 text-sm font-medium text-slate-800 text-right">
                          {account.balance < 0 ? (
                            <span className="text-rose-500">({Math.abs(account.balance).toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                          ) : (
                            <span>{account.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => openEditModal(account)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No accounts found. Create your first account to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AccountModal 
          account={editingAccount} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={() => {
            setIsModalOpen(false);
            fetchAccounts();
          }} 
        />
      )}
    </div>
  );
}
