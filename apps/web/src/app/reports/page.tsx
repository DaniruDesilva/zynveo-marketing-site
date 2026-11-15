"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import {
  BarChart2,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpRight,
  Layers,
  Boxes,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { erpApi } from "../../lib/api";

function formatMoney(val: string | Decimal): string {
  const num = new Decimal(val || "0").toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
  const [intPart, decPart] = num.split(".");
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decPart}`;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kpis, setKpis] = useState({
    todayRevenue: "0.00",
    totalRevenueMtd: "0.00",
    totalExpensesMtd: "0.00",
    netProfitMtd: "0.00",
    accountsReceivableOpen: "0.00",
    accountsPayableOpen: "0.00",
    inventoryValuationTotal: "0.00",
    lowStockProductsCount: 0,
  });

  const loadKpis = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = now.toISOString();

      const [execRes, pnlRes] = await Promise.all([
        erpApi.bi.getExecutiveKpis(),
        erpApi.bi.getProfitAndLoss(monthStart, monthEnd).catch(() => null),
      ]);

      const totalExpenses = pnlRes
        ? new Decimal(pnlRes.totalCogs || "0").plus(new Decimal(pnlRes.totalOperatingExpenses || "0"))
        : new Decimal("0");

      setKpis({
        todayRevenue: formatMoney(execRes.todayRevenue || "0"),
        totalRevenueMtd: formatMoney(pnlRes?.totalRevenue || execRes.todayRevenue || "0"),
        totalExpensesMtd: formatMoney(totalExpenses),
        netProfitMtd: formatMoney(pnlRes?.netProfit || "0"),
        accountsReceivableOpen: formatMoney(execRes.totalAccountsReceivable || "0"),
        accountsPayableOpen: formatMoney(execRes.totalAccountsPayable || "0"),
        inventoryValuationTotal: formatMoney(execRes.totalInventoryValuationWac || "0"),
        lowStockProductsCount: execRes.lowStockProductsCount || 0,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load executive reports from API Gateway.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const statementReports = [
    {
      title: "Profit & Loss (Income Statement)",
      description: "Net revenue, Cost of Goods Sold (COGS), operating expenses, and net profit margin.",
      href: "/accounting/reports/profit-loss",
      icon: <TrendingUp className="text-emerald-500" size={24} />,
      bg: "bg-emerald-50",
    },
    {
      title: "Balance Sheet Statement",
      description: "Company financial health: Assets = Liabilities + Shareholder Equity as of period close.",
      href: "/accounting/reports/balance-sheet",
      icon: <Layers className="text-blue-500" size={24} />,
      bg: "bg-blue-50",
    },
    {
      title: "General Ledger Trial Balance",
      description: "Summary of all account debit and credit balances across the chart of accounts.",
      href: "/accounting/reports/trial-balance",
      icon: <FileSpreadsheet className="text-indigo-500" size={24} />,
      bg: "bg-indigo-50",
    },
    {
      title: "Inventory Valuation & Stock Report",
      description: "Current stock on hand, average item cost, and warehouse movement history.",
      href: "/inventory",
      icon: <Boxes className="text-amber-500" size={24} />,
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <BarChart2 size={16} />
            <span>Business Intelligence & Financial Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Financial Statements</h1>
          <p className="text-sm text-slate-400 mt-1">
            Consolidated executive statements, tax summaries, and general ledger reports.
          </p>
        </div>
        <button
          onClick={loadKpis}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh Live KPIs</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-xs font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Revenue (MTD / Today: LKR {kpis.todayRevenue})</div>
          <div className="text-2xl font-bold text-slate-800">LKR {kpis.totalRevenueMtd}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Dispatched customer sales</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Net Profit MTD</div>
          <div className="text-2xl font-bold text-slate-800">LKR {kpis.netProfitMtd}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Expenses + COGS: LKR {kpis.totalExpensesMtd}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Inventory Valuation (WAC)</div>
          <div className="text-2xl font-bold text-slate-800">LKR {kpis.inventoryValuationTotal}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">{kpis.lowStockProductsCount} items below reorder point</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-purple-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Accounts Receivable / Payable</div>
          <div className="text-2xl font-bold text-slate-800">LKR {kpis.accountsReceivableOpen}</div>
          <div className="text-xs text-purple-600 font-medium mt-1">Open AP: LKR {kpis.accountsPayableOpen}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Statutory & Operating Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {statementReports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group flex items-start space-x-4"
            >
              <div className={`w-12 h-12 rounded-xl ${report.bg} flex items-center justify-center shrink-0`}>
                {report.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </h3>
                  <ArrowUpRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{report.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
