"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePowerSync } from "../../../../components/PowerSyncProvider";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";

export default function TrialBalanceReport() {
  const db = usePowerSync();
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });

  const fetchReport = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAll(`
        SELECT 
          a.code, a.name, a.type, a.normal_balance,
          SUM(jl.debit) as total_debits,
          SUM(jl.credit) as total_credits
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        GROUP BY a.id, a.code, a.name, a.type, a.normal_balance
        HAVING SUM(jl.debit) > 0 OR SUM(jl.credit) > 0
        ORDER BY a.code ASC
      `);

      let totalD = 0;
      let totalC = 0;

      const formatted = result.map((row: any) => {
        const d = Number(row.total_debits || 0);
        const c = Number(row.total_credits || 0);
        
        let finalDebit = 0;
        let finalCredit = 0;

        if (row.normal_balance === 'debit') {
           const bal = d - c;
           if (bal >= 0) finalDebit = bal;
           else finalCredit = Math.abs(bal);
        } else {
           const bal = c - d;
           if (bal >= 0) finalCredit = bal;
           else finalDebit = Math.abs(bal);
        }

        totalD += finalDebit;
        totalC += finalCredit;

        return { ...row, debitBalance: finalDebit, creditBalance: finalCredit };
      });

      setData(formatted);
      setTotals({ debit: totalD, credit: totalC });
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4">
          <Link href="/accounting/reports" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Trial Balance</h1>
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-semibold w-24">Code</th>
              <th className="p-4 font-semibold">Account</th>
              <th className="p-4 font-semibold w-32 text-right">Debit</th>
              <th className="p-4 font-semibold w-32 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4 text-sm text-slate-500">{row.code}</td>
                <td className="p-4 text-sm font-medium text-slate-700">{row.name}</td>
                <td className="p-4 text-sm text-slate-800 text-right">
                  {row.debitBalance > 0 ? row.debitBalance.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                </td>
                <td className="p-4 text-sm text-slate-800 text-right">
                  {row.creditBalance > 0 ? row.creditBalance.toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">No data available.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan={2} className="p-4 text-right font-semibold text-slate-800 uppercase text-sm">Totals</td>
              <td className={`p-4 text-right font-bold ${totals.debit !== totals.credit ? 'text-red-600' : 'text-slate-800'}`}>
                {totals.debit.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
              <td className={`p-4 text-right font-bold ${totals.debit !== totals.credit ? 'text-red-600' : 'text-slate-800'}`}>
                {totals.credit.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
