"use client";

import React, { useEffect, useState, useCallback } from "react";
import Decimal from "decimal.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, PlusCircle, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { erpApi } from "../../lib/api";

interface ExpenseRow {
  category: string;
  amount: number;
}

interface ActivityBarRow {
  account: string;
  debit: number;
  credit: number;
}

export default function AccountingDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    assets: "0.00",
    liabilities: "0.00",
    netIncome: "0.00",
    expenses: "0.00",
  });

  const [accountMixData, setAccountMixData] = useState<ActivityBarRow[]>([]);
  const [expenseByAccountData, setExpenseByAccountData] = useState<ExpenseRow[]>([]);

  const fetchMetrics = useCallback(async () => {
    setError(null);
    try {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString();

      const [accounts, pnl] = await Promise.all([
        erpApi.finance.listAccounts(),
        erpApi.bi.getProfitAndLoss(monthStart, monthEnd),
      ]);

      let assetsDec = new Decimal(0);
      let liabilitiesDec = new Decimal(0);
      let totalExpensesDec = new Decimal(0);

      const typeAgg: Record<string, { debit: Decimal; credit: Decimal }> = {
        ASSET: { debit: new Decimal(0), credit: new Decimal(0) },
        LIABILITY: { debit: new Decimal(0), credit: new Decimal(0) },
        EQUITY: { debit: new Decimal(0), credit: new Decimal(0) },
        REVENUE: { debit: new Decimal(0), credit: new Decimal(0) },
        EXPENSE: { debit: new Decimal(0), credit: new Decimal(0) },
      };

      const expenseRows: ExpenseRow[] = [];

      for (const acc of accounts) {
        const debit = new Decimal(acc.totalDebits || "0");
        const credit = new Decimal(acc.totalCredits || "0");
        const normalBal = (acc.normalBalance || "DEBIT").toUpperCase();
        const balance = normalBal === "DEBIT" ? debit.minus(credit) : credit.minus(debit);
        const typeKey = (acc.type || "").toUpperCase();

        if (typeAgg[typeKey]) {
          typeAgg[typeKey].debit = typeAgg[typeKey].debit.plus(debit);
          typeAgg[typeKey].credit = typeAgg[typeKey].credit.plus(credit);
        }

        if (typeKey === "ASSET") {
          assetsDec = assetsDec.plus(balance);
        } else if (typeKey === "LIABILITY") {
          liabilitiesDec = liabilitiesDec.plus(balance);
        } else if (typeKey === "EXPENSE") {
          totalExpensesDec = totalExpensesDec.plus(balance);
          if (!balance.isZero()) {
            expenseRows.push({
              category: `${acc.code} ${acc.name}`,
              amount: Number(balance.toFixed(2)),
            });
          }
        }
      }

      const netProfitDec = new Decimal(pnl.netProfit || "0");

      setMetrics({
        assets: assetsDec.toFixed(2),
        liabilities: liabilitiesDec.toFixed(2),
        netIncome: netProfitDec.toFixed(2),
        expenses: totalExpensesDec.toFixed(2),
      });

      setAccountMixData(
        Object.entries(typeAgg).map(([typeKey, sums]) => ({
          account: typeKey.charAt(0) + typeKey.slice(1).toLowerCase(),
          debit: Number(sums.debit.toFixed(2)),
          credit: Number(sums.credit.toFixed(2)),
        }))
      );

      setExpenseByAccountData(expenseRows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load live accounting metrics from API Gateway.");
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatLkr = (val: string) =>
    Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Financial Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time General Ledger snapshot from Finance service</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/accounting/journals/new" className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <PlusCircle size={16} />
            <span>New Journal</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assets"
          value={`LKR ${formatLkr(metrics.assets)}`}
          icon={<BookOpen size={20} className="text-blue-500" />}
          borderColor="border-b-blue-500"
        />
        <MetricCard
          title="Total Liabilities"
          value={`LKR ${formatLkr(metrics.liabilities)}`}
          icon={<TrendingDown size={20} className="text-rose-500" />}
          borderColor="border-b-rose-500"
        />
        <MetricCard
          title="Net Income (MTD)"
          value={`LKR ${formatLkr(metrics.netIncome)}`}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          borderColor="border-b-emerald-500"
        />
        <MetricCard
          title="Ledger Expenses"
          value={`LKR ${formatLkr(metrics.expenses)}`}
          icon={<DollarSign size={20} className="text-orange-500" />}
          borderColor="border-b-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">GL Activity by Account Type</h3>
              <p className="text-xs text-slate-400 mt-0.5">Posted debits vs. credits across account classes</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountMixData} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="account" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(val: unknown) => [`LKR ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px", color: "#64748b" }} />
                <Bar dataKey="debit" name="Debits" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="credit" name="Credits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Expense Breakdown by GL Account</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live posted balances on EXPENSE accounts</p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              Total: LKR {formatLkr(metrics.expenses)}
            </span>
          </div>

          <div className="h-64 w-full">
            {expenseByAccountData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No posted expense entries yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseByAccountData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    formatter={(val: unknown) => [`LKR ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Expense"]}
                  />
                  <Bar dataKey="amount" name="Amount (LKR)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, borderColor }: { title: string; value: string; icon: React.ReactNode; borderColor: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-b-4 ${borderColor} relative overflow-hidden`}>
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 blur-xl ${borderColor.replace("border-b-", "bg-")}`}></div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-medium text-slate-400">{title}</h3>
        <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
