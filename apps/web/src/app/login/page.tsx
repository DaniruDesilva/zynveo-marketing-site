"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import { DEMO_PERSONAS, DEMO_TENANT } from '../../lib/authTypes';
import { UserRole } from '@zynveo/contracts';

const QUICK_ROLES: {
  role: UserRole;
  label: string;
  name: string;
  color: string;
  avatarColor: string;
}[] = [
  { role: 'OWNER', label: 'Owner / Exec', name: 'Alexander W.', color: 'border-blue-200 hover:border-blue-500 hover:bg-blue-50/60', avatarColor: 'bg-blue-600' },
  { role: 'ACCOUNTANT', label: 'Accountant', name: 'Elena R.', color: 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/60', avatarColor: 'bg-emerald-600' },
  { role: 'WAREHOUSE_MANAGER', label: 'Warehouse', name: 'Marcus V.', color: 'border-amber-200 hover:border-amber-500 hover:bg-amber-50/60', avatarColor: 'bg-amber-600' },
  { role: 'SALES_REP', label: 'Sales Lead', name: 'Sophia C.', color: 'border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/60', avatarColor: 'bg-indigo-600' },
  { role: 'PRODUCTION_MANAGER', label: 'Plant Mgr', name: 'Liam O.', color: 'border-orange-200 hover:border-orange-500 hover:bg-orange-50/60', avatarColor: 'bg-orange-600' },
  { role: 'HR_MANAGER', label: 'HR & Payroll', name: 'Nadia S.', color: 'border-pink-200 hover:border-pink-500 hover:bg-pink-50/60', avatarColor: 'bg-pink-600' },
  { role: 'ADMIN', label: 'System Admin', name: 'Kasun J.', color: 'border-violet-200 hover:border-violet-500 hover:bg-violet-50/60', avatarColor: 'bg-violet-600' },
  { role: 'VIEWER', label: 'Auditor', name: 'Priya F.', color: 'border-slate-200 hover:border-slate-500 hover:bg-slate-100', avatarColor: 'bg-slate-600' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signInWithDemo, signIn, isLoading } = useAuth();

  const [email, setEmail] = useState('owner@zynveo.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid credentials or tenant authorization failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithDemo(role);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate demo persona.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#edf2f7] via-[#f4f7fb] to-[#e8eef5] text-slate-800 selection:bg-blue-600 selection:text-white px-4 py-6">
      {/* Top Header / Subtle Breadcrumb */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <Building2 size={14} className="text-blue-600" />
          <span className="font-semibold text-slate-700">{DEMO_TENANT.name}</span>
          <span className="text-slate-300">·</span>
          <span>{DEMO_TENANT.colomboBranchName}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] font-medium">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Verified Enterprise Node</span>
        </div>
      </div>

      {/* Main Centered Enterprise Card */}
      <div className="w-full max-w-[480px] mx-auto my-auto bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-200/80 overflow-hidden">
        {/* Subtle Brand Accent Line */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

        <div className="p-7 sm:p-8 space-y-6">
          {/* Brand & Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/25">
                Z
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Zynveo<span className="text-blue-600 text-base align-top ml-0.5 font-bold">ERP</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                OS
              </span>
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-500">
                Enter your work credentials to access the ERP management console.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@zynveo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset instructions sent to registered corporate email.")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-slate-400">8h session</span>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 mt-1 cursor-pointer"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Roles Section (Compact, 1-Click for Evaluators) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Sparkles size={13} className="text-blue-600" />
                <span>Quick Role Demo (1-Click Switch)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Interview Mode</span>
            </div>

            <p className="text-[11px] text-slate-500 mb-2.5">
              Click any verified persona to instantly sign in and test RBAC permissions:
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ROLES.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  disabled={submitting || isLoading}
                  onClick={() => handleDemoSignIn(item.role)}
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer bg-slate-50/70 ${item.color}`}
                >
                  <div className={`w-6 h-6 rounded-md ${item.avatarColor} text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs`}>
                    {item.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card Security Trust Note */}
          <div className="pt-1 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 text-center">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Encrypted Session · Double-Entry Financial Governance</span>
          </div>
        </div>
      </div>

      {/* Corporate Compliance & Legal Footer */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 pt-2">
        <p>© 2026 {DEMO_TENANT.name}. All enterprise rights reserved.</p>
        <div className="flex items-center space-x-4">
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Corporate Privacy Policy: All tenant data is encrypted at rest and in transit."); }} className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Authorized enterprise use only."); }} className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <span>·</span>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("All 8 Microservices Operational: Port 4000 Gateway Online."); }} className="hover:text-slate-600 transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}
