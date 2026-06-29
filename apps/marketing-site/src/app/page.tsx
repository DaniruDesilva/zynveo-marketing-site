import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { 
  ArrowRight, CheckCircle2, Zap, Shield, TrendingUp, Layers, 
  Calculator, FileText, ShoppingBag, PieChart, Users, Star, Tag, Sparkles, Lock, Clock, ArrowUpRight, BarChart3, Bell, RefreshCw, Plus, Search, DollarSign, Briefcase, Truck, Database, Smartphone, ShieldCheck, HeartHandshake
} from "lucide-react";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function MarketingHomepage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Zynveo ERP & POS Suite",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Cloud, Web, Android, iOS",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Cloud-native ERP and SaaS operating system for FMCG brands, wholesalers, and retail SMEs with integrated POS and margin calculator.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is the difference between markup and retail margin?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Markup is calculated as a percentage over your landed production cost, whereas retail margin is calculated backward as a percentage of the final retail shelf price (MRP). Confusing the two causes brands to lose up to 15% in net profitability.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need to create an account to generate invoices, barcodes, or payslips?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No! Zynveo provides viral free utility tools including our MRP Calculator, No-Login Invoice Generator, Barcode Maker, and Payslip Generator completely free without sign-ups or passwords.",
            },
          },
          {
            "@type": "Question",
            name: "Can Zynveo POS work offline during network outages?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, our mobile and tablet POS applications support offline caching. Transactions automatically sync to the central cloud database as soon as internet connectivity is restored.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col gap-24 sm:gap-32 pb-24 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Ambient background glow elements */}
      <div className="glow-blob w-[500px] h-[500px] bg-primary/15 top-10 left-1/2 -translate-x-1/2" />
      <div className="glow-blob w-[400px] h-[400px] bg-accent/10 top-1/3 -left-20" style={{ animationDelay: '-3s' }} />

      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 lg:pt-28 px-4 sm:px-6 lg:px-8 hero-gradient z-10">
        <div className="container mx-auto max-w-6xl text-center space-y-8 sm:space-y-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-xl ring-1 ring-white/20 hover:scale-105 transition-all duration-300 cursor-default">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-200 tracking-wide">
              Trusted by <strong className="text-white font-extrabold underline decoration-accent decoration-2 underline-offset-4">25,000+</strong> Fast-Growing FMCG & Retail Brands
            </span>
          </div>

          <h1 className="text-[24px] sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-text leading-[1.25] sm:leading-[1.1] max-w-5xl mx-auto px-1">
            <span>The Next-Gen Cloud OS For Retail, ERP, POS & Inventory</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-accent block mt-2 sm:mt-3 text-[18px] sm:text-5xl lg:text-6xl leading-normal font-extrabold">
              Enterprise Power. 100% Free Suite.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-xl font-medium text-neutral-muted leading-relaxed px-2">
            The all-in-one cloud OS for inventory, POS scanning, and instant pricing math. Plus, access our high-converting utility calculators <span className="text-neutral-text font-bold underline decoration-accent decoration-2">completely free without signing up</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
            <Link
              href="#free-tools"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[52px] inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-orange-600 px-4 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/50 hover:-translate-y-1 transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
              <span>Launch Free Utility Suite</span>
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[52px] inline-flex items-center justify-center rounded-2xl glass-panel px-4 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-bold text-neutral-text hover:border-primary hover:text-primary hover:shadow-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              <span>Talk to Enterprise Sales</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* TRUST & METRICS PILL ROW (Flawlessly Responsive, Never Overflows) */}
          <div className="pt-10 sm:pt-14 pb-6 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-2">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:border-emerald-500/40 transition-all duration-300">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Active Brands</div>
                <div className="text-lg font-black text-slate-800">25,000+ Synced</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:border-blue-500/40 transition-all duration-300">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-inner shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cloud Security</div>
                <div className="text-lg font-black text-blue-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Bank-Grade RLS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:border-amber-500/40 transition-all duration-300">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-500 shadow-inner shrink-0">
                <Star className="h-6 w-6 fill-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Utility Pricing</div>
                <div className="text-lg font-black text-amber-600">100% Free Suite</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEDICATED CURRENT AVAILABLE FREE TOOLS SECTION (#free-tools) */}
      <section id="free-tools" className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-28">
        <div className="p-4 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-br from-primary/10 via-indigo-50/50 to-orange-50/50 border-2 border-primary/30 shadow-2xl relative overflow-hidden space-y-10 sm:space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-black uppercase tracking-wider shadow-md shadow-accent/25 text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">100% Free Forever</span>
              <span className="hidden sm:inline">100% Free Forever • No Sign-Up Required</span>
            </div>
            <h2 className="text-2xl sm:text-5xl font-black tracking-tight text-neutral-text leading-tight">
              Current Available Free Tools
            </h2>
            <p className="text-sm sm:text-lg font-medium text-neutral-muted">
              Click any tool below to launch and use immediately. We built these mission-critical calculators so you can streamline daily pricing and billing right now without entering a credit card or creating an account.
            </p>
          </div>

          {/* 3-Column Free Tool Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            {/* Tool Card 1: MRP Calculator */}
            <div className="rounded-2xl bg-white p-5 sm:p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-primary transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5 relative z-10">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="p-3.5 rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
                    <Calculator className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-text group-hover:text-primary transition-colors">
                    Dual-Mode MRP Calculator
                  </h3>
                  <p className="text-sm font-medium text-neutral-muted mt-2 leading-relaxed">
                    Stop confusing markup with margin. Instantly reverse-engineer wholesale cuts, retailer margins, VAT taxes, and landed production costs.
                  </p>
                </div>
                <ul className="space-y-2.5 pt-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Forward markup & backward margin modes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Instant real-time profit split breakdown</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Zero registration needed</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 relative z-10">
                <Link
                  href="/mrp-calculator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-all group-hover:translate-x-1"
                >
                  <span>Click to Use Calculator</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Tool Card 2: Invoice Generator */}
            <div className="rounded-2xl bg-white p-5 sm:p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-indigo-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5 relative z-10">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
                    <FileText className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    Instant PDF
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-text group-hover:text-indigo-600 transition-colors">
                    No-Login Invoice Generator
                  </h3>
                  <p className="text-sm font-medium text-neutral-muted mt-2 leading-relaxed">
                    Create, preview, and download professional branded PDF invoices with GST/VAT calculations instantly. No password required.
                  </p>
                </div>
                <ul className="space-y-2.5 pt-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Instant clean PDF file download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Custom logo & tax rate support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Shareable WhatsApp billing links</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 relative z-10">
                <Link
                  href="/invoice-generator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all group-hover:translate-x-1"
                >
                  <span>Click to Use Invoice Maker</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Tool Card 3: Barcode Maker */}
            <div className="rounded-2xl bg-white p-5 sm:p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-purple-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5 relative z-10">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
                    <Tag className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    Printer Ready
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-text group-hover:text-purple-600 transition-colors">
                    SKU & Barcode Generator
                  </h3>
                  <p className="text-sm font-medium text-neutral-muted mt-2 leading-relaxed">
                    Generate standardized retail product SKUs, Code 128 barcodes, EAN13 retail barcodes, and high-resolution QR stickers.
                  </p>
                </div>
                <ul className="space-y-2.5 pt-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Thermal printer & packaging ready</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Code 128, EAN13 & UPC formats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>High-res PNG & SVG export</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 relative z-10">
                <Link
                  href="/barcode-generator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-md hover:bg-purple-700 transition-all group-hover:translate-x-1"
                >
                  <span>Click to Use Barcode Maker</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            {/* Tool Card 4: Payslip Generator */}
            <div className="rounded-2xl bg-white p-5 sm:p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-teal-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5 relative z-10">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="p-3.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/25">
                    <DollarSign className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    New
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-text group-hover:text-teal-600 transition-colors">
                    Payslip & Salary Stub Maker
                  </h3>
                  <p className="text-sm font-medium text-neutral-muted mt-2 leading-relaxed">
                    Generate professional PDF payslips with dynamic earnings, deductions, and net pay calculations for bank loans, visas, or records.
                  </p>
                </div>
                <ul className="space-y-2.5 pt-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Instant A4 PDF salary slip download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Dynamic earnings & deductions rows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Multi-currency & amount in words</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 relative z-10">
                <Link
                  href="/payslip-generator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-md hover:bg-teal-700 transition-all group-hover:translate-x-1"
                >
                  <span>Click to Use Payslip Maker</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMING SOON TOOLS & ENTERPRISE SOFTWARE SECTION (#coming-soon) */}
      <section id="coming-soon" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-28">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-indigo-300 text-xs font-black uppercase tracking-widest border border-slate-800">
            <Clock className="h-3.5 w-3.5 text-accent animate-pulse" />
            <span>Software Roadmap & Future Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
            Coming Soon Tools & Enterprise Software
          </h2>
          <p className="text-lg font-medium text-neutral-muted max-w-3xl mx-auto">
            Below current free utilities, we are engineering high-demand cloud OS software modules. These enterprise tools will transform how you manage retail inventory, cashier POS counters, and customer relationships.
          </p>
        </div>

        {/* ULTIMATE BLURRED ERP DASHBOARD MOCKUP WITH COMING SOON OVERLAY */}
        <div className="relative max-w-5xl mx-auto px-1 sm:px-0 mb-16 sm:mb-20">
          {/* Gradient Outer Glow Frame */}
          <div className="p-1 sm:p-2 rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-slate-300 via-slate-200/60 to-slate-300 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
            {/* Browser Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 rounded-t-[24px] sm:rounded-t-[30px] border-b border-slate-800 text-xs text-slate-400 font-semibold select-none">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity" />
                <div className="h-3 w-3 rounded-full bg-amber-500 hover:opacity-80 transition-opacity" />
                <div className="h-3 w-3 rounded-full bg-emerald-500 hover:opacity-80 transition-opacity" />
              </div>
              
              <div className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 text-xs shadow-inner transition-colors">
                <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono tracking-tight text-[11px] sm:text-xs text-slate-200">app.zynveo.com/enterprise</span>
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/50">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="hidden xs:inline">Live Cloud OS</span>
                <span className="xs:hidden">Live</span>
              </div>
            </div>

            {/* Underlying Dashboard UI Content (Blurred behind the glass overlay) */}
            <div className="bg-slate-50 p-4 sm:p-8 rounded-b-[24px] sm:rounded-b-[30px] text-left space-y-4 sm:space-y-6 filter blur-[6px] sm:blur-[8px] opacity-80 select-none pointer-events-none transform scale-[0.99] transition-all h-[420px] sm:h-[480px] md:h-[540px] overflow-hidden relative">
              {/* Dashboard Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100/80">
                <div>
                  <h3 className="text-base sm:text-2xl font-black text-slate-800">Welcome back, Enterprise Administrator!</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-1">Synced across 50 active multi-branch retail locations</p>
                </div>
                <div className="hidden md:flex gap-2">
                  <span className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm">Enterprise V2</span>
                  <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">POS Terminal Active</span>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {["New Invoice", "Add Customer", "Record Payment", "Add GRN Stock", "View Reports"].map((action, i) => (
                  <div key={i} className={`bg-white p-3 sm:p-4 rounded-xl border border-slate-100 text-center shadow-sm space-y-1 sm:space-y-2 ${i >= 3 ? 'hidden sm:block' : ''}`}>
                    <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-indigo-50 text-primary mx-auto flex items-center justify-center font-black text-sm sm:text-base">+</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-700">{action}</div>
                  </div>
                ))}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1 sm:space-y-2 border-l-4 border-l-primary">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Today's Revenue</div>
                  <div className="text-base sm:text-2xl font-black text-slate-800">Rs. 1,450,800</div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-500 font-bold">↑ 18.4% vs yesterday</div>
                </div>
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1 sm:space-y-2 border-l-4 border-l-amber-500">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Total Customers</div>
                  <div className="text-base sm:text-2xl font-black text-slate-800">14,280</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold">Active trade accounts</div>
                </div>
                <div className="hidden sm:block bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 border-l-4 border-l-blue-500">
                  <div className="text-[10px] font-black uppercase text-slate-400">Warehouse Stock</div>
                  <div className="text-2xl font-black text-slate-800">98.4%</div>
                  <div className="text-[10px] text-blue-500 font-bold">Optimal turnover rate</div>
                </div>
                <div className="hidden sm:block bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 border-l-4 border-l-emerald-500">
                  <div className="text-[10px] font-black uppercase text-slate-400">Net Profit Margin</div>
                  <div className="text-2xl font-black text-slate-800">28.4%</div>
                  <div className="text-[10px] text-emerald-500 font-bold">Verified shelf margin</div>
                </div>
              </div>

              {/* Charts Placeholder Row */}
              <div className="hidden md:grid grid-cols-2 gap-4">
                <div className="h-44 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-end">
                  <div className="flex items-end gap-3 h-24">
                    <div className="w-1/6 bg-primary/20 h-1/2 rounded-t" />
                    <div className="w-1/6 bg-primary/40 h-3/4 rounded-t" />
                    <div className="w-1/6 bg-primary h-full rounded-t" />
                    <div className="w-1/6 bg-primary/60 h-4/5 rounded-t" />
                    <div className="w-1/6 bg-accent h-full rounded-t" />
                    <div className="w-1/6 bg-indigo-600 h-2/3 rounded-t" />
                  </div>
                </div>
                <div className="h-44 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-end">
                  <div className="h-24 w-full bg-gradient-to-tr from-emerald-500/20 to-primary/20 rounded-xl border border-emerald-500/30" />
                </div>
              </div>
            </div>

            {/* BEST UI/UX MODERN GLASS OVERLAY BADGE */}
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-6 bg-slate-950/45 backdrop-blur-[5px]">
              <div className="max-w-xl w-full p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-slate-950/90 border border-white/20 shadow-[0_0_80px_-15px_rgba(79,46,229,0.5)] text-center space-y-5 sm:space-y-6 text-white backdrop-blur-2xl relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
                {/* Subtle top shimmer glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
                
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-primary/30 via-indigo-500/30 to-accent/30 border border-white/15 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Sparkles className="h-3.5 w-3.5 text-accent animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Next-Gen Cloud OS Launching Soon</span>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-sm">
                    COMING SOON
                  </h3>
                  <p className="text-xs sm:text-base text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
                    Our enterprise ERP, AI margin analytics, and multi-branch POS platform is launching soon. Meanwhile, enjoy our <strong className="text-accent font-bold underline decoration-2 underline-offset-2">100% Free Viral Utility Suite</strong> above!
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="#free-tools"
                    className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-accent via-orange-500 to-amber-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/50 hover:scale-105 transition-all duration-200 active:scale-95"
                  >
                    <span>Use Free Tools Above</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#coming-soon"
                    className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center transition-all border border-white/15 active:scale-95"
                  >
                    <span>Explore Software Roadmap</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Layers,
              title: "Enterprise ERP Suite",
              desc: "Full-scale cloud enterprise resource planning to unify procurement, multi-currency accounting, and warehouse stock rotation.",
              badge: "Coming Q3 2026",
              color: "text-indigo-600 bg-indigo-50 border-indigo-200"
            },
            {
              icon: ShoppingBag,
              title: "Smart Retail POS System",
              desc: "Countertop barcode scanning terminal with offline transaction caching, thermal receipt printing, and live stock decrement.",
              badge: "High Demand",
              color: "text-emerald-600 bg-emerald-50 border-emerald-200"
            },
            {
              icon: Users,
              title: "CRM & Loyalty Manager",
              desc: "Track repeat retail buyer purchase history, issue automated WhatsApp discount vouchers, and analyze customer lifetime value.",
              badge: "Coming Soon",
              color: "text-purple-600 bg-purple-50 border-purple-200"
            },
            {
              icon: Database,
              title: "AI Inventory Management Tool",
              desc: "Predictive demand forecasting that alerts you before best-selling SKU items go out of stock during peak holiday shopping seasons.",
              badge: "AI Powered",
              color: "text-blue-600 bg-blue-50 border-blue-200"
            },
            {
              icon: DollarSign,
              title: "Automated Payroll & Staff Billing",
              desc: "Manage sales commission structures, cashier shift hours, and automated monthly salary slips compliant with local labor laws.",
              badge: "In Development",
              color: "text-amber-600 bg-amber-50 border-amber-200"
            },
            {
              icon: Truck,
              title: "Multi-Warehouse Stock Dispatcher",
              desc: "Orchestrate inter-branch stock transfers, generate delivery challans, and track dispatch fleet drivers in real time.",
              badge: "Coming Q4 2026",
              color: "text-rose-600 bg-rose-50 border-rose-200"
            },
          ].map((tool, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-8 rounded-2xl glass-panel border border-neutral-border hover:border-primary/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-xl space-y-6 relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-800 group-hover:bg-primary group-hover:text-white transition-colors">
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${tool.color}`}>
                    {tool.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-neutral-text">{tool.title}</h3>
                <p className="text-sm font-medium text-neutral-muted leading-relaxed">{tool.desc}</p>
              </div>
              <div className="pt-4 border-t border-neutral-border/60 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-muted">Early Access Perks</span>
                <Link href="/contact" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1">
                  <span>Join Priority Waitlist</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FINANCIAL ACCURACY & SECURITY SECTION */}
      <section className="bg-gradient-to-br from-primary-dark via-primary to-slate-900 text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden z-10">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-black tracking-widest text-accent bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>The Financial Accuracy Guarantee</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Stop Leaking Profits to Margin Errors
            </h2>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed">
              Confusing markup with margin drains millions from FMCG businesses every year. Zynveo embeds strict reverse-margin calculations directly into your daily invoices and stock pricing workflows.
            </p>
            <ul className="space-y-3.5 pt-2 text-indigo-100 font-semibold text-sm sm:text-base">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                <span>Automated multi-tier margin waterfalls</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                <span>Supabase kernel-level Row Level Security (RLS)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                <span>Instant branch profitability reconciliation</span>
              </li>
            </ul>
          </div>

          <div className="p-5 sm:p-10 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-6 backdrop-blur-xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white">
                Live Shelf Price Decomposition
              </h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Validated Math
              </span>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              Supermarkets calculate margin backward from the shelf price (MRP). See how Zynveo protects your true brand retention:
            </p>
            <div className="space-y-5 text-xs font-bold">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Landed Production Cost</span>
                  <span className="text-white font-black">Rs. 500.00 (47%)</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div className="h-full rounded-full bg-indigo-500 w-[47%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Net Brand Retention Cut</span>
                  <span className="text-emerald-400 font-black">Rs. 125.00 (12%)</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div className="h-full rounded-full bg-emerald-400 w-[12%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Retailer & Wholesaler Cut (28% on MRP)</span>
                  <span className="text-accent font-black">Rs. 300.92 (28%)</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div className="h-full rounded-full bg-accent w-[28%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Government VAT / Tax</span>
                  <span className="text-amber-400 font-black">Rs. 138.89 (13%)</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div className="h-full rounded-full bg-amber-400 w-[13%]" />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/mrp-calculator"
                className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-gradient-to-r from-accent to-orange-600 text-white font-extrabold text-sm shadow-lg shadow-accent/25 hover:shadow-xl hover:scale-[1.01] transition-all"
              >
                Test Your Product Math Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-28">
        <div className="text-center space-y-4 mb-16">
          <div className="text-xs font-black uppercase tracking-widest text-primary">
            Transparent Scaling
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
            Simple, Transparent Plans
          </h2>
          <p className="text-lg font-medium text-neutral-muted max-w-xl mx-auto">
            Start with our free viral utilities forever. Upgrade to cloud ERP modules only as your branch network expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {[
            {
              name: "Starter Utility Tier",
              price: "Free",
              period: "forever",
              desc: "Perfect for sole traders and early consumer product founders.",
              features: [
                "Viral MRP & Margin Calculator",
                "No-Login Invoice Generator",
                "SKU & Barcode Maker",
                "Payslip & Salary Slip Maker",
                "Zero Registration Needed"
              ],
              cta: "Launch Free Tools",
              href: "#free-tools",
              accent: false
            },
            {
              name: "Standard ERP",
              price: "Rs. 1,600",
              period: "/month",
              desc: "Most Popular for growing retail brands and multi-store distributors.",
              features: [
                "1 User + 10 Branch Locations",
                "Unlimited Invoices & Smart POS",
                "Automated Live Stock Sync",
                "WhatsApp & SMS Billing Alerts",
                "Priority Technical Support"
              ],
              cta: "Join Waitlist / Inquiry",
              href: "/contact",
              accent: true
            },
            {
              name: "Professional OS",
              price: "Rs. 2,400",
              period: "/month",
              desc: "Built for multi-branch powerhouses and regional wholesale chains.",
              features: [
                "5 Users + 50 Branch Locations",
                "Advanced Financial Accounting",
                "Offline Caching POS Mobile App",
                "Custom RLS Permissions",
                "24/7 Dedicated Account Manager"
              ],
              cta: "Contact Enterprise Sales",
              href: "/contact",
              accent: false
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-5 sm:p-8 flex flex-col justify-between border transition-all duration-300 ${
                plan.accent 
                  ? "bg-gradient-to-b from-primary to-indigo-950 text-white border-primary shadow-2xl md:-translate-y-4 relative" 
                  : "glass-panel border-neutral-border text-neutral-text hover:shadow-xl hover:border-primary/30"
              }`}
            >
              {plan.accent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-orange-500 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">{plan.price}</span>
                  <span className={`text-sm font-bold ${plan.accent ? "text-indigo-200" : "text-neutral-muted"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm font-medium leading-relaxed ${plan.accent ? "text-indigo-100" : "text-neutral-muted"}`}>
                  {plan.desc}
                </p>
                <div className={`pt-2 border-t ${plan.accent ? "border-indigo-800" : "border-neutral-border"}`} />
                <ul className="space-y-3.5 text-sm font-semibold">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 shrink-0 ${plan.accent ? "text-accent" : "text-primary"}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={plan.href}
                  className={`w-full min-h-[48px] flex items-center justify-center rounded-xl font-extrabold text-sm transition-all duration-200 active:scale-95 ${
                    plan.accent
                      ? "bg-gradient-to-r from-accent to-orange-600 text-white hover:shadow-lg hover:shadow-accent/40"
                      : "bg-primary text-white hover:bg-primary-hover shadow-md"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-4xl z-10 scroll-mt-28">
        <div className="text-center space-y-4 mb-16">
          <div className="text-xs font-black uppercase tracking-widest text-primary">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
            Frequently Asked Questions
          </h2>
          <p className="text-lg font-medium text-neutral-muted max-w-xl mx-auto">
            Everything you need to know about Zynveo, retail margin math, and our instant free tools.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "What is the difference between markup and retail margin?",
              a: "Markup is calculated as a percentage over your landed production cost, whereas retail margin is calculated backward as a percentage of the final retail shelf price (MRP). Confusing the two causes consumer brands to silently lose up to 15% in net profitability."
            },
            {
              q: "Do I need to create an account to generate invoices or barcodes?",
              a: "No! Zynveo provides viral free utility tools including our Dual-Mode MRP Calculator, No-Login Invoice Generator, and Printable Barcode Maker completely free without sign-ups or passwords."
            },
            {
              q: "Can Zynveo POS work offline during network outages?",
              a: "Yes, our mobile and tablet POS applications support offline caching. Transactions automatically sync to the central cloud database as soon as internet connectivity is restored."
            },
            {
              q: "How does Zynveo protect sensitive branch financial data?",
              a: "We utilize bank-grade encryption powered by Supabase Auth and Row Level Security (RLS). Strict kernel-level database rules ensure staff can only access data relevant to their assigned branches."
            }
          ].map((faq, idx) => (
            <div key={idx} className="p-4 sm:p-8 rounded-2xl glass-panel border border-neutral-border hover:border-primary/30 transition-colors space-y-3 shadow-sm">
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-text flex items-start gap-3">
                <span className="text-primary font-black shrink-0">Q.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-sm sm:text-base font-medium text-neutral-muted leading-relaxed pl-7">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
