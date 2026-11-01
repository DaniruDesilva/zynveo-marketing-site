"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  KeyRound,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  ChevronRight,
  Globe,
  HelpCircle,
  FileCheck2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import { DEMO_PERSONAS, DEMO_TENANT } from '../../lib/authTypes';
import { UserRole } from '@zynveo/contracts';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithDemo, signIn, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'credentials' | 'demo'>('credentials');
  const [email, setEmail] = useState('owner@zynveo.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedPersonaRole, setSelectedPersonaRole] = useState<UserRole>('OWNER');
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
    setSelectedPersonaRole(role);
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

  const activePersona = DEMO_PERSONAS[selectedPersonaRole] || DEMO_PERSONAS.OWNER;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f4f7fb] text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Top Corporate Nav / Trust Banner */}
      <header className="w-full bg-white border-b border-slate-200/80 px-6 sm:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            Z
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Zynveo<span className="text-blue-600 text-sm align-top ml-0.5 font-bold">ERP</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                Cloud OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {DEMO_TENANT.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-5 text-xs text-slate-600">
          <div className="hidden md:flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/80 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Secure Cloud Connection (TLS 1.3)</span>
          </div>

          <div className="flex items-center space-x-1 text-slate-500 font-medium">
            <Globe size={14} />
            <span className="hidden sm:inline">Region:</span>
            <span className="font-semibold text-slate-700">Sri Lanka (HQ)</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden flex flex-col lg:flex-row my-auto">
          
          {/* Left Column: Corporate Brand Showcase */}
          <div className="lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
            {/* Subtle light accents */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-blue-500/15 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-400/20 font-medium">
                <Building2 size={13} />
                <span>Enterprise Resource Planning</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  Integrated Business Management System
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Real-time visibility across general ledger accounting, multi-warehouse logistics, customer invoicing, procurement, and automated payroll.
                </p>
              </div>

              {/* Value Pillars for Non-IT Business Users */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Financial & Ledger Equilibrium</h2>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Automated double-entry journals, VAT tax calculations, and real-time Profit & Loss statements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Inventory & Supply Chain</h2>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Multi-location stock tracking, Weighted Average Costing, and 3-way vendor invoice matching.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Statutory Payroll & People</h2>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Employee directories, EPF & ETF compliance filings, and progressive salary disbursement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tenant Badge */}
            <div className="relative z-10 pt-8 mt-8 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <div>
                <p className="font-semibold text-slate-200">Colombo Corporate HQ</p>
                <p className="text-[11px] text-slate-400">Primary Head Office & Operations Hub</p>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Enterprise Sign-In Portal */}
          <div className="lg:w-7/12 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Sign In to Workspace
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your access mode or enter corporate credentials below.
                  </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('credentials')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'credentials'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('demo')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'demo'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    <span>Demo Personas</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* TAB 1: STANDARD CORPORATE CREDENTIALS */}
              {activeTab === 'credentials' && (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Corporate Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@zynveo.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Self-service password recovery instructions sent to registered corporate email.")}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Keep me signed in on this terminal</span>
                    </label>

                    <span className="text-[11px] text-slate-400">
                      Session timeout: 8 hours
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || isLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    <span>{submitting ? 'Verifying Authorization...' : 'Sign In to ERP Console'}</span>
                    <ArrowRight size={16} />
                  </button>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Evaluating for an interview?</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('demo')}
                      className="text-blue-600 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Explore verified role personas</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: INTERACTIVE DEMO PERSONAS FOR INTERVIEWERS */}
              {activeTab === 'demo' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5 flex items-start space-x-3">
                    <Sparkles className="text-blue-600 shrink-0 mt-0.5" size={17} />
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">
                        1-Click Role-Based Access Control (RBAC) Demonstration
                      </p>
                      <p className="mt-0.5 text-slate-600 leading-normal">
                        Select any department persona to inspect role permissions across Accounting, Inventory, Sales, and HR.
                      </p>
                    </div>
                  </div>

                  {/* Persona Selector Dropdown / Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Choose Verified Enterprise Persona:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                      {Object.values(DEMO_PERSONAS).map((persona) => {
                        const isSelected = selectedPersonaRole === persona.role;
                        const initials = persona.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2);

                        return (
                          <button
                            key={persona.role}
                            type="button"
                            onClick={() => setSelectedPersonaRole(persona.role)}
                            className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl shrink-0 ${persona.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-xs`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {persona.fullName}
                                </span>
                                {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                              </div>
                              <p className="text-[11px] font-semibold text-blue-700 truncate mt-0.5">
                                {persona.jobTitle}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {persona.department}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Selected Persona Detail & Launch Button */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Selected Role:</span>
                      <span className="font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px]">
                        {activePersona.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      {activePersona.description}
                    </p>

                    <button
                      type="button"
                      disabled={submitting || isLoading}
                      onClick={() => handleDemoSignIn(activePersona.role)}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>{submitting ? 'Signing In...' : `Sign In as ${activePersona.fullName}`}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Footer */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Single Sign-On (SSO) & 2FA Enforced</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => alert("Please contact your company IT administrator for account assistance.")}
                  className="hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <HelpCircle size={12} />
                  <span>Support</span>
                </button>
                <span>·</span>
                <span className="text-slate-400">Zynveo ERP OS v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Compliance & Legal Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white/60">
        <p>© 2026 {DEMO_TENANT.name}. All enterprise rights reserved.</p>
      </footer>
    </div>
  );
}
