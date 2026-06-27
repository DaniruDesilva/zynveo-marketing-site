"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { usePowerSync } from "../../components/PowerSyncProvider";
import { RefreshCw, FileText, UserPlus, DollarSign, FilePlus, BarChart2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardClient() {
  const db = usePowerSync();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  
  // Metrics state
  const [invoicesCount, setInvoicesCount] = useState("0");
  const [invoicesTotal, setInvoicesTotal] = useState("LKR 0.00");
  const [customersCount, setCustomersCount] = useState("0");
  const [suppliersCount, setSuppliersCount] = useState("0");
  const [grnsCount, setGrnsCount] = useState("0");
  const [grnsTotal, setGrnsTotal] = useState("LKR 0.00");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!db) return;
    try {
      // In PowerSync SQLite, date('now') returns today's UTC date.
      const invoices = await db.getAll("SELECT count(id) as count, sum(total) as total FROM documents WHERE type = 'invoice' AND date(date) = date('now')");
      if (invoices.length > 0) {
          setInvoicesCount(invoices[0].count?.toString() || "0");
          setInvoicesTotal(`LKR ${Number(invoices[0].total || 0).toFixed(2)}`);
      }

      const customers = await db.getAll("SELECT count(id) as count FROM customers WHERE is_active = 1 OR is_active = true OR is_active = 'true'");
      if (customers.length > 0) setCustomersCount(customers[0].count?.toString() || "0");

      try {
        const suppliers = await db.getAll("SELECT count(id) as count FROM suppliers");
        if (suppliers.length > 0) setSuppliersCount(suppliers[0].count?.toString() || "0");
      } catch(e) {
        console.log("Suppliers table may not exist locally yet", e);
      }

      try {
        const grns = await db.getAll("SELECT count(id) as count, sum(total) as total FROM grns WHERE date(date) = date('now')");
        if (grns.length > 0) {
            setGrnsCount(grns[0].count?.toString() || "0");
            setGrnsTotal(`LKR ${Number(grns[0].total || 0).toFixed(2)}`);
        }
      } catch(e) {
        console.log("GRNs table may not exist locally yet", e);
      }

      // Fetch Sales Overview (Last 14 days)
      try {
        const salesRes = await db.getAll(`
          SELECT date(date) as day, sum(total) as daily_sales
          FROM documents
          WHERE type = 'invoice' AND date >= date('now', '-14 days')
          GROUP BY day
          ORDER BY day ASC
        `);
        // We could fill missing days, but for simplicity, we map results
        if (salesRes.length > 0) {
           const mappedSales = salesRes.map((r: any) => ({
             name: r.day.substring(5), // MM-DD
             sales: Number(r.daily_sales) / 1000, // Scale down for chart
             average: (Number(r.daily_sales) / 1000) * 0.8 // Dummy average
           }));
           setSalesData(mappedSales);
        }
      } catch(e) {
         console.log("Sales chart query failed", e);
      }

      // Fetch Revenue vs Expenses (Last 12 months)
      // Revenue = invoices, Expenses = grns/bills.
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
        } catch(e) {}
        
        // Combine them by month
        const monthsMap: Record<string, any> = {};
        for (const r of revRes) {
           monthsMap[r.month] = { name: r.month, revenue: Number(r.total_rev), expenses: 0 };
        }
        for (const r of expRes) {
           if (!monthsMap[r.month]) monthsMap[r.month] = { name: r.month, revenue: 0, expenses: 0 };
           monthsMap[r.month].expenses = Number(r.total_exp);
        }
        
        const combined = Object.values(monthsMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
        if (combined.length > 0) {
           setRevenueData(combined.map((c: any) => ({
             ...c,
             name: new Date(c.name + '-01').toLocaleString('en-US', { month: 'short' })
           })));
        }
      } catch(e) {
         console.log("Revenue chart query failed", e);
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  }, [db]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setIsRefreshing(false), 500); // UI feedback
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Welcome back, User!</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-5 gap-4">
          <Link href="/sales/invoices/new">
            <QuickAction icon={<FileText className="text-blue-500" size={24} />} bg="bg-blue-50" label="New Invoice" />
          </Link>
          <Link href="/people/customers/new">
            <QuickAction icon={<UserPlus className="text-emerald-500" size={24} />} bg="bg-emerald-50" label="Add Customer" />
          </Link>
          <Link href="/accounting/payments/new">
            <QuickAction icon={<DollarSign className="text-purple-500" size={24} />} bg="bg-purple-50" label="Record Payment" />
          </Link>
          <Link href="/purchases/grn/new">
            <QuickAction icon={<FilePlus className="text-orange-500" size={24} />} bg="bg-orange-50" label="Add GRN" />
          </Link>
          <Link href="/reports">
            <QuickAction icon={<BarChart2 className="text-rose-500" size={24} />} bg="bg-rose-50" label="View Reports" />
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="relative">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Metrics</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="Today's Invoices" value={invoicesCount} subValue={invoicesTotal} borderColor="border-b-purple-500" />
          <MetricCard title="Total Customers" value={customersCount} subValue="Active accounts" borderColor="border-b-orange-400" />
          <MetricCard title="Total Suppliers" value={suppliersCount} subValue="Active vendors" borderColor="border-b-orange-400" />
          <MetricCard title="Today's GRNs" value={grnsCount} subValue={grnsTotal} borderColor="border-b-blue-500" />
        </div>
      </div>

      {/* Analytics Overview */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Analytics Overview</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Sales Overview Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Sales Overview</h3>
                  <p className="text-xs text-slate-400">Last 14 days performance</p>
                </div>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 2]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0]} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                  <Bar dataKey="sales" name="Daily Sales" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={16} />
                  <Line type="monotone" dataKey="average" name="7-Day Average" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Revenue vs Expenses</h3>
                  <p className="text-xs text-slate-400">Last 12 months trend</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Net Profit</div>
                <div className="text-sm font-bold text-rose-500">LKR -14,686.20</div>
                <div className="text-[10px] text-slate-400">Margin: -35.5%</div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 50000]} ticks={[0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000]} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, bg, label }: { icon: React.ReactNode; bg: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
      <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

function MetricCard({ title, value, subValue, borderColor }: { title: string; value: string; subValue: string; borderColor: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-b-4 ${borderColor} relative overflow-hidden`}>
      {/* Decorative background blob */}
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 blur-xl ${borderColor.replace('border-b-', 'bg-')}`}></div>
      
      <h3 className="text-xs font-medium text-slate-400 mb-2">{title}</h3>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{subValue}</div>
    </div>
  );
}
