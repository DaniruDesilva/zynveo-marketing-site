import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Boxes,
  ShoppingCart, 
  ShoppingBag, 
  Factory,
  Calculator, 
  UserCheck,
  BarChart2, 
  Users, 
  Briefcase, 
  GitMerge, 
  FileText, 
  Settings, 
  ShieldCheck,
  Diamond,
  Bell
} from "lucide-react";
import { PowerSyncProvider } from "../components/PowerSyncProvider";
import { SidebarNavItem } from "../components/SidebarNavItem";
import { SidebarQuickCreate } from "../components/SidebarQuickCreate";

export const metadata: Metadata = {
  title: "Zynveo ERP",
  description: "Modern ERP Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f0f4f8] text-slate-900">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 relative shadow-sm">
            {/* Brand Logo Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-800">
                  Zynveo<span className="text-blue-600 text-sm align-top ml-0.5 font-bold">ERP</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                  OS
                </span>
              </Link>
            </div>
            
            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-hide">
              {/* Quick Transaction Dropdown */}
              <SidebarQuickCreate />

              {/* Section 1: Overview */}
              <div>
                <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Overview
                </div>
                <SidebarNavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              </div>

              {/* Section 2: Operations & Logistics */}
              <div>
                <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Operations & Logistics
                </div>
                <SidebarNavItem 
                  href="/inventory" 
                  icon={<Boxes size={18} />} 
                  label="Inventory & WMS" 
                  badge="Live" 
                  badgeColor="bg-emerald-100 text-emerald-700" 
                />
                <SidebarNavItem href="/sales" icon={<ShoppingCart size={18} />} label="Sales & Invoices" />
                <SidebarNavItem href="/purchases" icon={<ShoppingBag size={18} />} label="Purchases & GRN" />
                <SidebarNavItem href="/manufacturing" icon={<Factory size={18} />} label="Manufacturing & BOM" />
              </div>

              {/* Section 3: Finance & Workforce */}
              <div>
                <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Finance & Workforce
                </div>
                <SidebarNavItem 
                  href="/accounting" 
                  icon={<Calculator size={18} />} 
                  label="Accounting & GL" 
                />
                <SidebarNavItem href="/hr" icon={<UserCheck size={18} />} label="HR & Payroll" />
                <SidebarNavItem href="/reports" icon={<BarChart2 size={18} />} label="Reports & BI" />
              </div>

              {/* Section 4: Relationships & Workflow */}
              <div>
                <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Relationships & Workflow
                </div>
                <SidebarNavItem href="/people" icon={<Users size={18} />} label="People Directory" />
                <SidebarNavItem href="/crm" icon={<Briefcase size={18} />} label="CRM & Tickets" />
                <SidebarNavItem href="/workflow" icon={<GitMerge size={18} />} label="Workflow Approvals" />
                <SidebarNavItem href="/documents" icon={<FileText size={18} />} label="Documents Archive" />
              </div>

              {/* Section 5: System */}
              <div>
                <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  System
                </div>
                <SidebarNavItem href="/settings" icon={<Settings size={18} />} label="Settings" />
              </div>
            </nav>
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Top Header */}
            <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 z-10">
              <div className="flex-1 flex justify-center">
                 <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-medium border border-emerald-100">
                   <ShieldCheck size={16} />
                   <span>app.zynveo.com</span>
                 </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <Diamond size={14} className="fill-blue-600" />
                  <span>Enterprise</span>
                </button>
                <Link 
                  href="/sales/invoices/new" 
                  className="text-xs font-medium text-white bg-blue-600 px-3.5 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
                >
                  POS / Quick Sale
                </Link>
                <button className="text-slate-400 hover:text-slate-600">
                  <Bell size={20} />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">Administrator</span>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    AD
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto relative bg-[#f0f4f8]">
              <PowerSyncProvider>
                {children}
              </PowerSyncProvider>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
