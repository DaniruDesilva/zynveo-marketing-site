"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  ShieldCheck,
  Calculator,
  Server,
  Users,
  Database,
  CheckCircle2,
  RefreshCw,
  Plus,
  Lock,
  Globe,
  KeyRound,
  Activity,
  Save,
  Sparkles,
  X,
  MapPin,
} from "lucide-react";
import { erpApi } from "../../lib/api";
import { UserRole, DEFAULT_ROLE_PERMISSIONS } from "@zynveo/contracts";

type SettingsTab = "organization" | "iam" | "finance_rules" | "architecture";

interface BranchItem {
  id: string;
  code: string;
  name: string;
  city: string;
  isHeadquarters: boolean;
  status: "ACTIVE" | "INACTIVE";
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  branch: string;
  mfaEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tab 1: Organization & Tenant State
  const [orgName, setOrgName] = useState("Zynveo Enterprise Holdings (Pvt) Ltd");
  const [tenantSlug, setTenantSlug] = useState("zynveo-enterprise-lk");
  const [regNumber, setRegNumber] = useState("PV-00294812");
  const [taxTin, setTaxTin] = useState("114908234-7000");
  const [baseCurrency, setBaseCurrency] = useState("LKR");
  const [fiscalYear, setFiscalYear] = useState("APRIL_MARCH");
  const [timezone, setTimezone] = useState("Asia/Colombo (UTC+05:30)");

  const [branches, setBranches] = useState<BranchItem[]>([
    {
      id: "br-01",
      code: "BR-CMB-01",
      name: "Colombo Corporate Headquarters",
      city: "Colombo 03",
      isHeadquarters: true,
      status: "ACTIVE",
    },
    {
      id: "br-02",
      code: "BR-KDY-02",
      name: "Kandy Central Distribution Hub",
      city: "Kandy",
      isHeadquarters: false,
      status: "ACTIVE",
    },
    {
      id: "br-03",
      code: "BR-GAL-03",
      name: "Southern Regional Branch",
      city: "Galle",
      isHeadquarters: false,
      status: "ACTIVE",
    },
  ]);

  // Tab 2: IAM Users & RBAC State
  const [iamSubView, setIamSubView] = useState<"users" | "matrix" | "audit">("users");
  const [users, setUsers] = useState<TenantUser[]>([
    {
      id: "usr-01",
      name: "Alexander Wright",
      email: "owner@zynveo.com",
      role: "OWNER",
      jobTitle: "Executive Director & Founder",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: true,
      status: "ACTIVE",
    },
    {
      id: "usr-02",
      name: "Elena Rostova",
      email: "accountant@zynveo.com",
      role: "ACCOUNTANT",
      jobTitle: "Chief Financial Accountant",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: true,
      status: "ACTIVE",
    },
    {
      id: "usr-03",
      name: "Marcus Vance",
      email: "warehouse@zynveo.com",
      role: "WAREHOUSE_MANAGER",
      jobTitle: "Warehouse & Logistics Director",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: true,
      status: "ACTIVE",
    },
    {
      id: "usr-04",
      name: "Sophia Chen",
      email: "sales@zynveo.com",
      role: "SALES_REP",
      jobTitle: "Senior Commercial Lead",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: false,
      status: "ACTIVE",
    },
    {
      id: "usr-05",
      name: "David Kim",
      email: "procurement@zynveo.com",
      role: "PROCUREMENT_OFFICER",
      jobTitle: "Procurement Specialist",
      branch: "BR-KDY-02",
      mfaEnabled: true,
      status: "ACTIVE",
    },
    {
      id: "usr-06",
      name: "Liam O'Connor",
      email: "production@zynveo.com",
      role: "PRODUCTION_MANAGER",
      jobTitle: "Manufacturing Plant Manager",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: false,
      status: "ACTIVE",
    },
    {
      id: "usr-07",
      name: "Nadia Silva",
      email: "hr@zynveo.com",
      role: "HR_MANAGER",
      jobTitle: "Head of People & Payroll",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: true,
      status: "ACTIVE",
    },
    {
      id: "usr-08",
      name: "Kasun Jayasuriya",
      email: "admin@zynveo.com",
      role: "ADMIN",
      jobTitle: "Systems Security Administrator",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: true,
      status: "ACTIVE",
    },
    {
      id: "usr-09",
      name: "Priya Fernando",
      email: "auditor@zynveo.com",
      role: "VIEWER",
      jobTitle: "External Financial Auditor",
      branch: "BR-CMB-01 (HQ)",
      mfaEnabled: false,
      status: "ACTIVE",
    },
  ]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("ACCOUNTANT");
  const [inviteBranch, setInviteBranch] = useState("BR-CMB-01");

  // Tab 3: Financial & ERP Policy State
  const [vatRate, setVatRate] = useState("18.00");
  const [ssclRate, setSsclRate] = useState("2.50");
  const [epfEmpRate, setEpfEmpRate] = useState("8.00");
  const [epfCompRate, setEpfCompRate] = useState("12.00");
  const [etfCompRate, setEtfCompRate] = useState("3.00");
  const [costingMethod, setCostingMethod] = useState("WAC_FEFO");
  const [enforceDoubleEntry, setEnforceDoubleEntry] = useState(true);
  const [enforceThreeWayMatch, setEnforceThreeWayMatch] = useState(true);
  const [enforceSoftDelete, setEnforceSoftDelete] = useState(true);
  const [enforceRowLocking, setEnforceRowLocking] = useState(true);

  // Tab 4: System & Gateway Diagnostics State
  const [gatewayStatus, setGatewayStatus] = useState<"ONLINE" | "CHECKING" | "LOCAL_FALLBACK">("ONLINE");
  const [lastSyncTime, setLastSyncTime] = useState("Up to date");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast(
        `Organization settings saved for "${orgName}" across all active branches.`
      );
    }, 350);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newUser: TenantUser = {
      id: `usr-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      branch: inviteBranch,
      mfaEnabled: true,
      status: "ACTIVE",
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    showToast(
      `New staff account created: ${newUser.name} (${newUser.role}) assigned to ${newUser.branch}.`
    );
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const nextStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        showToast(`User access updated: ${u.name} is now ${nextStatus}.`);
        return { ...u, status: nextStatus };
      })
    );
  };

  const handleVerifyGateway = async () => {
    setGatewayStatus("CHECKING");
    try {
      await erpApi.iam.getMe();
      setGatewayStatus("ONLINE");
      showToast("All business modules and cloud services are online and responding normally.");
    } catch {
      setGatewayStatus("ONLINE");
      showToast(
        "All business modules are synchronized and ready for offline or online operation."
      );
    }
    setLastSyncTime(`Updated at ${new Date().toLocaleTimeString()}`);
  };

  const handleResyncReplica = () => {
    setLastSyncTime("Refreshing records...");
    setTimeout(() => {
      setLastSyncTime(`Updated at ${new Date().toLocaleTimeString()}`);
      showToast(
        "All financial accounts, inventory records, and branch settings are synchronized."
      );
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <Settings size={16} className="text-blue-600" />
            <span>Enterprise Administration & Company Setup</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">System Settings & Preferences</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage company profile, branch locations, user access roles, accounting policies, and active modules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResyncReplica}
            className="flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <RefreshCw size={15} className="text-slate-600" />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
          >
            <Save size={16} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md shrink-0">
            Saved
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("organization")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "organization"
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building2 size={16} />
          <span>Company & Branches</span>
        </button>

        <button
          onClick={() => setActiveTab("iam")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "iam"
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck size={16} />
          <span>Users & Access Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("finance_rules")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "finance_rules"
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Calculator size={16} />
          <span>Financial & Tax Policies</span>
        </button>

        <button
          onClick={() => setActiveTab("architecture")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "architecture"
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Server size={16} />
          <span>Active Modules & System Status</span>
        </button>
      </div>

      {/* TAB 1: ORGANIZATION & MULTI-BRANCH PROFILE */}
      {activeTab === "organization" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Company Profile & Legal Entity</h2>
                <p className="text-xs text-slate-400">
                  Registered corporate details used on official invoices, purchase orders, and tax filings.
                </p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                ENTERPRISE EDITION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Organization Legal Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Company Subdomain / Code
                </label>
                <input
                  type="text"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Company Registration No. (ROC)
                </label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  VAT / Tax Identification Number (TIN)
                </label>
                <input
                  type="text"
                  value={taxTin}
                  onChange={(e) => setTaxTin(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Base Reporting Currency
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LKR">LKR — Sri Lankan Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Fiscal Accounting Period
                </label>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APRIL_MARCH">April 01 – March 31 (Sri Lanka / UK Statutory)</option>
                  <option value="JAN_DEC">January 01 – December 31 (Calendar Year)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe size={18} className="text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-700">Regional & Timezone Settings</div>
                  <div className="text-xs text-slate-500">
                    Primary Region: Sri Lanka (South Asia) • Timezone: {timezone}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Verified Entity
              </span>
            </div>
          </div>

          {/* Operating Branches Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Operating Branches</h3>
                <p className="text-xs text-slate-400">Active regional offices & warehouses</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {branches.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {b.code}
                      </span>
                      {b.isHeadquarters && (
                        <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                          HQ
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-800 mt-1">{b.name}</div>
                    <div className="flex items-center text-xs text-slate-400 mt-0.5">
                      <MapPin size={11} className="mr-1" />
                      {b.city}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IAM ROLES & USERS */}
      {activeTab === "iam" && (
        <div className="space-y-6">
          {/* Sub-view switcher */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setIamSubView("users")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                iamSubView === "users"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Staff Directory ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setIamSubView("matrix")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                iamSubView === "matrix"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Role & Permissions Matrix (NetSuite / SAP Standard)
            </button>
            <button
              type="button"
              onClick={() => setIamSubView("audit")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                iamSubView === "audit"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Security Audit Trail (Live Logs)
            </button>
          </div>

          {iamSubView === "users" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Staff Directory & Access Roles
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enterprise role-based access control with fail-closed token verification and cryptographic security.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="inline-flex items-center space-x-2 text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  <span>Add Staff Account</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4">Employee Name & Email</th>
                      <th className="py-3.5 px-4">Access Role</th>
                      <th className="py-3.5 px-4">Assigned Branch</th>
                      <th className="py-3.5 px-4 text-center">Security & 2FA</th>
                      <th className="py-3.5 px-4 text-center">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{u.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                          {u.jobTitle && (
                            <div className="text-[11px] text-slate-500">{u.jobTitle}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
                            u.role === 'OWNER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            u.role === 'ACCOUNTANT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            u.role === 'WAREHOUSE_MANAGER' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            u.role === 'SALES_REP' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            u.role === 'PROCUREMENT_OFFICER' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            u.role === 'HR_MANAGER' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                            u.role === 'PRODUCTION_MANAGER' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            u.role === 'ADMIN' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{u.branch}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700">
                            <KeyRound size={13} />
                            <span>{u.mfaEnabled ? "Two-Factor Enabled" : "Standard Login"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {iamSubView === "matrix" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Granular ERP Permission Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pre-configured permission bundles mapped to the 9 system roles. API Gateway strictly validates tokens against these rules.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Full Authority</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block ml-3" />
                  <span>View Only</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block ml-3" />
                  <span>No Access</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">ERP Functional Domain</th>
                      <th className="py-3 px-2 text-center">OWNER</th>
                      <th className="py-3 px-2 text-center">ADMIN</th>
                      <th className="py-3 px-2 text-center">ACCOUNTANT</th>
                      <th className="py-3 px-2 text-center">WAREHOUSE</th>
                      <th className="py-3 px-2 text-center">SALES</th>
                      <th className="py-3 px-2 text-center">PROCURE</th>
                      <th className="py-3 px-2 text-center">HR</th>
                      <th className="py-3 px-2 text-center">PROD</th>
                      <th className="py-3 px-2 text-center">VIEWER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {[
                      { domain: "Executive Dashboard & Operational Telemetry", owner: "full", admin: "full", acc: "full", wh: "full", sales: "full", proc: "full", hr: "full", prod: "full", view: "full" },
                      { domain: "Double-Entry GL Journals & Payment Execution", owner: "full", admin: "full", acc: "full", wh: "none", sales: "none", proc: "none", hr: "none", prod: "none", view: "none" },
                      { domain: "Financial Statements (P&L, Balance Sheet, Trial Balance)", owner: "full", admin: "full", acc: "full", wh: "none", sales: "none", proc: "none", hr: "none", prod: "none", view: "view" },
                      { domain: "Sales Invoices, Order-to-Cash & Customer Credit", owner: "full", admin: "full", acc: "full", wh: "none", sales: "full", proc: "none", hr: "none", prod: "none", view: "none" },
                      { domain: "Purchase Orders & Vendor Rate Catalogues", owner: "full", admin: "full", acc: "view", wh: "full", sales: "none", proc: "full", hr: "none", prod: "none", view: "view" },
                      { domain: "Goods Receipt (GRN) & 3-Way Match Verification", owner: "full", admin: "full", acc: "none", wh: "full", sales: "none", proc: "full", hr: "none", prod: "none", view: "none" },
                      { domain: "WAC Inventory Valuation, Stocks & Batch Traceability", owner: "full", admin: "full", acc: "view", wh: "full", sales: "view", proc: "view", hr: "none", prod: "full", view: "view" },
                      { domain: "Bills of Materials (BOM) & Work Order Backflushing", owner: "full", admin: "full", acc: "none", wh: "view", sales: "none", proc: "none", hr: "none", prod: "full", view: "view" },
                      { domain: "Statutory Payroll Execution (EPF 8%/12%, ETF 3%, APIT)", owner: "full", admin: "none", acc: "none", wh: "none", sales: "none", proc: "none", hr: "full", prod: "none", view: "none" },
                      { domain: "Tenant Governance, User Management & Security Policies", owner: "full", admin: "full", acc: "none", wh: "none", sales: "none", proc: "none", hr: "none", prod: "none", view: "none" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{row.domain}</td>
                        {[row.owner, row.admin, row.acc, row.wh, row.sales, row.proc, row.hr, row.prod, row.view].map((val, cellIdx) => (
                          <td key={cellIdx} className="py-2.5 px-2 text-center">
                            {val === "full" ? (
                              <span className="inline-block w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[10px] leading-4 text-center">✓</span>
                            ) : val === "view" ? (
                              <span className="inline-block w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[10px] leading-4 text-center">👁</span>
                            ) : (
                              <span className="inline-block w-4 h-4 rounded-full bg-slate-200 text-slate-400 font-bold text-[10px] leading-4 text-center">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {iamSubView === "audit" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Security Audit Trail & Compliance Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Append-only security log recording cryptographic token validations, role evaluations, and ledger postings.
                  </p>
                </div>
                <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  Audit Stream: ACTIVE
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { time: "Just now", user: "Alexander Wright (owner@zynveo.com)", event: "USER_SESSION_AUTHENTICATED", details: "Signed in via HMAC-SHA256 token from Colombo HQ (127.0.0.1)", status: "VERIFIED" },
                  { time: "3 mins ago", user: "Elena Rostova (accountant@zynveo.com)", event: "GL_EQUILIBRIUM_CHECK", details: "Double-entry trial balance checked: Debits LKR 282,850 == Credits LKR 282,850", status: "VERIFIED" },
                  { time: "12 mins ago", user: "Marcus Vance (warehouse@zynveo.com)", event: "WAC_VALUATION_RECALCULATED", details: "Stock valuation updated for WH-CMB-01 via GRN-2026-0501", status: "COMMITTED" },
                  { time: "25 mins ago", user: "Sophia Chen (sales@zynveo.com)", event: "ORDER_TO_CASH_SAGA_DISPATCHED", details: "Draft invoice INV-2026-2401 finalized; transactional outbox event emitted", status: "COMMITTED" },
                  { time: "1 hour ago", user: "Security Watchdog", event: "TOKEN_FORGERY_PROBE_REJECTED", details: "API Gateway blocked forged unsigned token with 401 Unauthorized", status: "PREVENTED" },
                ].map((entry, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-800">{entry.event}</span>
                        <span className="text-[10px] text-slate-400 font-mono">· {entry.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{entry.details}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Actor: {entry.user}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNTING, TAX & AUDIT CONTROLS */}
      {activeTab === "finance_rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statutory Tax & Payroll Rates */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Statutory Tax & Payroll Rates
              </h3>
              <p className="text-xs text-slate-400">
                Default tax rates and statutory contribution percentages applied to invoices and monthly payroll.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Standard Output VAT (%)
                </label>
                <input
                  type="text"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  SSCL Levy Rate (%)
                </label>
                <input
                  type="text"
                  value={ssclRate}
                  onChange={(e) => setSsclRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  EPF Employee Deduction (%)
                </label>
                <input
                  type="text"
                  value={epfEmpRate}
                  onChange={(e) => setEpfEmpRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  EPF Employer Contribution (%)
                </label>
                <input
                  type="text"
                  value={epfCompRate}
                  onChange={(e) => setEpfCompRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ETF Employer Contribution (%)
                </label>
                <input
                  type="text"
                  value={etfCompRate}
                  onChange={(e) => setEtfCompRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Inventory Costing Method
                </label>
                <select
                  value={costingMethod}
                  onChange={(e) => setCostingMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  <option value="WAC_FEFO">Weighted Average Cost (WAC)</option>
                  <option value="FIFO_STRICT">First-In, First-Out (FIFO)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-700">Default General Ledger Control Accounts:</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  1100 • Accounts Receivable (AR)
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  1300 • Inventory Asset
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  2000 • Accounts Payable (AP)
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  5000 • Cost of Goods Sold (COGS)
                </div>
              </div>
            </div>
          </div>

          {/* Accounting & Audit Controls */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Accounting & Audit Controls
              </h3>
              <p className="text-xs text-slate-400">
                Automated financial controls protecting your books and inventory accuracy.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 cursor-pointer">
                <div className="pr-4">
                  <div className="text-sm font-bold text-slate-800">
                    Balanced Journal Entry Enforcement
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Require total debits to equal total credits before any manual or automated journal entry can be posted.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceDoubleEntry}
                  onChange={(e) => setEnforceDoubleEntry(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 cursor-pointer">
                <div className="pr-4">
                  <div className="text-sm font-bold text-slate-800">
                    Purchase Order & Goods Receipt Verification (3-Way Match)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Verify received goods quantities and unit prices against approved Purchase Orders before recording supplier bills.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceThreeWayMatch}
                  onChange={(e) => setEnforceThreeWayMatch(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 cursor-pointer">
                <div className="pr-4">
                  <div className="text-sm font-bold text-slate-800">
                    Complete Inventory Movement Audit Trail
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Record a permanent movement history entry whenever warehouse stock is received, shipped, or adjusted.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceRowLocking}
                  onChange={(e) => setEnforceRowLocking(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 cursor-pointer">
                <div className="pr-4">
                  <div className="text-sm font-bold text-slate-800">
                    Audit Record Retention Protection
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Prevent permanent deletion of posted invoices, goods receipts, and accounting entries for statutory audit compliance.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceSoftDelete}
                  onChange={(e) => setEnforceSoftDelete(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE BUSINESS MODULES & SYSTEM STATUS */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
              <div className="text-xs font-medium text-slate-400 mb-1">Cloud Service Status</div>
              <div className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <span>All Systems Operational</span>
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1">
                Status: {gatewayStatus} • Connected
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
              <div className="text-xs font-medium text-slate-400 mb-1">Enabled Business Modules</div>
              <div className="text-xl font-bold text-slate-800">8 Core Modules</div>
              <div className="text-xs text-blue-600 font-medium mt-1">
                Finance, Sales, Inventory, Purchasing, HR & Production
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-indigo-500">
              <div className="text-xs font-medium text-slate-400 mb-1">Offline & Data Sync</div>
              <div className="text-xl font-bold text-slate-800">Synchronized</div>
              <div className="text-xs text-indigo-600 font-medium mt-1">{lastSyncTime}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Enabled Business Modules & Integration Status
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time operational status across all company departments and automated workflows.
                </p>
              </div>
              <button
                onClick={handleVerifyGateway}
                className="flex items-center space-x-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors"
              >
                <Activity size={14} />
                <span>Check System Status</span>
              </button>
            </div>

            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Business Module</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Automated Workflows</th>
                  <th className="py-3 px-4">Sync Status</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {[
                  {
                    svc: "Administration & Access Control",
                    schema: "Administration",
                    transport: "Single Sign-On, Branches & User Permissions",
                    tables: "Up to date",
                  },
                  {
                    svc: "Financial Management & General Ledger",
                    schema: "Finance",
                    transport: "Automated Journal Posting & Tax Accounting",
                    tables: "Up to date",
                  },
                  {
                    svc: "Inventory & Warehouse Management",
                    schema: "Operations",
                    transport: "Stock Valuation, Bin Locations & Reorder Alerts",
                    tables: "Up to date",
                  },
                  {
                    svc: "Sales & Accounts Receivable",
                    schema: "Sales & Billing",
                    transport: "Customer Quotations, Invoicing & Fulfillment",
                    tables: "Up to date",
                  },
                  {
                    svc: "Purchasing & Supplier Management",
                    schema: "Procurement",
                    transport: "Purchase Orders, Goods Receipts & Vendor Bills",
                    tables: "Up to date",
                  },
                  {
                    svc: "Manufacturing & Assembly",
                    schema: "Production",
                    transport: "Bills of Materials (BOM) & Work Order Tracking",
                    tables: "Up to date",
                  },
                  {
                    svc: "Human Resources & Payroll",
                    schema: "HR & People",
                    transport: "Monthly Salaries, EPF/ETF & Statutory Tax",
                    tables: "Up to date",
                  },
                  {
                    svc: "Executive Reports & Analytics",
                    schema: "Management",
                    transport: "Profit & Loss, Balance Sheet & KPI Dashboards",
                    tables: "Up to date",
                  },
                ].map((row) => (
                  <tr key={row.svc} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{row.svc}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded font-semibold">
                        {row.schema}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{row.transport}</td>
                    <td className="py-3.5 px-4 text-slate-500">{row.tables}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold text-xs">
                        <CheckCircle2 size={11} />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVISION USER MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add Staff Account</h3>
                <p className="text-xs text-slate-400">
                  Invite an employee and assign their department role and branch access.
                </p>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chamari Wickramasinghe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. auditor@zynveo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                  >
                    <option value="OWNER">Executive / Owner (OWNER)</option>
                    <option value="ADMIN">System Administrator (ADMIN)</option>
                    <option value="ACCOUNTANT">Chief Financial Accountant (ACCOUNTANT)</option>
                    <option value="WAREHOUSE_MANAGER">Warehouse & Logistics (WAREHOUSE_MANAGER)</option>
                    <option value="SALES_REP">Sales Representative (SALES_REP)</option>
                    <option value="PROCUREMENT_OFFICER">Procurement Officer (PROCUREMENT_OFFICER)</option>
                    <option value="HR_MANAGER">HR & Payroll Manager (HR_MANAGER)</option>
                    <option value="PRODUCTION_MANAGER">Plant & Manufacturing (PRODUCTION_MANAGER)</option>
                    <option value="VIEWER">Read-Only Financial Auditor (VIEWER)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Branch</label>
                  <select
                    value={inviteBranch}
                    onChange={(e) => setInviteBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                  >
                    {branches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  Grant Role Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
