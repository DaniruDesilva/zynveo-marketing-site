import React from "react";
import Link from "next/link";
import { Shield, Lock, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Policy & Compliance Hub | Zynveo Technologies",
  description: "Review Zynveo Technologies legal policies, data compliance standards, row-level security architecture, and regulatory framework.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl space-y-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-all">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Homepage</span>
      </Link>

      <header className="space-y-4 pb-8 border-b border-neutral-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
          <Shield className="h-3.5 w-3.5" />
          <span>Legal & Compliance</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-text">
          Legal Policy & Security Hub
        </h1>
        <p className="text-neutral-muted font-medium text-lg">
          Last updated: June 27, 2026 • Zynveo Technologies (Pvt) Ltd, Galle, Sri Lanka.
        </p>
      </header>

      <div className="prose prose-lg max-w-none text-slate-700 space-y-8 font-medium leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">1. Regulatory Compliance Framework</h2>
          <p>
            Zynveo Technologies (Pvt) Ltd ("Zynveo", "we", "our", or "us") operates under the statutory corporate regulations of Sri Lanka and adheres to strict international cloud data compliance standards. Our software platforms are engineered to ensure complete separation between proprietary brand data and external analytics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">2. Free Utility Tools Usage Policy</h2>
          <p>
            Our viral utility suite (including the Dual-Mode MRP Calculator, No-Login Invoice Generator, and Barcode Maker) is provided strictly as free, public, client-side computing utilities.
          </p>
          <ul className="space-y-2 list-none pl-0">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>We do not store, track, or monetize invoice line items entered into the No-Login Invoice Generator.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>All calculations happen locally within your web browser sessions.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">3. Supabase Row Level Security (RLS)</h2>
          <p>
            For subscribed enterprise cloud OS tenants, data isolation is guaranteed at the Postgres kernel level using Supabase Row Level Security (RLS) policies. Multi-branch staff tokens are cryptographically signed with strict JSON Web Token (JWT) claims preventing cross-tenant access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">4. Intellectual Property Rights</h2>
          <p>
            All code, UI designs, algorithms, and branding elements associated with Zynveo Cloud OS and Zynveo Viral Suite are the sole intellectual property of Zynveo Technologies (Pvt) Ltd. Unauthorized reproduction, reverse engineering, or resale is prohibited under international copyright law.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <h3 className="text-lg font-black text-slate-900">Contact Legal Department</h3>
          <p className="text-sm">For official legal notices or compliance verification requests, please contact our legal team at <a href="mailto:hello@zynveo.com" className="text-primary font-bold underline">hello@zynveo.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
