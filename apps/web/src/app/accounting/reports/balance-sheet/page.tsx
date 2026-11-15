"use client";

import React, { useEffect, useState, useCallback } from "react";
import Decimal from "decimal.js";
import { ArrowLeft, Download, Printer, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { erpApi } from "../../../../lib/api";

type BalanceSheetData = Awaited<ReturnType<typeof erpApi.finance.getBalanceSheet>>;

export default function BalanceSheetReport() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bs = await erpApi.finance.getBalanceSheet();
      setData(bs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch Balance Sheet.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalAssetsDec = new Decimal(data?.totalAssets || "0");
  const totalLiabilitiesDec = new Decimal(data?.totalLiabilities || "0");
  const totalEquityDec = new Decimal(data?.totalEquity || "0");
  const retainedDec = new Decimal(data?.retainedEarningsCurrentPeriod || "0");
  const totalLiabilitiesAndEquityDec = totalLiabilitiesDec.plus(totalEquityDec);
  const diffDec = totalAssetsDec.minus(totalLiabilitiesAndEquityDec).abs();

  const formatMoney = (val: string | Decimal) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleExportCsv = () => {
    if (!data) return;
    const csvRows = [
      ["Section", "Code", "Account", "Amount (LKR)"],
      ...data.assets.map((r) => ["Asset", r.code, `"${r.name.replace(/"/g, '""')}"`, r.amount]),
      ["Total Assets", "", "", data.totalAssets],
      ...data.liabilities.map((r) => ["Liability", r.code, `"${r.name.replace(/"/g, '""')}"`, r.amount]),
      ["Total Liabilities", "", "", data.totalLiabilities],
      ...data.equity.map((r) => ["Equity", r.code, `"${r.name.replace(/"/g, '""')}"`, r.amount]),
      ["Equity", "", "Current Period Retained Earnings", data.retainedEarningsCurrentPeriod],
      ["Total Equity", "", "", data.totalEquity],
      ["Total Liabilities & Equity", "", "", totalLiabilitiesAndEquityDec.toFixed(2)],
    ];
    const blob = new Blob([csvRows.map((line) => line.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `balance-sheet-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto mb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4">
          <Link href="/accounting/reports" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Balance Sheet</h1>
            <p className="text-sm text-slate-500 mt-1">
              As of {data?.asOfDate ? new Date(data.asOfDate).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
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
            disabled={!data}
            className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
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
          <h2 className="text-2xl font-bold text-slate-800">Statement of Financial Position</h2>
          <p className="text-slate-500">
            As of {data?.asOfDate ? new Date(data.asOfDate).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-blue-800 border-b-2 border-blue-800 pb-2 mb-4">Assets</h3>
          <div className="space-y-2">
            {(data?.assets ?? []).map((r) => (
              <div key={r.accountId} className="flex justify-between items-center py-1">
                <span className="text-slate-600">
                  <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>
                  {r.name}
                </span>
                <span className="font-mono text-slate-800">{formatMoney(r.amount)}</span>
              </div>
            ))}
            {(!data || data.assets.length === 0) && <div className="text-slate-400 italic py-1">No assets recorded</div>}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Assets</span>
            <span className="font-mono text-slate-800">LKR {formatMoney(totalAssetsDec)}</span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-rose-800 border-b-2 border-rose-800 pb-2 mb-4">Liabilities</h3>
          <div className="space-y-2">
            {(data?.liabilities ?? []).map((r) => (
              <div key={r.accountId} className="flex justify-between items-center py-1">
                <span className="text-slate-600">
                  <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>
                  {r.name}
                </span>
                <span className="font-mono text-slate-800">{formatMoney(r.amount)}</span>
              </div>
            ))}
            {(!data || data.liabilities.length === 0) && (
              <div className="text-slate-400 italic py-1">No liabilities recorded</div>
            )}
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Liabilities</span>
            <span className="font-mono text-slate-800">LKR {formatMoney(totalLiabilitiesDec)}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-purple-800 border-b-2 border-purple-800 pb-2 mb-4">Equity</h3>
          <div className="space-y-2">
            {(data?.equity ?? []).map((r) => (
              <div key={r.accountId} className="flex justify-between items-center py-1">
                <span className="text-slate-600">
                  <span className="font-mono text-xs text-slate-400 mr-2">{r.code}</span>
                  {r.name}
                </span>
                <span className="font-mono text-slate-800">{formatMoney(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Current Period Earnings (Net Income)</span>
              <span className="font-mono text-slate-800">{formatMoney(retainedDec)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200 font-semibold">
            <span className="text-slate-800">Total Equity</span>
            <span className="font-mono text-slate-800">LKR {formatMoney(totalEquityDec)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 mt-8 border-t-4 border-slate-800">
          <span className="text-xl font-bold text-slate-800">Total Liabilities & Equity</span>
          <span className={`text-xl font-mono font-bold ${data && !data.isBalanced ? "text-red-600" : "text-slate-800"}`}>
            LKR {formatMoney(totalLiabilitiesAndEquityDec)}
          </span>
        </div>
        {data && !data.isBalanced && (
          <div className="mt-2 text-red-500 text-sm text-right font-medium">
            Warning: Balance sheet out of balance. Difference: LKR {formatMoney(diffDec)}
          </div>
        )}
      </div>
    </div>
  );
}
