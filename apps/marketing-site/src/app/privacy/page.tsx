import React from "react";
import Link from "next/link";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Zynveo Technologies",
  description: "Learn how Zynveo protects user privacy, secures cloud ERP ledgers, and maintains zero data retention on public utility tools.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl space-y-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-all">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Homepage</span>
      </Link>

      <header className="space-y-4 pb-8 border-b border-neutral-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest">
          <Lock className="h-3.5 w-3.5" />
          <span>Data Privacy Protection</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-text">
          Privacy Policy
        </h1>
        <p className="text-neutral-muted font-medium text-lg">
          Effective Date: June 27, 2026 • Committed to zero tracking on public utilities.
        </p>
      </header>

      <div className="prose prose-lg max-w-none text-slate-700 space-y-8 font-medium leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">1. Information We Collect</h2>
          <p>
            We collect minimal, strictly necessary data depending on how you interact with Zynveo:
          </p>
          <ul className="space-y-2 list-none pl-0">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Free Utility Visitors:</strong> We collect zero personal identification information when you use our MRP Calculator, Invoice Generator, or Barcode Maker.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Contact Inquiries:</strong> If you submit an inquiry via our contact form, we collect your work email, phone number, and name solely to respond to your request.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">2. How We Use Your Data</h2>
          <p>
            Your information is never sold, rented, or shared with third-party data brokers or advertisers. Contact form details are used exclusively by our enterprise engineering team to facilitate software demonstrations, support tickets, or pricing discussions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">3. Cookies and Local Storage</h2>
          <p>
            Our public website does not employ intrusive tracking cookies. For certain free tools (such as saved invoice presets), we utilize browser LocalStorage so your theme preferences and company logo remain intact across page reloads without leaving your device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">4. Data Deletion Rights</h2>
          <p>
            You have the right to request full erasure of any contact inquiry records or subscribed ERP account metadata. Submit a deletion request to <a href="mailto:hello@zynveo.com" className="text-primary font-bold underline">hello@zynveo.com</a> and we will purge all records within 48 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
