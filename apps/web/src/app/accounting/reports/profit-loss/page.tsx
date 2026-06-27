"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePowerSync } from "../../../../components/PowerSyncProvider";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";

export default function ProfitAndLossReport() {
  const db = usePowerSync();
  const [data, setData] = useState<any>({
    revenue: [],
    expenses: [],
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0
  });

  const fetchReport = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAll(`
        SELECT 
          a.code, a.name, a.type, a.normal_balance,
          SUM(jl.debit) as total_debits,
          SUM(jl.credit) as total_credits
        FROM accounts a
        JOIN journal_lines jl ON a.id = jl.account_id
        WHERE a.type IN ('revenue', 'expense')
        GROUP BY a.id, a.code, a.name, a.type, a.normal_balance
        ORDER BY a.code ASC
      `);

      const revenue: any[] = [];
      const expenses: any[] = [];
      let totalRev = 0;
      let totalExp = 0;

      result.forEach((row: any) => {
        const d = Number(row.total_debits || 0);
        const c = Number(row.total_credits || 0);
        const balance = row.normal_balance === 'debit' ? (d - c) : (c - d);
        
        if (row.type === 'revenue') {
          revenue.push({ ...row, balance });
          totalRev += balance;
        } else if (row.type === 'expense') {
          expenses.push({ ...row, balance });
          totalExp += balance;
        }
      });

      setData({
        revenue,
        expenses,
        totalRevenue: totalRev,
        totalExpenses: totalExp,
        netIncome: totalRev - totalExp
      });
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto mb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4">
          <Link href="/accounting/reports" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Profit and Loss</h1>
            <p className="text-sm text-slate-500 mt-1">Year to Date</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Income Statement</h2>
          <p className="text-slate-500">For the period ending {new Date().toLocaleDateString()}</p>
        </div>

        {/* REVENUE */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">Revenue</h3>
          <div className="space-y-2">
            {data.revenue.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-slate-600">{r.name}</span>
                <span className="text-slate-800">{r.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
            {data.revenue.length === 0 && <div className="text-slate-400 italic py-1">No revenue recorded</div>}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Revenue</span>
            <span className="text-slate-800">{data.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">Operating Expenses</h3>
          <div className="space-y-2">
            {data.expenses.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-slate-600">{r.name}</span>
                <span className="text-slate-800">{r.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
            {data.expenses.length === 0 && <div className="text-slate-400 italic py-1">No expenses recorded</div>}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Expenses</span>
            <span className="text-slate-800">{data.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        {/* NET INCOME */}
        <div className="flex justify-between items-center pt-4 mt-8 border-t-4 border-slate-800">
          <span className="text-xl font-bold text-slate-800">Net Income</span>
          <span className={`text-xl font-bold ${data.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {data.netIncome < 0 ? '(' : ''}
            LKR {Math.abs(data.netIncome).toLocaleString(undefined, {minimumFractionDigits: 2})}
            {data.netIncome < 0 ? ')' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
