"use client";

import React, { useState, useEffect, useCallback } from "react";
import Decimal from "decimal.js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { erpApi } from "../../lib/api";
import { useAuth } from "../../components/AuthProvider";
import {
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Activity,
  Plus,
  RotateCw,
  Building,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

type PeriodType = "MTD" | "QTD" | "YTD";

function formatMoney(val: string | Decimal): string {
  const num = new Decimal(val || "0").toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
  const [intPart, decPart] = num.split(".");
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decPart}`;
}

function getPeriodRange(period: PeriodType): { start: Date; end: Date; label: string } {
  const end = new Date();
  const y = end.getFullYear();
  const m = end.getMonth();
  if (period === "MTD") {
    return {
      start: new Date(y, m, 1),
      end,
      label: `Month-to-Date (${end.toLocaleString("en-US", { month: "long", year: "numeric" })})`,
    };
  }
  if (period === "QTD") {
    const qStartMonth = Math.floor(m / 3) * 3;
    return {
      start: new Date(y, qStartMonth, 1),
      end,
      label: `Q${Math.floor(m / 3) + 1} ${y} Quarter-to-Date`,
    };
  }
  return {
    start: new Date(y, 0, 1),
    end,
    label: `FY ${y} Year-to-Date`,
  };
}

export default function DashboardClient() {
  const { user, activeBranchName } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MTD");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    revenue: "0.00",
    expenses: "0.00",
    netProfit: "0.00",
    grossMargin: "0.0%",
    netMargin: "0.0%",
    cashBank: "0.00",
    arOpen: "0.00",
    apOpen: "0.00",
    inventoryValue: "0.00",
    inventoryUnits: "0",
    lowStockCount: 0,
    todayInvoicesCount: 0,
    customersCount: 0,
    suppliersCount: 0,
  });

  const [chartData, setChartData] = useState<
    Array<{ name: string; revenue: number; expenses: number }>
  >([]);
  const [pendingTasks, setPendingTasks] = useState<
    Array<{ id: string; title: string; subtitle: string; href: string; actionLabel: string; tone: string }>
  >([]);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ id: string; ref: string; module: string; detail: string; amount: string; status: string }>
  >([]);

  const fetchLiveDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    const { start, end } = getPeriodRange(selectedPeriod);

    try {
      const [execKpis, pnl, invoices, pos, products, customers, suppliers, accounts, journals] =
        await Promise.all([
          erpApi.bi.getExecutiveKpis(),
          erpApi.bi.getProfitAndLoss(start.toISOString(), end.toISOString()).catch(() => null),
          erpApi.sales.listInvoices().catch(() => []),
          erpApi.procurement.listPurchaseOrders().catch(() => []),
          erpApi.inventory.listProducts().catch(() => []),
          erpApi.sales.listCustomers().catch(() => []),
          erpApi.procurement.listSuppliers().catch(() => []),
          erpApi.finance.listAccounts().catch(() => []),
          erpApi.finance.listJournals().catch(() => []),
        ]);

      const rev = new Decimal(pnl?.totalRevenue || execKpis.todayRevenue || "0");
      const cogs = new Decimal(pnl?.totalCogs || "0");
      const opex = new Decimal(pnl?.totalOperatingExpenses || "0");
      const totalExp = cogs.plus(opex);
      const net = new Decimal(pnl?.netProfit || rev.minus(totalExp));
      const grossProfit = rev.minus(cogs);

      const grossMarginPct = rev.gt(0) ? `${grossProfit.div(rev).mul(100).toFixed(1)}%` : "0.0%";
      const netMarginPct = rev.gt(0) ? `${net.div(rev).mul(100).toFixed(1)}%` : "0.0%";

      const cashAcc = (accounts || []).find((a: any) => a.code === "1000");
      const cashBalance = cashAcc
        ? new Decimal(cashAcc.totalDebits || "0").minus(new Decimal(cashAcc.totalCredits || "0"))
        : new Decimal("0");

      let totalUnits = new Decimal(0);
      for (const p of products || []) {
        totalUnits = totalUnits.plus(new Decimal(p.stock || "0"));
      }

      setMetrics({
        revenue: formatMoney(rev),
        expenses: formatMoney(totalExp),
        netProfit: formatMoney(net),
        grossMargin: grossMarginPct,
        netMargin: netMarginPct,
        cashBank: formatMoney(cashBalance),
        arOpen: formatMoney(execKpis.totalAccountsReceivable || "0"),
        apOpen: formatMoney(execKpis.totalAccountsPayable || "0"),
        inventoryValue: formatMoney(execKpis.totalInventoryValuationWac || "0"),
        inventoryUnits: totalUnits.toDecimalPlaces(0).toString(),
        lowStockCount: execKpis.lowStockProductsCount || 0,
        todayInvoicesCount: execKpis.todayInvoicesCount || 0,
        customersCount: (customers || []).length,
        suppliersCount: (suppliers || []).length,
      });

      // Build chart series from real posted invoices grouped by day
      const dailyMap = new Map<string, { revenue: Decimal; expenses: Decimal }>();
      for (const inv of invoices || []) {
        const day = String(inv.invoiceDate || "").slice(0, 10) || "Current";
        const cur = dailyMap.get(day) || { revenue: new Decimal(0), expenses: new Decimal(0) };
        cur.revenue = cur.revenue.plus(new Decimal(inv.totalAmount || "0"));
        cur.expenses = cur.expenses.plus(new Decimal(inv.totalCogsAmount || "0"));
        dailyMap.set(day, cur);
      }
      const series = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([day, vals]) => ({
          name: day,
          revenue: Number(vals.revenue.toFixed(2)),
          expenses: Number(vals.expenses.toFixed(2)),
        }));
      setChartData(
        series.length > 0
          ? series
          : [{ name: selectedPeriod, revenue: Number(rev.toFixed(2)), expenses: Number(totalExp.toFixed(2)) }]
      );

      // Build pending action workqueue from live DRAFT invoices, ISSUED POs, and low stock items
      const tasks: typeof pendingTasks = [];
      for (const inv of (invoices || []).filter((i: any) => i.status === "DRAFT").slice(0, 2)) {
        tasks.push({
          id: `inv-${inv.id}`,
          title: `Draft Invoice ${inv.invoiceNumber} • ${inv.customerName || "Customer"}`,
          subtitle: `Amount: LKR ${formatMoney(inv.totalAmount || "0")} • Ready to finalize`,
          href: "/sales",
          actionLabel: "Finalize",
          tone: "text-blue-700 bg-blue-50 hover:bg-blue-100",
        });
      }
      for (const po of (pos || []).filter((p: any) => p.status === "ISSUED" || p.status === "PARTIALLY_RECEIVED").slice(0, 2)) {
        tasks.push({
          id: `po-${po.id}`,
          title: `Purchase Order ${po.poNumber} • ${po.supplierName || "Supplier"}`,
          subtitle: `Total: LKR ${formatMoney(po.totalAmount || "0")} • Pending GRN receipt`,
          href: "/purchases/grn/new",
          actionLabel: "Receive",
          tone: "text-orange-700 bg-orange-50 hover:bg-orange-100",
        });
      }
      if ((execKpis.lowStockProductsCount || 0) > 0) {
        tasks.push({
          id: "low-stock",
          title: `Low Stock Alert • ${execKpis.lowStockProductsCount} SKUs`,
          subtitle: "Items at or below reorder threshold",
          href: "/inventory",
          actionLabel: "Restock",
          tone: "text-rose-700 bg-rose-50 hover:bg-rose-100",
        });
      }
      setPendingTasks(tasks);

      // Build recent activity feed from journals / invoices
      const feed: typeof recentActivity = [];
      for (const je of (journals || []).slice(0, 4)) {
        feed.push({
          id: je.id,
          ref: je.entryNumber,
          module: je.sourceModule || "GENERAL_LEDGER",
          detail: je.description || "Posted Journal Entry",
          amount: `LKR ${formatMoney(je.totalAmount || "0")}`,
          status: je.status || "POSTED",
        });
      }
      if (feed.length === 0) {
        for (const inv of (invoices || []).slice(0, 4)) {
          feed.push({
            id: inv.id,
            ref: inv.invoiceNumber,
            module: "SALES",
            detail: inv.customerName || "Customer Invoice",
            amount: `LKR ${formatMoney(inv.totalAmount || "0")}`,
            status: inv.status || "DRAFT",
          });
        }
      }
      setRecentActivity(feed);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unable to reach API Gateway for live KPIs.");
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchLiveDashboardData();
  }, [fetchLiveDashboardData]);

  const handleRefresh = async () => {
    await fetchLiveDashboardData();
    setSyncToast("Live ERP metrics refreshed from API Gateway.");
    setTimeout(() => setSyncToast(null), 4000);
  };

  const periodInfo = getPeriodRange(selectedPeriod);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-full">
                <Building size={12} />
                <span>{user?.tenantName || "Zynveo Enterprise"} • {activeBranchName || "HQ"}</span>
              </span>
              <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                <span>Live Gateway Feed</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Executive Business Overview
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>
                Reporting Period: <strong>{periodInfo.label}</strong>
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200">
              {(["MTD", "QTD", "YTD"] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedPeriod === p
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Link
              href="/sales/invoices/new"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>New Invoice</span>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <RotateCw size={13} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {syncToast && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{syncToast}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 4 KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/sales" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Recognized Revenue ({selectedPeriod})</span>
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">LKR {metrics.revenue}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>{metrics.todayInvoicesCount} invoices today</span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600" />
          </div>
        </Link>

        <Link href="/accounting" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>COGS & Operating Expenses</span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              GM: {metrics.grossMargin}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">LKR {metrics.expenses}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Audited General Ledger</span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-orange-600" />
          </div>
        </Link>

        <Link href="/accounting/reports/profit-loss" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Net Operating Profit ({selectedPeriod})</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {metrics.netMargin}
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">LKR {metrics.netProfit}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>Revenue minus COGS & OpEx</span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-600" />
          </div>
        </Link>

        <Link href="/accounting/reports/balance-sheet" className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Cash & Bank (GL 1000)</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">LKR {metrics.cashBank}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
            <span>AR: {metrics.arOpen} • AP: {metrics.apOpen}</span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
        </Link>
      </div>

      {/* Chart + Working Capital */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue vs COGS Velocity ({selectedPeriod})</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live invoiced revenue and cost series from PostgreSQL</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="COGS / Outflow" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-800">Working Capital Health</h2>
              <Link href="/accounting/reports/balance-sheet" className="text-xs font-semibold text-blue-600">
                Statement &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-400">Live sub-ledger balances across tenant schemas</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Accounts Receivable (AR)</span>
                <span className="font-mono font-bold text-slate-900">LKR {metrics.arOpen}</span>
              </div>
              <div className="text-[11px] text-slate-400">{metrics.customersCount} registered customers</div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Accounts Payable (AP)</span>
                <span className="font-mono font-bold text-slate-900">LKR {metrics.apOpen}</span>
              </div>
              <div className="text-[11px] text-slate-400">{metrics.suppliersCount} approved suppliers</div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Inventory Valuation (WAC)</span>
                <span className="font-mono font-bold text-slate-900">LKR {metrics.inventoryValue}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {metrics.inventoryUnits} units on hand • {metrics.lowStockCount} low stock
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700">General Ledger Sync Active</span>
            <Link href="/accounting/reports/trial-balance" className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg">
              Trial Balance &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Workqueue & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Pending Actions & Approvals</h2>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {pendingTasks.length} Open
            </span>
          </div>

          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No pending draft invoices, open POs, or low-stock alerts.</p>
            ) : (
              pendingTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{t.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.subtitle}</div>
                  </div>
                  <Link href={t.href} className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg ${t.tone}`}>
                    {t.actionLabel} &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Activity size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800">Recent Ledger Activity</h2>
            </div>
            <Link href="/accounting/journals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No transactions recorded yet for this tenant.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{item.ref}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.detail} • {item.module}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800">{item.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
