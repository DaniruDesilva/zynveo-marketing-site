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
  Zap,
  Layers,
  KeyRound,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import { DEMO_PERSONAS } from '../../lib/authTypes';
import { UserRole } from '@zynveo/contracts';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithDemo, signIn, isLoading } = useAuth();

  const [email, setEmail] = useState('owner@zynveo.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid credentials or tenant authorization failure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setSelectedRole(role);
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithDemo(role);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate demo persona');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0b1329] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Left Column: Brand & Enterprise Security Telemetry */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-br from-slate-950 via-[#0d1838] to-[#091124] overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-extrabold text-xl">
              Z
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-white">
                Zynveo<span className="text-blue-400 font-bold text-lg ml-0.5">ERP</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 ml-2 border border-blue-400/30">
                Cloud OS
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400 uppercase tracking-widest font-semibold">
            Next-Gen Enterprise Resource Planning · Multi-Tenant Architecture
          </p>
        </div>

        {/* Core Value Pillars */}
        <div className="relative z-10 my-8 lg:my-16 space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-xs px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-medium">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Zero-Trust Enterprise IAM · Cryptographic Token Verification</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            Autonomous ERP for High-Velocity Modern Enterprises.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Engineered with strict microservice schema isolation, event-driven transactional outbox sagas, 
            immutable stock ledgers, and real-time double-entry general ledger balance verification.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold">
                <CheckCircle2 size={14} />
                <span>Double-Entry GL</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">ACID transactions with Debit == Credit equilibrium</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={14} />
                <span>WAC & FEFO Stocks</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Weighted Average Cost recalculation & immutable logs</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold">
                <CheckCircle2 size={14} />
                <span>Distributed Sagas</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Order-to-Cash & Procure-to-Pay transactional outbox</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
                <CheckCircle2 size={14} />
                <span>Multi-Tenancy</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Isolated PostgreSQL schemas per service domain</p>
            </div>
          </div>
        </div>

        {/* System Telemetry & Branch Info */}
        <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80 gap-3">
          <div className="flex items-center space-x-2">
            <Building2 size={14} className="text-slate-400" />
            <span>Zynveo Enterprise Holdings Ltd (Colombo HQ · Sri Lanka)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono text-[11px]">API Gateway v1.0 · Port 4000</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Console & Demo Personas */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 lg:p-14 bg-[#0e172e] overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Identity & Access Management
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your corporate credentials or select a verified role persona below.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Direct Credentials Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Self-service reset is enabled via Supabase Auth email dispatcher.")}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In with Credentials'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0e172e] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                ⚡ Quick Demo Role Switcher
              </span>
            </div>
          </div>

          {/* Demo Persona Cards */}
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 mb-2">
              Select any role to test granular RBAC permission gating instantly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {Object.values(DEMO_PERSONAS).map((persona) => {
                const isSelected = selectedRole === persona.role;
                return (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => handleDemoSignIn(persona.role)}
                    disabled={submitting || isLoading}
                    className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-900/40 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 ${persona.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {persona.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate">
                          {persona.fullName}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                          {persona.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {persona.jobTitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-400">
              Session secured with HMAC-SHA256 tokens · Fail-Closed Gateway Verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
