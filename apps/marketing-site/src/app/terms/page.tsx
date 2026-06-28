import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Zynveo Technologies",
  description: "Review terms and conditions governing the use of Zynveo Cloud OS and free viral utility tools.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl space-y-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-all">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Homepage</span>
      </Link>

      <header className="space-y-4 pb-8 border-b border-neutral-border">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-black uppercase tracking-widest">
          <FileText className="h-3.5 w-3.5" />
          <span>Terms & Conditions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-text">
          Terms of Service
        </h1>
        <p className="text-neutral-muted font-medium text-lg">
          Effective Date: June 27, 2026 • Please read carefully before launching tools.
        </p>
      </header>

      <div className="prose prose-lg max-w-none text-slate-700 space-y-8 font-medium leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or utilizing any tool on the Zynveo website (`zynveo.com`), you agree to be bound by these Terms of Service. If you do not agree with any provision of these terms, you must immediately discontinue use of the site.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">2. Accuracy of Utility Calculators</h2>
          <p>
            While our engineering team validates all mathematical formulas embedded within our MRP Calculator, Invoice Generator, and Barcode Maker against accounting best practices, these public utilities are provided "as is" without formal legal or tax warranties. Users are advised to verify final invoice tax figures with a certified public accountant.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">3. Enterprise SLA Guarantees</h2>
          <p>
            Service Level Agreements (SLAs), including our 99.9% cloud uptime guarantee and dedicated server failover protocols, apply specifically to contracted enterprise cloud OS accounts and are governed by individual Master Services Agreements signed upon onboarding.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">4. Modifications to Terms</h2>
          <p>
            Zynveo reserves the right to modify these terms at any time. Continued usage of our web platform following the posting of changes constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
