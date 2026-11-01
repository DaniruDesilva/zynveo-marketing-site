"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Bell,
  ChevronDown,
  LogOut,
  Building2,
  Sparkles,
  Check,
  UserCheck2,
} from "lucide-react";
import { PowerSyncProvider } from "./PowerSyncProvider";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarQuickCreate } from "./SidebarQuickCreate";
import { useAuth } from "./AuthProvider";
import { DEMO_PERSONAS, DEMO_TENANT } from "../lib/authTypes";
import { UserRole } from "@zynveo/contracts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    user,
    role,
    permissions,
    can,
    activeBranchId,
    activeBranchName,
    signOut,
    signInWithDemo,
    switchBranch,
    isLoading,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setBranchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // For /login route, render full-bleed without ERP shell
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return <>{children}</>;
  }

  const currentPersona = (role && DEMO_PERSONAS[role]) || DEMO_PERSONAS.OWNER;
  const initials = (user?.fullName || currentPersona.fullName)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // Permission-aware navigation logic
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const showInventory = isOwnerOrAdmin || can("inventory.stock.view") || role === "WAREHOUSE_MANAGER";
  const showSales = isOwnerOrAdmin || can("sales.invoice.view") || role === "SALES_REP" || role === "ACCOUNTANT";
  const showPurchases = isOwnerOrAdmin || can("procurement.po.view") || role === "PROCUREMENT_OFFICER" || role === "WAREHOUSE_MANAGER";
  const showManufacturing = isOwnerOrAdmin || can("manufacturing.bom.manage") || role === "PRODUCTION_MANAGER";
  const showAccounting = isOwnerOrAdmin || can("finance.accounts.view") || role === "ACCOUNTANT";
  const showHr = isOwnerOrAdmin || can("hr.employee.view") || role === "HR_MANAGER";
  const showReports = isOwnerOrAdmin || can("bi.financial_reports.view") || role === "ACCOUNTANT" || role === "VIEWER";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 relative shadow-sm">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-800">
              Zynveo<span className="text-blue-600 text-sm align-top ml-0.5 font-bold">ERP</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
              OS
            </span>
          </Link>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase border border-slate-200">
            {role || 'OWNER'}
          </span>
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
          {(showInventory || showSales || showPurchases || showManufacturing) && (
            <div>
              <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Operations & Logistics
              </div>
              {showInventory && (
                <SidebarNavItem
                  href="/inventory"
                  icon={<Boxes size={18} />}
                  label="Inventory & WMS"
                  badge="Live"
                  badgeColor="bg-emerald-100 text-emerald-700"
                />
              )}
              {showSales && (
                <SidebarNavItem href="/sales" icon={<ShoppingCart size={18} />} label="Sales & Invoices" />
              )}
              {showPurchases && (
                <SidebarNavItem href="/purchases" icon={<ShoppingBag size={18} />} label="Purchases & GRN" />
              )}
              {showManufacturing && (
                <SidebarNavItem href="/manufacturing" icon={<Factory size={18} />} label="Manufacturing & BOM" />
              )}
            </div>
          )}

          {/* Section 3: Finance & Workforce */}
          {(showAccounting || showHr || showReports) && (
            <div>
              <div className="px-6 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Finance & Workforce
              </div>
              {showAccounting && (
                <SidebarNavItem
                  href="/accounting"
                  icon={<Calculator size={18} />}
                  label="Accounting & GL"
                />
              )}
              {showHr && <SidebarNavItem href="/hr" icon={<UserCheck size={18} />} label="HR & Payroll" />}
              {showReports && <SidebarNavItem href="/reports" icon={<BarChart2 size={18} />} label="Reports & BI" />}
            </div>
          )}

          {/* Section 4: Relationships & Workflow (Issue 11 preserved untouched) */}
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

        {/* User Mini Profile in Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-3 px-2 py-1.5 rounded-lg">
            <div className={`w-8 h-8 rounded-full ${user?.avatarColor || currentPersona.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.fullName || currentPersona.fullName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {currentPersona.jobTitle}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 z-10">
          {/* Left / Center: Domain & Branch Selector */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full text-xs font-medium border border-emerald-100">
              <ShieldCheck size={15} />
              <span>app.zynveo.com</span>
            </div>

            {/* Branch Switcher Dropdown */}
            <div className="relative" ref={branchRef}>
              <button
                type="button"
                onClick={() => setBranchOpen(!branchOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
              >
                <Building2 size={14} className="text-blue-600" />
                <span>{activeBranchName}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {branchOpen && (
                <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Operational Branches
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      switchBranch(DEMO_TENANT.colomboBranchId);
                      setBranchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 ${
                      activeBranchId === DEMO_TENANT.colomboBranchId ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p>{DEMO_TENANT.colomboBranchName}</p>
                      <p className="text-[10px] text-slate-400">Primary Head Office & WMS Hub</p>
                    </div>
                    {activeBranchId === DEMO_TENANT.colomboBranchId && <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchBranch(DEMO_TENANT.kandyBranchId);
                      setBranchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 ${
                      activeBranchId === DEMO_TENANT.kandyBranchId ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p>{DEMO_TENANT.kandyBranchName}</p>
                      <p className="text-[10px] text-slate-400">Regional Fulfillment Depot</p>
                    </div>
                    {activeBranchId === DEMO_TENANT.kandyBranchId && <Check size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <Diamond size={14} className="fill-blue-600" />
              <span>Enterprise</span>
            </button>

            {can("sales.invoice.create") && (
              <Link
                href="/sales/invoices/new"
                className="text-xs font-medium text-white bg-blue-600 px-3.5 py-1.5 rounded-full hover:bg-blue-700 transition-colors shadow-xs"
              >
                POS / Quick Sale
              </Link>
            )}

            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {/* Active User Menu with Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.fullName || currentPersona.fullName}
                  </div>
                  <div className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                    {role || 'OWNER'}
                  </div>
                </div>
                <div
                  className={`w-9 h-9 rounded-full ${user?.avatarColor || currentPersona.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-xs`}
                >
                  {initials}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
                  {/* User Info Header */}
                  <div className="px-4 py-3 bg-slate-50/70">
                    <p className="text-xs font-bold text-slate-900">
                      {user?.fullName || currentPersona.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user?.email || currentPersona.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {role || 'OWNER'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {permissions.length} Active Permissions
                      </span>
                    </div>
                  </div>

                  {/* Switch Demo Persona (Interview Helper) */}
                  <div className="p-2">
                    <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Switch Persona (Demo)</span>
                      <Sparkles size={12} className="text-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {Object.values(DEMO_PERSONAS).slice(0, 6).map((p) => (
                        <button
                          key={p.role}
                          type="button"
                          onClick={() => {
                            signInWithDemo(p.role);
                            setMenuOpen(false);
                          }}
                          className={`text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                            role === p.role
                              ? 'bg-blue-50 font-bold text-blue-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="truncate font-medium">{p.fullName.split(' ')[0]}</div>
                          <div className="text-[9px] text-slate-400 truncate">{p.badge}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links & Sign Out */}
                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" />
                      <span>Security & Roles Settings</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      <span>Sign Out from Terminal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Wrapped in PowerSync */}
        <main className="flex-1 overflow-y-auto relative bg-[#f0f4f8]">
          <PowerSyncProvider>{children}</PowerSyncProvider>
        </main>
      </div>
    </div>
  );
}
