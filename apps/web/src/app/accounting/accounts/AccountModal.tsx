"use client";

import React, { useState, useEffect } from "react";
import { usePowerSync } from "../../../components/PowerSyncProvider";
import { X } from "lucide-react";

export default function AccountModal({ account, onClose, onSaved }: { account: any, onClose: () => void, onSaved: () => void }) {
  const db = usePowerSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: account?.code || "",
    name: account?.name || "",
    type: account?.type || "asset",
    normal_balance: account?.normal_balance || "debit",
    description: account?.description || "",
    is_active: account ? account.is_active : true,
  });

  // Auto-generate account code based on type for new accounts
  useEffect(() => {
    if (account) return; // Do not auto-generate if editing an existing account

    const fetchNextCode = async () => {
      if (!db) return;
      try {
        let baseCode = 1000;
        switch (formData.type) {
          case 'asset': baseCode = 1000; break;
          case 'liability': baseCode = 2000; break;
          case 'equity': baseCode = 3000; break;
          case 'revenue': baseCode = 4000; break;
          case 'expense': baseCode = 5000; break;
        }

        const res = await db.getAll(
          `SELECT MAX(CAST(code AS INTEGER)) as max_code FROM accounts WHERE type = ?`,
          [formData.type]
        );
        
        let nextCode = baseCode;
        if (res.length > 0 && res[0].max_code) {
          const currentMax = parseInt(res[0].max_code, 10);
          if (!isNaN(currentMax) && currentMax >= baseCode && currentMax < baseCode + 1000) {
             nextCode = currentMax + 1;
          }
        }
        
        setFormData(prev => ({ ...prev, code: nextCode.toString() }));
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchNextCode();
  }, [formData.type, db, account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Auto-set normal balance when type changes
    if (name === 'type' && !account) {
      let normal_balance = 'debit';
      if (['liability', 'equity', 'revenue'].includes(value)) {
        normal_balance = 'credit';
      }
      setFormData(prev => ({
        ...prev,
        [name]: value,
        normal_balance
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);
    setError("");

    try {
      // Get first tenant or use fallback
      const tenantRes = await db.getAll("SELECT id FROM tenants LIMIT 1");
      const tenantId = tenantRes.length > 0 ? tenantRes[0].id : crypto.randomUUID();

      if (account) {
        // Update
        await db.execute(
          `UPDATE accounts 
           SET code = ?, name = ?, type = ?, normal_balance = ?, description = ?, is_active = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [formData.code, formData.name, formData.type, formData.normal_balance, formData.description, formData.is_active ? 1 : 0, account.id]
        );
      } else {
        // Insert
        const id = crypto.randomUUID();
        await db.execute(
          `INSERT INTO accounts (id, tenant_id, code, name, type, normal_balance, description, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [id, tenantId, formData.code, formData.name, formData.type, formData.normal_balance, formData.description, formData.is_active ? 1 : 0]
        );
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {account ? "Edit Account" : "New Account"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 opacity-75">
              <label className="text-sm font-medium text-slate-700">Account Code</label>
              <input 
                required
                disabled
                type="text"
                name="code"
                value={formData.code}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                placeholder="Auto-generated"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Account Type</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Account Name</label>
            <input 
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Cash in Bank"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Normal Balance</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name="normal_balance" value="debit" checked={formData.normal_balance === 'debit'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">Debit</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="normal_balance" value="credit" checked={formData.normal_balance === 'credit'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">Credit</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assets & Expenses typically have a Debit balance. Liabilities, Equity, & Revenue typically have a Credit balance.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">Active Account</label>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
