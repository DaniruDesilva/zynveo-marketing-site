import React from "react";
import Link from "next/link";
import { 
  ArrowRight, CheckCircle2, Zap, Shield, TrendingUp, Layers, 
  Calculator, FileText, ShoppingBag, PieChart, Users, Star, Tag, Sparkles, Lock, Clock, ArrowUpRight
} from "lucide-react";

export default function MarketingHomepage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Synctra ERP & POS",
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
            name: "Do I need to create an account to generate invoices or barcodes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No! Synctra provides viral free utility tools including our MRP Calculator, No-Login Invoice Generator, and Barcode Maker completely free without sign-ups or passwords.",
            },
          },
          {
            "@type": "Question",
            name: "Can Synctra POS work offline during network outages?",
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

      {/* 1. Hero Section */}
      <section className="relative pt-12 md:pt-20 lg:pt-28 px-4 sm:px-6 lg:px-8 hero-gradient z-10">
        <div className="container mx-auto max-w-5xl text-center space-y-8 sm:space-y-10">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-xl ring-1 ring-white/20 hover:scale-105 transition-all duration-300 cursor-default">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-200 tracking-wide">
              Trusted by <strong className="text-white font-extrabold underline decoration-accent decoration-2 underline-offset-4">25,000+</strong> Fast-Growing FMCG & Retail Brands
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-text leading-[1.08]">
            Scale Your Operations Without <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-accent">
              The Enterprise Price Tag
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl font-medium text-neutral-muted leading-relaxed">
            The all-in-one cloud OS for inventory, POS scanning, and instant pricing math. Plus, access our high-converting utility calculators <span className="text-neutral-text font-bold underline decoration-accent decoration-2">completely free without signing up</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="#free-tools"
              className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-orange-600 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/50 hover:-translate-y-1 transition-all duration-200 active:scale-95"
            >
              <Sparkles className="mr-2 h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Launch Free Utility Suite</span>
            </Link>
            <Link
              href="#contact"
              className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center rounded-2xl glass-panel px-8 py-4 text-base font-bold text-neutral-text hover:border-primary hover:text-primary hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              <span>Talk to Enterprise Sales</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Elevated Interactive Dashboard Preview Mockup */}
          <div className="pt-8 sm:pt-14 relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary via-indigo-500 to-accent opacity-30 blur-xl pointer-events-none" />
            <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-primary/30 via-slate-200/50 to-white/80 shadow-2xl border border-white/80">
              <div className="rounded-2xl bg-slate-950 p-6 sm:p-10 border border-slate-800 text-left grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner">
                {/* Metric Card 1 */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white space-y-4 shadow-xl border border-indigo-500/30 hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-center text-indigo-200 text-xs uppercase font-black tracking-wider">
                    <span>Active Revenue (Monthly)</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight">Rs. 4,850,200</div>
                  <div className="text-xs text-indigo-100 flex items-center gap-1.5 font-semibold bg-white/10 w-fit px-2.5 py-1 rounded-full">
                    <span className="text-emerald-300 font-bold">↑ 24.8%</span> vs last month
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-black tracking-wider">
                    <span>True FMCG Shelf Margin</span>
                    <PieChart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">28.4%</div>
                  <div className="text-xs text-slate-400 font-medium">Calculated backward from MRP</div>
                </div>

                {/* Metric Card 3 */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-center text-slate-400 text-xs uppercase font-black tracking-wider">
                    <span>Instant Invoices</span>
                    <FileText className="h-4 w-4 text-accent" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">14 Active</div>
                  <div className="text-xs text-accent font-bold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                    <span>No-login payment links synced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEDICATED FREE VIRAL UTILITY SUITE SECTION (No Sign-up Required) */}
      <section id="free-tools" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-24">
        <div className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-br from-primary/10 via-indigo-50/50 to-orange-50/50 border-2 border-primary/30 shadow-2xl relative overflow-hidden space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent text-white text-xs font-black uppercase tracking-widest shadow-md shadow-accent/25">
              <Sparkles className="h-3.5 w-3.5" />
              <span>100% Free • No Sign-Up Required</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text leading-tight">
              Instant Viral Utility Suite
            </h2>
            <p className="text-base sm:text-lg font-medium text-neutral-muted">
              We built these mission-critical utility calculators so you can streamline daily pricing and billing immediately without creating an account or entering a credit card.
            </p>
          </div>

          {/* 3-Column Free Tool Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tool Card 1: MRP Calculator */}
            <div className="rounded-2xl bg-white p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-primary transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="p-3.5 rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
                    <Calculator className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-black uppercase tracking-wider">
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
              <div className="pt-8">
                <Link
                  href="/mrp-calculator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-all group-hover:translate-x-1"
                >
                  <span>Launch MRP Calculator</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Tool Card 2: Invoice Generator */}
            <div className="rounded-2xl bg-white p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-indigo-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
                    <FileText className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider">
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
              <div className="pt-8">
                <Link
                  href="/invoice-generator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all group-hover:translate-x-1"
                >
                  <span>Create Free Invoice</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Tool Card 3: Barcode Maker */}
            <div className="rounded-2xl bg-white p-8 border border-neutral-border shadow-lg hover:shadow-2xl hover:border-purple-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
                    <Tag className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    Printer Ready
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-text group-hover:text-purple-600 transition-colors">
                    SKU & Barcode Maker
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
              <div className="pt-8">
                <Link
                  href="/barcode-generator"
                  className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-md hover:bg-purple-700 transition-all group-hover:translate-x-1"
                >
                  <span>Generate Barcode Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Enterprise ERP & POS Modules Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-24">
        <div className="text-center space-y-4 mb-16">
          <div className="text-xs font-black uppercase tracking-widest text-primary">
            Full-Scale Operating System
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
            Enterprise Modules for Scaling Brands
          </h2>
          <p className="text-lg font-medium text-neutral-muted max-w-2xl mx-auto">
            When you're ready to connect your retail counters directly to your central warehouse, unlock our cloud-native automation modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: ShoppingBag,
              title: "Integrated Smart POS",
              desc: "Lightning-fast point of sale for retail stores with automated barcode scanning, offline caching, and instant drawer synchronization.",
              badge: "Counter Ready",
              color: "text-blue-600 bg-blue-50 border-blue-200"
            },
            {
              icon: Layers,
              title: "Multi-Branch Inventory",
              desc: "Track live stock across distributed warehouses, set automated shelf reorder triggers, and manage batch expiry dates seamlessly.",
              badge: "Real-time Sync",
              color: "text-emerald-600 bg-emerald-50 border-emerald-200"
            },
            {
              icon: PieChart,
              title: "AI Margin Analytics",
              desc: "Continuous financial monitoring that reverse-engineers landed costs across your distributor network to uncover hidden margin leaks.",
              badge: "AI Powered",
              color: "text-orange-600 bg-orange-50 border-orange-200"
            },
          ].map((mod, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl glass-panel border border-neutral-border hover:border-primary/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-xl space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
                    <mod.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${mod.color}`}>
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-neutral-text">{mod.title}</h3>
                <p className="text-sm font-medium text-neutral-muted leading-relaxed">{mod.desc}</p>
              </div>
              <div className="pt-4 border-t border-neutral-border/60 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-muted">Included in Standard & Pro</span>
                <Link href="#pricing" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1">
                  <span>See Plans</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Growth Engine Financial Waterfall Section */}
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
              Confusing markup with margin drains millions from FMCG businesses every year. Synctra embeds strict reverse-margin calculations directly into your daily invoices and stock pricing workflows.
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

          <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-6 backdrop-blur-xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white">
                Live Shelf Price Decomposition
              </h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Validated Math
              </span>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              Supermarkets calculate margin backward from the shelf price (MRP). See how Synctra protects your true brand retention:
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

      {/* 5. Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-24">
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
              name: "Starter",
              price: "Free",
              period: "forever",
              desc: "Perfect for sole traders and early consumer product founders.",
              features: [
                "Viral MRP & Margin Calculator",
                "No-Login Invoice Generator",
                "SKU & Barcode Maker",
                "Up to 50 Stored Records /mo"
              ],
              cta: "Launch Free Tools",
              href: "#free-tools",
              accent: false
            },
            {
              name: "Standard",
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
              cta: "Start 14-Day Free Trial",
              href: "#contact",
              accent: true
            },
            {
              name: "Professional",
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
              cta: "Talk to Sales",
              href: "#contact",
              accent: false
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between border transition-all duration-300 ${
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

      {/* 6. Frequently Asked Questions Section (100% Preserved SEO/GEO) */}
      <section id="faq" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl z-10 scroll-mt-24">
        <div className="text-center space-y-4 mb-16">
          <div className="text-xs font-black uppercase tracking-widest text-primary">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
            Frequently Asked Questions
          </h2>
          <p className="text-lg font-medium text-neutral-muted max-w-xl mx-auto">
            Everything you need to know about Synctra, retail margin math, and our instant free tools.
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
              a: "No! Synctra provides viral free utility tools including our Dual-Mode MRP Calculator, No-Login Invoice Generator, and Printable Barcode Maker completely free without sign-ups or passwords."
            },
            {
              q: "Can Synctra POS work offline during network outages?",
              a: "Yes, our mobile and tablet POS applications support offline caching. Transactions automatically sync to the central cloud database as soon as internet connectivity is restored."
            },
            {
              q: "How does Synctra protect sensitive branch financial data?",
              a: "We utilize bank-grade encryption powered by Supabase Auth and Row Level Security (RLS). Strict kernel-level database rules ensure staff can only access data relevant to their assigned branches."
            }
          ].map((faq, idx) => (
            <div key={idx} className="p-6 sm:p-8 rounded-2xl glass-panel border border-neutral-border hover:border-primary/30 transition-colors space-y-3 shadow-sm">
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
