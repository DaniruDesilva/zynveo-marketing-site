import React from "react";
import Link from "next/link";
import { FileText, Calculator, Landmark } from "lucide-react";

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-semibold text-slate-800">Financial Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Generate key financial statements</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <ReportCard 
          href="/accounting/reports/trial-balance"
          title="Trial Balance"
          description="A summary of all your ledger accounts and their balances to ensure debits equal credits."
          icon={<Calculator size={24} className="text-blue-500" />}
          bg="bg-blue-50"
        />
        <ReportCard 
          href="/accounting/reports/profit-loss"
          title="Profit and Loss"
          description="Your income statement showing revenues, expenses, and net profit over a period of time."
          icon={<FileText size={24} className="text-emerald-500" />}
          bg="bg-emerald-50"
        />
        <ReportCard 
          href="/accounting/reports/balance-sheet"
          title="Balance Sheet"
          description="A snapshot of your financial position detailing assets, liabilities, and equity."
          icon={<Landmark size={24} className="text-purple-500" />}
          bg="bg-purple-50"
        />
      </div>
    </div>
  );
}

function ReportCard({ href, title, description, icon, bg }: { href: string; title: string; description: string; icon: React.ReactNode; bg: string }) {
  return (
    <Link href={href} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 flex-grow">{description}</p>
    </Link>
  );
}
