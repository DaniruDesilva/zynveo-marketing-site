import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import Link from "next/link";
import { 
  Plus, 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  ShoppingBag, 
  BarChart2, 
  Calculator, 
  MessageSquare, 
  GitMerge, 
  Briefcase, 
  Settings, 
  HelpCircle, 
  MessageCircle, 
  Building, 
  FileText, 
  Calendar,
  ShieldCheck,
  Diamond,
  Bell
} from "lucide-react";
import { PowerSyncProvider } from "../components/PowerSyncProvider";
import { SidebarNavItem } from "../components/SidebarNavItem";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f0f4f8] text-slate-900">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 relative shadow-sm">
            <div className="h-16 flex items-center px-6">
              <span className="font-bold text-xl tracking-tight text-slate-800">
                Zynveo<span className="text-blue-600 text-sm align-top">ERP</span>
              </span>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide">
              <div className="px-4 pb-2">
                <button className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors">
                  <Plus size={16} />
                  <span>New</span>
                </button>
              </div>
              <SidebarNavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              <SidebarNavItem href="/people" icon={<Users size={18} />} label="People" />
              <SidebarNavItem href="/sales" icon={<ShoppingCart size={18} />} label="Sales" />
              <SidebarNavItem href="/purchases" icon={<ShoppingBag size={18} />} label="Purchases" />
              <SidebarNavItem href="/reports" icon={<BarChart2 size={18} />} label="Reports" />
              <SidebarNavItem href="/accounting" icon={<Calculator size={18} />} label="Accounting" />
              <SidebarNavItem href="/chat" icon={<MessageSquare size={18} />} label="Chat" />
              <SidebarNavItem href="/workflow" icon={<GitMerge size={18} />} label="Workflow Management" />
              <SidebarNavItem href="/crm" icon={<Briefcase size={18} />} label="CRM" />
              <SidebarNavItem href="/settings" icon={<Settings size={18} />} label="Settings" />
              <SidebarNavItem href="/support" icon={<HelpCircle size={18} />} label="Support Center" />
              <SidebarNavItem href="/sms" icon={<MessageCircle size={18} />} label="SMS" />
              <SidebarNavItem href="/departments" icon={<Building size={18} />} label="Account Department" />
              <SidebarNavItem href="/documents" icon={<FileText size={18} />} label="Documents" />
              <SidebarNavItem href="/appointments" icon={<Calendar size={18} />} label="Appointment" />
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
                  <span>Upgrade</span>
                </button>
                <button className="text-xs font-medium text-white bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700">
                  POS
                </button>
                <button className="text-slate-400 hover:text-slate-600">
                  <Bell size={20} />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">User</span>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    <Users size={16} />
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
