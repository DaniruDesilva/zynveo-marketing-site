"use client";

import React, { useEffect, useState, useCallback } from "react";
import Decimal from "decimal.js";
import { Plus, Search, AlertCircle, RefreshCw } from "lucide-react";
import { erpApi } from "../../../lib/api";
import AccountModal from "./AccountModal";

interface FormattedAccount {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normalBalance: string;
  description?: string | null;
  isActive: boolean;
  balance: Decimal;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<FormattedAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await erpApi.finance.listAccounts();

      const formattedAccounts: FormattedAccount[] = result.map((row) => {
        const debit = new Decimal(row.totalDebits || "0");
        const credit = new Decimal(row.totalCredits || "0");
        const normalBal = (row.normalBalance || "DEBIT").toLowerCase();
        const balance = normalBal === "debit" ? debit.minus(credit) : credit.minus(debit);

        return {
          id: row.id,
          code: row.code,
          name: row.name,
          type: row.type.toLowerCase() as FormattedAccount["type"],
          normalBalance: normalBal,
          description: row.description,
          isActive: row.isActive,
          balance,
        };
      });

      setAccounts(formattedAccounts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load Chart of Accounts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAccounts = filteredAccounts.reduce<Record<string, FormattedAccount[]>>((acc, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {});

  const typeOrder: Array<FormattedAccount["type"]> = ["asset", "liability", "equity", "revenue", "expense"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
          <button
            onClick={fetchAccounts}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Normal Balance</th>
                <th className="p-4 font-semibold text-right">Balance (LKR)</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {typeOrder.map((type) => {
                const typeAccounts = groupedAccounts[type];
                if (!typeAccounts || typeAccounts.length === 0) return null;
                return (
                  <React.Fragment key={type}>
                    <tr className="bg-slate-50/50 border-y border-slate-100">
                      <td colSpan={6} className="p-3 text-sm font-semibold text-slate-700 capitalize pl-4">
                        {type === "liability" ? "Liabilities" : `${type}s`}
                      </td>
                    </tr>
                    {typeAccounts.map((account) => {
                      const isNegative = account.balance.isNegative();
                      const formattedBal = Number(account.balance.abs().toFixed(2)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                      return (
                        <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-sm font-mono font-medium text-slate-700">{account.code}</td>
                          <td className="p-4 text-sm text-slate-700 font-medium">{account.name}</td>
                          <td className="p-4 text-sm text-slate-500 capitalize">{account.type}</td>
                          <td className="p-4 text-xs text-slate-500 uppercase">{account.normalBalance}</td>
                          <td className="p-4 text-sm font-mono font-medium text-slate-800 text-right">
                            {isNegative ? <span className="text-rose-500">({formattedBal})</span> : <span>{formattedBal}</span>}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                account.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {account.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {!isLoading && filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No accounts found. Create your first GL account to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AccountModal
          existingAccounts={accounts.map((a) => ({ code: a.code, type: a.type.toUpperCase() }))}
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
