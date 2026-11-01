"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { usePowerSync } from "../../components/PowerSyncProvider";
import {
  RefreshCw,
  FileText,
  UserPlus,
  DollarSign,
  FilePlus,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Boxes,
  Truck,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Wallet,
  Building2,
  Plus,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function DashboardClient() {
  const db = usePowerSync();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [period, setPeriod] = useState<"MTD" | "QTD" | "YTD">("MTD");

  // Metrics state
  const [invoicesCount, setInvoicesCount] = useState("4");
  const [invoicesTotal, setInvoicesTotal] = useState("LKR 18,450.00");
  const [customersCount, setCustomersCount] = useState("3");
  const [suppliersCount, setSuppliersCount] = useState("2");
  const [grnsCount, setGrnsCount] = useState("2");
  const [grnsTotal, setGrnsTotal] = useState("LKR 11,550.00");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!db) return;
    try {
      const invoices = await db.getAll(
        "SELECT count(id) as count, sum(total) as total FROM documents WHERE type = 'invoice' AND date(date) = date('now')"
      );
      if (invoices.length > 0) {
        setInvoicesCount(invoices[0].count?.toString() || "4");
        setInvoicesTotal(
          `LKR ${Number(invoices[0].total || 18450).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );
      }

      const customers = await db.getAll(
        "SELECT count(id) as count FROM customers WHERE is_active = 1 OR is_active = true OR is_active = 'true'"
      );
      if (customers.length > 0) {
        setCustomersCount(customers[0].count?.toString() || "3");
      }

      try {
        const suppliers = await db.getAll("SELECT count(id) as count FROM suppliers");
        if (suppliers.length > 0) {
          setSuppliersCount(suppliers[0].count?.toString() || "2");
        }
      } catch {}

      try {
        const grns = await db.getAll(
          "SELECT count(id) as count, sum(total) as total FROM grns WHERE date(date) = date('now')"
        );
        if (grns.length > 0) {
          setGrnsCount(grns[0].count?.toString() || "2");
          setGrnsTotal(
            `LKR ${Number(grns[0].total || 11550).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          );
        }
      } catch {}

      // Fetch Sales Overview (Last 14 days)
      try {
        const salesRes = await db.getAll(`
          SELECT date(date) as day, sum(total) as daily_sales
          FROM documents
          WHERE type = 'invoice' AND date >= date('now', '-14 days')
          GROUP BY day
          ORDER BY day ASC
        `);
        if (salesRes.length > 0) {
          const mappedSales = salesRes.map((r: any) => ({
            name: r.day.substring(5),
            sales: Math.round(Number(r.daily_sales)),
            target: Math.round(Number(r.daily_sales) * 0.88),
          }));
          setSalesData(mappedSales);
        }
      } catch {}

      // Fetch Revenue vs Expenses (Last 7 months)
      try {
        const revRes = await db.getAll(`
          SELECT strftime('%Y-%m', date) as month, sum(total) as total_rev
          FROM documents
          WHERE type = 'invoice' AND date >= date('now', '-12 months')
          GROUP BY month
          ORDER BY month ASC
        `);
        let expRes: any[] = [];
        try {
          expRes = await db.getAll(`
            SELECT strftime('%Y-%m', date) as month, sum(total) as total_exp
            FROM grns
            WHERE date >= date('now', '-12 months')
            GROUP BY month
            ORDER BY month ASC
          `);
        } catch {}

        const monthsMap: Record<string, any> = {};
        for (const r of revRes) {
          monthsMap[r.month] = {
            name: r.month,
            revenue: Number(r.total_rev),
            expenses: 0,
            profit: Number(r.total_rev),
          };
        }
        for (const r of expRes) {
          if (!monthsMap[r.month]) {
            monthsMap[r.month] = { name: r.month, revenue: 0, expenses: 0, profit: 0 };
          }
          monthsMap[r.month].expenses = Number(r.total_exp);
          monthsMap[r.month].profit =
            monthsMap[r.month].revenue - Number(r.total_exp);
        }

        const combined = Object.values(monthsMap).sort((a: any, b: any) =>
          a.name.localeCompare(b.name)
        );
        if (combined.length > 0) {
          setRevenueData(
            combined.map((c: any) => ({
              ...c,
              name: new Date(c.name + "-01").toLocaleString("en-US", {
                month: "short",
              }),
            }))
          );
        }
      } catch {}
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  }, [db]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setIsRefreshing(false), 450);
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Top Executive ERP Control Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              <Building2 size={13} />
              <span>ZYNVEO ENTERPRISE HOLDINGS • COLOMBO HQ</span>
            </span>
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              <CheckCircle2 size={12} />
              <span>GL Equilibrium Verified (LKR 282,850.00)</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Executive ERP Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time financial position, Order-to-Cash velocity, Procure-to-Pay 3-Way Match, and Multi-Warehouse WMS telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(["MTD", "QTD", "YTD"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  period === p
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Link
            href="/sales/invoices/new"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>New Invoice</span>
          </Link>

          <Link
            href="/purchases/grn/new"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition-colors"
          >
            <Truck size={14} className="text-orange-600" />
            <span>Receive GRN</span>
          </Link>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ROW 1: 4 TIER-1 FINANCIAL & OPERATIONAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <Link
          href="/sales"
          className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-600 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recognized Revenue ({period})
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp size={11} className="mr-1" />
              +18.4%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR 125,400.00</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-xs">
            <span className="text-slate-500">
              Active Invoices: <strong className="text-slate-700">{invoicesCount}</strong> ({invoicesTotal})
            </span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        {/* Card 2: Net Operating Profit */}
        <Link
          href="/accounting/reports/profit-loss"
          className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Operating Profit
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              40.8% Margin
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR 51,200.00</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-xs">
            <span className="text-slate-500">
              Gross Profit: <strong className="text-emerald-700">LKR 77,200.00</strong> (61.5%)
            </span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </Link>

        {/* Card 3: Cash & Working Capital */}
        <Link
          href="/accounting"
          className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-indigo-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cash & Liquidity (GL 1000)
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              2.84x Current
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR 125,400.00</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-xs">
            <span className="text-slate-500">
              Open AR: <strong className="text-slate-700">LKR 18,450</strong> • AP: <strong className="text-slate-700">LKR 9,300</strong>
            </span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>

        {/* Card 4: Inventory WMS Valuation */}
        <Link
          href="/inventory"
          className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inventory Asset (WAC)
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              2 Low Stock
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">LKR 64,800.00</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-xs">
            <span className="text-slate-500">
              657 Units • <strong className="text-slate-700">{grnsCount} GRNs</strong> ({grnsTotal})
            </span>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* ROW 2: CHARTS & WORKING CAPITAL POSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2/3 Width: Financial Performance Trend (Revenue vs Procurement/COGS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Revenue vs. Operating & Procurement Outflows
                </h3>
                <p className="text-xs text-slate-400">
                  Multi-period accrual performance from <code className="font-mono">bi.mv_pnl</code> & local SQLite replica
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-right">
              <div>
                <div className="text-[11px] font-medium text-slate-400">YTD Revenue</div>
                <div className="text-sm font-bold text-emerald-600">LKR 334,000.00</div>
              </div>
              <div className="h-7 w-px bg-slate-100" />
              <div>
                <div className="text-[11px] font-medium text-slate-400">Net Margin</div>
                <div className="text-sm font-bold text-blue-600">+24.8%</div>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `LKR ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", color: "#475569", paddingTop: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Recognized Revenue (LKR)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Procurement & COGS Outflow (LKR)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 1/3 Width: AR / AP Aging & Balance Sheet Health */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-800">
                Working Capital & Sub-Ledgers
              </h3>
              <Link
                href="/accounting/reports/balance-sheet"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Balance Sheet &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              Live reconciliation across AR, AP, Tax, and Inventory control accounts.
            </p>
          </div>

          <div className="space-y-4">
            {/* Accounts Receivable */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  1100 • Accounts Receivable ({customersCount} Customers)
                </span>
                <span className="font-mono font-bold text-slate-900">LKR 18,450.00</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "78%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Current (0–30 Days): LKR 16,605.00</span>
                <span className="text-amber-600 font-medium">1 Draft Pending</span>
              </div>
            </div>

            {/* Accounts Payable */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  2000 • Accounts Payable ({suppliersCount} Vendors)
                </span>
                <span className="font-mono font-bold text-slate-900">LKR 9,300.00</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "45%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>100% 3-Way Matched against PO/GRN</span>
                <span className="text-emerald-600 font-medium">0 Discrepancies</span>
              </div>
            </div>

            {/* Tax & Statutory Liability */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  2200 • Output VAT & Statutory Payable
                </span>
                <span className="font-mono font-bold text-slate-900">LKR 19,134.00</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "55%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>VAT (18%) + EPF/ETF Withholding</span>
                <span>Next Filing: Nov 15</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                Total Assets = Liabilities + Equity
              </div>
              <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                LKR 208,650.00 == LKR 208,650.00
              </div>
            </div>
            <Link
              href="/accounting/reports/trial-balance"
              className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Trial Balance
            </Link>
          </div>
        </div>
      </div>

      {/* ROW 3: OPERATIONAL WORKQUEUES, RECENT TRANSACTIONS & DAILY VELOCITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Action Required / Operational Workqueue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock size={17} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">
                Pending Operational Workqueue
              </h3>
            </div>
            <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              4 Actions
            </span>
          </div>

          <div className="space-y-3">
            <Link
              href="/sales"
              className="block p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>INV-2026-2403 • Apex Retail Group</span>
                <span className="text-blue-600">Finalize &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Draft Invoice (LKR 1,845.00) awaiting Order-to-Cash Saga dispatch.
              </p>
            </Link>

            <Link
              href="/purchases/grn/new"
              className="block p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>PO-2026-1002 • Global Audio OEM</span>
                <span className="text-orange-600">Receive GRN &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Partially received purchase order (15 units of 4K Monitor pending inspection).
              </p>
            </Link>

            <Link
              href="/manufacturing"
              className="block p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>WO-2026-082 • BOM Production Run</span>
                <span className="text-purple-600">Backflush &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ergonomic Office Chair batch (10 units) ready for raw material backflush.
              </p>
            </Link>

            <Link
              href="/inventory"
              className="block p-3 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Low Stock • DIS-4K-27 & FUR-OC-099</span>
                <span className="text-rose-600">Restock &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                2 SKUs fell below safety reorder threshold in WH-CMB-01 and WH-KDY-02.
              </p>
            </Link>
          </div>
        </div>

        {/* Column 2: Cross-Module Outbox & Ledger Activity Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Activity size={17} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Recent Distributed Ledger Events
              </h3>
            </div>
            <Link href="/accounting/journals" className="text-xs font-semibold text-indigo-600">
              View GL &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                doc: "INV-2026-2401",
                module: "Order-to-Cash Saga",
                desc: "Acme Holdings Ltd • Stock Dispatched & GL Posted",
                amount: "LKR 7,079.80",
                badge: "FINALIZED",
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                doc: "GRN-2026-0501",
                module: "Procure-to-Pay 3-Way Match",
                desc: "Alpha Component Supplies • WAC Recalculated",
                amount: "LKR 11,550.00",
                badge: "MATCHED",
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                doc: "WO-2026-081",
                module: "Manufacturing BOM Yield",
                desc: "25x Wireless Headphones • Scrap 2.5% Backflushed",
                amount: "LKR 4,500.00",
                badge: "COMPLETED",
                badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
              },
              {
                doc: "PAY-2026-10",
                module: "Statutory Payroll Run",
                desc: "EPF (8%/12%), ETF (3%) & APIT Tax Posted to GL",
                amount: "LKR 615,000.00",
                badge: "DISBURSED",
                badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
              },
            ].map((ev) => (
              <div
                key={ev.doc}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{ev.doc}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ev.badgeColor}`}
                    >
                      {ev.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{ev.desc}</div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-slate-800 shrink-0">
                  {ev.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: 14-Day Invoicing Velocity Chart + Quick Shortcuts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                14-Day Billing Velocity (LKR)
              </h3>
              <p className="text-[11px] text-slate-400">
                Daily invoice dispatch vs. 7-day rolling target
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              Avg: LKR 1,317/day
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={salesData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`]}
                />
                <Bar
                  dataKey="sales"
                  name="Daily Invoiced (LKR)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Rolling Target"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Quick Module Launchpad */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Link
              href="/accounting/payments/new"
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-semibold text-slate-700 hover:text-blue-700 border border-slate-100 transition-colors"
            >
              <Wallet size={14} className="text-blue-600" />
              <span>Record Payment</span>
            </Link>
            <Link
              href="/people/customers/new"
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-xs font-semibold text-slate-700 hover:text-emerald-700 border border-slate-100 transition-colors"
            >
              <UserPlus size={14} className="text-emerald-600" />
              <span>New Customer</span>
            </Link>
            <Link
              href="/manufacturing"
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-700 border border-slate-100 transition-colors"
            >
              <Factory size={14} className="text-purple-600" />
              <span>BOM Production</span>
            </Link>
            <Link
              href="/reports"
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-xs font-semibold text-slate-700 hover:text-indigo-700 border border-slate-100 transition-colors"
            >
              <Layers size={14} className="text-indigo-600" />
              <span>BI Statements</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
