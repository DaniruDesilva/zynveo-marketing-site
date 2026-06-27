"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePowerSync } from "../../../../components/PowerSyncProvider";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";

export default function BalanceSheetReport() {
  const db = usePowerSync();
  const [data, setData] = useState<any>({
    assets: [],
    liabilities: [],
    equity: [],
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0, // This forms part of current year equity
  });

  const fetchReport = useCallback(async () => {
    if (!db) return;
    try {
      // Fetch all accounts and their balances
      const result = await db.getAll(`
        SELECT 
          a.code, a.name, a.type, a.normal_balance,
          SUM(jl.debit) as total_debits,
          SUM(jl.credit) as total_credits
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        GROUP BY a.id, a.code, a.name, a.type, a.normal_balance
        ORDER BY a.code ASC
      `);

      const assets: any[] = [];
      const liabilities: any[] = [];
      const equity: any[] = [];
      let totalAss = 0;
      let totalLia = 0;
      let totalEqu = 0;
      let revenue = 0;
      let expenses = 0;

      result.forEach((row: any) => {
        const d = Number(row.total_debits || 0);
        const c = Number(row.total_credits || 0);
        const balance = row.normal_balance === 'debit' ? (d - c) : (c - d);
        
        switch (row.type) {
          case 'asset':
            assets.push({ ...row, balance });
            totalAss += balance;
            break;
          case 'liability':
            liabilities.push({ ...row, balance });
            totalLia += balance;
            break;
          case 'equity':
            equity.push({ ...row, balance });
            totalEqu += balance;
            break;
          case 'revenue':
            revenue += balance;
            break;
          case 'expense':
            expenses += balance;
            break;
        }
      });

      const netIncome = revenue - expenses;

      setData({
        assets,
        liabilities,
        equity,
        totalAssets: totalAss,
        totalLiabilities: totalLia,
        totalEquity: totalEqu,
        netIncome
      });
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalLiabilitiesAndEquity = data.totalLiabilities + data.totalEquity + data.netIncome;

  return (
    <div className="space-y-6 max-w-4xl mx-auto mb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4">
          <Link href="/accounting/reports" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Balance Sheet</h1>
            <p className="text-sm text-slate-500 mt-1">As of {new Date().toLocaleDateString()}</p>
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
          <h2 className="text-2xl font-bold text-slate-800">Balance Sheet</h2>
          <p className="text-slate-500">As of {new Date().toLocaleDateString()}</p>
        </div>

        {/* ASSETS */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-800 pb-2 mb-4">Assets</h3>
          <div className="space-y-2">
            {data.assets.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-slate-600">{r.name}</span>
                <span className="text-slate-800">{r.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
            {data.assets.length === 0 && <div className="text-slate-400 italic py-1">No assets recorded</div>}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Assets</span>
            <span className="text-slate-800">{data.totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        {/* LIABILITIES */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-rose-800 border-b-2 border-rose-800 pb-2 mb-4">Liabilities</h3>
          <div className="space-y-2">
            {data.liabilities.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-slate-600">{r.name}</span>
                <span className="text-slate-800">{r.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
            {data.liabilities.length === 0 && <div className="text-slate-400 italic py-1">No liabilities recorded</div>}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Liabilities</span>
            <span className="text-slate-800">{data.totalLiabilities.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        {/* EQUITY */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-purple-800 border-b-2 border-purple-800 pb-2 mb-4">Equity</h3>
          <div className="space-y-2">
            {data.equity.map((r: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-slate-600">{r.name}</span>
                <span className="text-slate-800">{r.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Current Year Earnings (Net Income)</span>
              <span className="text-slate-800">{data.netIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Equity</span>
            <span className="text-slate-800">{(data.totalEquity + data.netIncome).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        {/* TOTAL L&E */}
        <div className="flex justify-between items-center pt-4 mt-8 border-t-4 border-slate-800">
          <span className="text-xl font-bold text-slate-800">Total Liabilities & Equity</span>
          <span className={`text-xl font-bold ${data.totalAssets !== totalLiabilitiesAndEquity ? 'text-red-600' : 'text-slate-800'}`}>
            LKR {totalLiabilitiesAndEquity.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
        </div>
        {data.totalAssets !== totalLiabilitiesAndEquity && (
          <div className="mt-2 text-red-500 text-sm text-right font-medium">
            Warning: Balance sheet does not balance. Difference: {Math.abs(data.totalAssets - totalLiabilitiesAndEquity).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        )}
      </div>
    </div>
  );
}
