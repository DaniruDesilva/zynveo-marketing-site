import React from "react";
import Link from "next/link";
import { Shield, Zap, TrendingUp, Users, Heart, Globe, Award, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Synctra | Modern Cloud OS & FMCG Pricing Suite",
  description:
    "Learn about Synctra Technologies, our mission to democratize enterprise ERP tools, and our roots in Galle, Sri Lanka empowering over 25,000 retail brands globally.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Synctra | Empowering Global Retail & FMCG Brands",
    description: "Discover why 25,000+ growing consumer brands rely on Synctra Cloud OS and our free viral pricing calculators.",
    url: "https://synctrahq.com/about",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    mainEntity: {
      "@type": "Organization",
      name: "Synctra Technologies (Pvt) Ltd",
      foundingDate: "2024",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Galle",
        addressCountry: "Sri Lanka",
      },
      description:
        "Synctra builds cloud-native ERP operating systems, real-time POS scanning solutions, and instant zero-login pricing utilities for consumer brands and wholesalers.",
      numberOfEmployees: {
        "@type": "QuantitativeValue",
        value: "25",
      },
      url: "https://synctrahq.com",
    },
  };

  return (
    <div className="flex flex-col gap-24 pb-24 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Ambient background glow */}
      <div className="glow-blob w-[500px] h-[500px] bg-primary/10 top-12 left-1/2 -translate-x-1/2" />

      {/* 1. Hero Section */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
          <Globe className="h-3.5 w-3.5" />
          <span>Engineered in Sri Lanka • Trusted Worldwide</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-text leading-[1.12]">
          Democratizing Enterprise <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-accent">
            Retail & Pricing Power
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-lg sm:text-xl font-medium text-neutral-muted leading-relaxed">
          For decades, multi-branch ERP software was locked behind expensive contracts and clunky local servers. Synctra is changing the narrative by combining million-dollar cloud automation with viral zero-login utilities.
        </p>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8 max-w-4xl mx-auto">
          {[
            { label: "Active Retail Brands", val: "25,000+", icon: Users, color: "text-primary" },
            { label: "Annual GMV Synced", val: "$10M+", icon: TrendingUp, color: "text-emerald-500" },
            { label: "System Uptime SLA", val: "99.9%", icon: Shield, color: "text-blue-500" },
            { label: "Free Utility Access", val: "100%", icon: Sparkles, color: "text-accent" },
          ].map((stat, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-panel border border-neutral-border shadow-sm text-center space-y-2 hover:border-primary/30 transition-all">
              <stat.icon className={`h-6 w-6 mx-auto ${stat.color}`} />
              <div className="text-2xl sm:text-3xl font-black text-neutral-text">{stat.val}</div>
              <div className="text-xs font-bold text-neutral-muted uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Our Mission & Story */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl z-10">
        <div className="p-8 sm:p-14 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden space-y-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="space-y-4 max-w-3xl relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-accent">The Synctra Story</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Solving the Silent Margin Crisis in Consumer Goods
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
              When working with growing FMCG founders across Sri Lanka and South Asia, our engineering team observed a devastating trend: businesses were going bankrupt despite recording record sales volumes.
            </p>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
              The culprit was flawed product pricing math. Founders were calculating wholesaler cuts forward as a markup over cost, while supermarket chains calculated margins backward from shelf MRP prices. This mismatch silently erased up to 15% of brand net profit.
            </p>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
              We built Synctra to eradicate this error forever. Today, our free utility suite allows anyone to reverse-engineer exact shelf pricing instantly, while our enterprise cloud OS connects retail counters directly to warehouse ledgers.
            </p>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 border-t border-slate-800">
            <div className="space-y-1">
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Zero Data Silos</span>
              </div>
              <p className="text-xs text-slate-400">Stock updates instantly when POS receipts are printed.</p>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Kernel-Level RLS</span>
              </div>
              <p className="text-xs text-slate-400">Bank-grade Supabase security isolating multi-branch data.</p>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Offline Caching</span>
              </div>
              <p className="text-xs text-slate-400">Retail checkout never stops during internet outages.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Values Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl z-10">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-primary">Our Philosophy</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
            Core Principles That Drive Us
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: Zap,
              title: "Frictionless Utility First",
              desc: "We believe essential tools like invoice makers and MRP calculators should be free, instant, and accessible without login barriers.",
              color: "text-primary bg-primary/10"
            },
            {
              icon: Shield,
              title: "Uncompromising Security",
              desc: "We enforce strict row-level security policies at the database kernel level so your branch financial data is never exposed.",
              color: "text-emerald-600 bg-emerald-50"
            },
            {
              icon: Award,
              title: "Precision Mathematical Accuracy",
              desc: "We embed automated multi-tier margin waterfalls into every tool so you never lose a cent to tax or markup miscalculations.",
              color: "text-accent bg-accent/10"
            },
            {
              icon: Heart,
              title: "Relentless Customer Obsession",
              desc: "From sole proprietor boutiques in Galle to multi-warehouse distributors across Asia, we build software tuned to real daily operations.",
              color: "text-purple-600 bg-purple-50"
            },
          ].map((val, i) => (
            <div key={i} className="p-8 rounded-2xl glass-panel border border-neutral-border space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`p-3.5 rounded-2xl w-fit ${val.color}`}>
                <val.icon className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black text-neutral-text">{val.title}</h3>
              <p className="text-sm font-medium text-neutral-muted leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Call to Action */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl z-10">
        <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-primary to-indigo-900 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Experience Synctra?
          </h2>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto font-medium">
            Launch our instant free utility tools right now or get in touch with our enterprise engineering team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/#free-tools"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white font-extrabold text-sm shadow-lg hover:scale-105 transition-all"
            >
              Launch Free Utilities
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2"
            >
              <span>Contact Sales Team</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
