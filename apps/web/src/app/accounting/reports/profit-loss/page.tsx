"use client";

import React, { useEffect, useState, useCallback } from "react";
import Decimal from "decimal.js";
import { ArrowLeft, Download, Printer, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { erpApi } from "../../../../lib/api";

interface AccountLine {
  id: string;
  code: string;
  name: string;
  balance: Decimal;
}

export default function ProfitAndLossReport() {
  const now = new Date();
  const defaultStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const defaultEnd = now.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [revenueRows, setRevenueRows] = useState<AccountLine[]>([]);
  const [expenseRows, setExpenseRows] = useState<AccountLine[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: new Decimal(0),
    totalCogs: new Decimal(0),
    grossProfit: new Decimal(0),
    totalOperatingExpenses: new Decimal(0),
    netProfit: new Decimal(0),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startIso = new Date(`${startDate}T00:00:00.000Z`).toISOString();
      const endIso = new Date(`${endDate}T23:59:59.999Z`).toISOString();

      const [pnl, accounts] = await Promise.all([
        erpApi.bi.getProfitAndLoss(startIso, endIso),
        erpApi.finance.listAccounts(),
      ]);

      const revs: AccountLine[] = [];
      const exps: AccountLine[] = [];

      for (const row of accounts) {
        const debit = new Decimal(row.totalDebits || "0");
        const credit = new Decimal(row.totalCredits || "0");
        const nb = (row.normalBalance || "DEBIT").toUpperCase();
        const bal = nb === "DEBIT" ? debit.minus(credit) : credit.minus(debit);

        if (row.type === "REVENUE") {
          revs.push({ id: row.id, code: row.code, name: row.name, balance: bal });
        } else if (row.type === "EXPENSE") {
          exps.push({ id: row.id, code: row.code, name: row.name, balance: bal });
        }
      }

      setRevenueRows(revs);
      setExpenseRows(exps);
      setSummary({
        totalRevenue: new Decimal(pnl.totalRevenue || "0"),
        totalCogs: new Decimal(pnl.totalCogs || "0"),
        grossProfit: new Decimal(pnl.grossProfit || "0"),
        totalOperatingExpenses: new Decimal(pnl.totalOperatingExpenses || "0"),
        netProfit: new Decimal(pnl.netProfit || "0"),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch Profit & Loss statement.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatMoney = (dec: Decimal) =>
    Number(dec.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ["Section", "Code", "Account / Line", "Amount (LKR)"],
      ...revenueRows.map((r) => ["Revenue (Ledger YTD)", r.code, `"${r.name.replace(/"/g, '""')}"`, r.balance.toFixed(2)]),
      ...expenseRows.map((r) => ["Expense (Ledger YTD)", r.code, `"${r.name.replace(/"/g, '""')}"`, r.balance.toFixed(2)]),
      ["Period Summary", "", `Revenue (${startDate}..${endDate})`, summary.totalRevenue.toFixed(2)],
      ["Period Summary", "", "Cost of Goods Sold", summary.totalCogs.toFixed(2)],
      ["Period Summary", "", "Gross Profit", summary.grossProfit.toFixed(2)],
      ["Period Summary", "", "Operating Expenses", summary.totalOperatingExpenses.toFixed(2)],
      ["Period Summary", "", "Net Profit", summary.netProfit.toFixed(2)],
    ];
    const blob = new Blob([csvRows.map((line) => line.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profit-and-loss-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto mb-10">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4">
          <Link href="/accounting/reports" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Profit and Loss</h1>
            <p className="text-sm text-slate-500 mt-1">
              Period: {startDate} to {endDate}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
          />
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="flex items-center space-x-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Income Statement</h2>
          <p className="text-slate-500">
            For the period {startDate} through {endDate}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">
            Period Performance Summary (BI Reporting)
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Period Revenue</span>
              <span className="font-mono font-semibold text-slate-800">LKR {formatMoney(summary.totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Cost of Goods Sold (COGS)</span>
              <span className="font-mono text-rose-600">({formatMoney(summary.totalCogs)})</span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-200 font-semibold">
              <span className="text-slate-800">Gross Profit</span>
              <span className="font-mono text-slate-800">LKR {formatMoney(summary.grossProfit)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Operating Expenses</span>
              <span className="font-mono text-rose-600">({formatMoney(summary.totalOperatingExpenses)})</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">
            Ledger Revenue Accounts (Cumulative)
          </h3>
          <div className="space-y-2">
            {revenueRows.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-1 text-sm">
                <span className="text-slate-600">
                  <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>
                  {r.name}
                </span>
                <span className="font-mono text-slate-800">{formatMoney(r.balance)}</span>
              </div>
            ))}
            {revenueRows.length === 0 && <div className="text-slate-400 italic py-1 text-sm">No revenue accounts</div>}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">
            Ledger Expense Accounts (Cumulative)
          </h3>
          <div className="space-y-2">
            {expenseRows.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-1 text-sm">
                <span className="text-slate-600">
                  <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>
                  {r.name}
                </span>
                <span className="font-mono text-slate-800">{formatMoney(r.balance)}</span>
              </div>
            ))}
            {expenseRows.length === 0 && <div className="text-slate-400 italic py-1 text-sm">No expense accounts</div>}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 mt-8 border-t-4 border-slate-800">
          <span className="text-xl font-bold text-slate-800">Period Net Income</span>
          <span className={`text-xl font-mono font-bold ${summary.netProfit.gte(0) ? "text-emerald-600" : "text-rose-600"}`}>
            {summary.netProfit.lt(0) ? "(" : ""}
            LKR {formatMoney(summary.netProfit.abs())}
            {summary.netProfit.lt(0) ? ")" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
