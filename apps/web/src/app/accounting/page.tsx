"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { usePowerSync } from "../../components/PowerSyncProvider";
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, PlusCircle, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AccountingDashboard() {
  const db = usePowerSync();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [metrics, setMetrics] = useState({
    assets: 0,
    liabilities: 0,
    netIncome: 0,
    expenses: 0
  });

  const [cashFlowData, setCashFlowData] = useState<any[]>([]);

  const fetchMetrics = useCallback(async () => {
    if (!db) return;
    try {
      // Calculate balances based on normal balance rules
      // Assets: Debit - Credit
      // Liabilities & Equity: Credit - Debit
      // Revenue: Credit - Debit
      // Expenses: Debit - Credit
      
      const balancesQuery = await db.getAll(`
        SELECT 
          a.type,
          a.normal_balance,
          SUM(jl.debit) as total_debits,
          SUM(jl.credit) as total_credits
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id
        GROUP BY a.type, a.normal_balance
      `);

      let assets = 0;
      let liabilities = 0;
      let revenue = 0;
      let expenses = 0;

      balancesQuery.forEach((row: any) => {
        const debit = Number(row.total_debits || 0);
        const credit = Number(row.total_credits || 0);
        const balance = row.normal_balance === 'debit' ? (debit - credit) : (credit - debit);
        
        switch (row.type) {
          case 'asset': assets += balance; break;
          case 'liability': liabilities += balance; break;
          case 'revenue': revenue += balance; break;
          case 'expense': expenses += balance; break;
        }
      });

      setMetrics({
        assets,
        liabilities,
        netIncome: revenue - expenses,
        expenses
      });

      // Dummy cash flow data for now
      setCashFlowData([
        { month: 'Aug', in: 4000, out: 2400 },
        { month: 'Sep', in: 3000, out: 1398 },
        { month: 'Oct', in: 2000, out: 9800 },
        { month: 'Nov', in: 2780, out: 3908 },
        { month: 'Dec', in: 1890, out: 4800 },
        { month: 'Jan', in: 2390, out: 3800 },
      ]);

    } catch (e) {
      console.error("Failed to fetch accounting metrics:", e);
    }
  }, [db]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Financial Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time accounting snapshot</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/accounting/journals/new" className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <PlusCircle size={16} />
            <span>New Journal</span>
          </Link>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard 
          title="Total Assets" 
          value={`LKR ${metrics.assets.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<BookOpen size={20} className="text-blue-500" />}
          borderColor="border-b-blue-500" 
        />
        <MetricCard 
          title="Total Liabilities" 
          value={`LKR ${metrics.liabilities.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<TrendingDown size={20} className="text-rose-500" />}
          borderColor="border-b-rose-500" 
        />
        <MetricCard 
          title="Net Income" 
          value={`LKR ${metrics.netIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          borderColor="border-b-emerald-500" 
        />
        <MetricCard 
          title="Total Expenses" 
          value={`LKR ${metrics.expenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<DollarSign size={20} className="text-orange-500" />}
          borderColor="border-b-orange-400" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cash Flow */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-6">Cash Flow (6 Months)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                <Bar dataKey="in" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Cash Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* We can add another chart here later, e.g. Expenses Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center">
           <div className="text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
               <BarChart2 size={24} className="text-slate-300" />
             </div>
             <h3 className="text-sm font-semibold text-slate-800">Expenses Breakdown</h3>
             <p className="text-xs text-slate-400 mt-1">More data needed to generate chart.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, borderColor }: { title: string; value: string; icon: React.ReactNode; borderColor: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-b-4 ${borderColor} relative overflow-hidden`}>
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 blur-xl ${borderColor.replace('border-b-', 'bg-')}`}></div>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-medium text-slate-400">{title}</h3>
        <div className="p-1.5 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
// Add import that was missing
import { BarChart2 } from "lucide-react";
