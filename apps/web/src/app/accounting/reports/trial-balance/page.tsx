"use client";

import React, { useEffect, useState, useCallback } from "react";
import Decimal from "decimal.js";
import { ArrowLeft, Download, Printer, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { erpApi } from "../../../../lib/api";

interface FormattedTrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  debitBalance: Decimal;
  creditBalance: Decimal;
}

export default function TrialBalanceReport() {
  const [rows, setRows] = useState<FormattedTrialBalanceRow[]>([]);
  const [totals, setTotals] = useState({ debit: new Decimal(0), credit: new Decimal(0), isBalanced: true });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tb = await erpApi.finance.getTrialBalance();

      const formatted: FormattedTrialBalanceRow[] = tb.rows
        .map((row) => {
          const d = new Decimal(row.totalDebit || "0");
          const c = new Decimal(row.totalCredit || "0");
          let finalDebit = new Decimal(0);
          let finalCredit = new Decimal(0);

          if (row.normalBalance === "DEBIT") {
            const bal = d.minus(c);
            if (bal.gte(0)) finalDebit = bal;
            else finalCredit = bal.abs();
          } else {
            const bal = c.minus(d);
            if (bal.gte(0)) finalCredit = bal;
            else finalDebit = bal.abs();
          }

          return {
            accountId: row.accountId,
            code: row.accountCode,
            name: row.accountName,
            debitBalance: finalDebit,
            creditBalance: finalCredit,
          };
        })
        .filter((r) => r.debitBalance.gt(0) || r.creditBalance.gt(0));

      const netDebitSum = formatted.reduce((s, r) => s.plus(r.debitBalance), new Decimal(0));
      const netCreditSum = formatted.reduce((s, r) => s.plus(r.creditBalance), new Decimal(0));

      setRows(formatted);
      setTotals({
        debit: netDebitSum,
        credit: netCreditSum,
        isBalanced: tb.isBalanced && netDebitSum.equals(netCreditSum),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch Trial Balance.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleExportCsv = () => {
    const csvRows = [
      ["Account Code", "Account Name", "Debit (LKR)", "Credit (LKR)"],
      ...rows.map((r) => [r.code, `"${r.name.replace(/"/g, '""')}"`, r.debitBalance.toFixed(2), r.creditBalance.toFixed(2)]),
      ["TOTALS", "", totals.debit.toFixed(2), totals.credit.toFixed(2)],
    ];
    const blob = new Blob([csvRows.map((line) => line.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trial-balance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatMoney = (dec: Decimal) =>
    Number(dec.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        <div className="flex space-x-3 print:hidden">
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {totals.debit.gt(0) && totals.isBalanced && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Trial Balance Reconciled: Total Debits equal Total Credits</span>
          </div>
          <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md">
            LKR {formatMoney(totals.debit)}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-semibold w-24">Code</th>
              <th className="p-4 font-semibold">Account</th>
              <th className="p-4 font-semibold w-36 text-right">Debit (LKR)</th>
              <th className="p-4 font-semibold w-36 text-right">Credit (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.accountId} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4 text-sm font-mono text-slate-500">{row.code}</td>
                <td className="p-4 text-sm font-medium text-slate-700">{row.name}</td>
                <td className="p-4 text-sm font-mono text-slate-800 text-right">
                  {row.debitBalance.gt(0) ? formatMoney(row.debitBalance) : "-"}
                </td>
                <td className="p-4 text-sm font-mono text-slate-800 text-right">
                  {row.creditBalance.gt(0) ? formatMoney(row.creditBalance) : "-"}
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No posted General Ledger balances found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan={2} className="p-4 text-right font-semibold text-slate-800 uppercase text-sm">
                Totals
              </td>
              <td className={`p-4 text-right font-mono font-bold ${!totals.isBalanced ? "text-red-600" : "text-slate-800"}`}>
                {formatMoney(totals.debit)}
              </td>
              <td className={`p-4 text-right font-mono font-bold ${!totals.isBalanced ? "text-red-600" : "text-slate-800"}`}>
                {formatMoney(totals.credit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
