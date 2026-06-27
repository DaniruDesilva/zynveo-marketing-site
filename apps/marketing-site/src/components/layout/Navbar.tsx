"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, Zap, FileText, Tag, Menu, X, Sparkles } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-neutral-border/80 shadow-sm transition-all">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group focus:outline-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-accent text-white shadow-md shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-neutral-text leading-none">
              Sync<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">tra</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-neutral-muted mt-0.5">
              Cloud OS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <Link
            href="/#free-tools"
            className="flex items-center gap-2 text-sm font-extrabold text-primary bg-primary/10 hover:bg-primary hover:text-white px-4 py-2.5 rounded-full transition-all duration-200 group mr-2"
          >
            <Sparkles className="h-4 w-4 text-accent group-hover:text-white transition-colors animate-spin" style={{ animationDuration: '8s' }} />
            <span>Free Viral Suite</span>
            <span className="rounded-full bg-accent text-white text-[9px] font-black uppercase px-1.5 py-0.5 ml-0.5">100% Free</span>
          </Link>

          <Link
            href="/#features"
            className="text-sm font-bold text-neutral-text hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-slate-100/80"
          >
            ERP Modules
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-bold text-neutral-text hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-slate-100/80"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="text-sm font-bold text-neutral-text hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-slate-100/80"
          >
            Insights
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/#contact"
            className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-sm font-bold text-neutral-text hover:bg-slate-100/80 hover:text-primary transition-colors"
          >
            Talk to Sales
          </Link>
          <Link
            href="/#free-tools"
            className="inline-flex items-center justify-center min-h-[48px] rounded-xl bg-gradient-to-r from-accent to-orange-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            <span>Launch Free Utilities</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          {/* Accessible Mobile Hamburger Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-neutral-border bg-white/95 backdrop-blur-2xl px-4 py-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Section 1: Instant Free Utilities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Free Instant Utilities (No Login)</span>
            </div>

            <nav className="flex flex-col space-y-2.5 font-bold text-slate-800">
              <Link
                href="/mrp-calculator"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between min-h-[56px] p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-indigo-50/50 text-primary border border-primary/20 active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-primary text-white shadow-sm">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-black leading-tight">MRP & Margin Calculator</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">Reverse-engineer shelf prices</div>
                  </div>
                </div>
                <span className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  Viral
                </span>
              </Link>

              <Link
                href="/invoice-generator"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between min-h-[56px] p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50/50 text-indigo-700 border border-indigo-100 active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-black leading-tight">No-Login Invoice Maker</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">Instant PDF billing link</div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  Free
                </span>
              </Link>

              <Link
                href="/barcode-generator"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between min-h-[56px] p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50/50 text-purple-700 border border-purple-100 active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-black leading-tight">SKU & Barcode Generator</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">Thermal sticker ready</div>
                  </div>
                </div>
                <span className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  New
                </span>
              </Link>
            </nav>
          </div>

          {/* Section 2: Enterprise Platform */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="px-1 text-xs font-black uppercase tracking-widest text-slate-400">
              Platform & Company
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/#features"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center min-h-[48px] p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-sm text-center"
              >
                ERP Modules
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center min-h-[48px] p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-sm text-center"
              >
                Pricing Plans
              </Link>
              <Link
                href="/blog"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center min-h-[48px] p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-sm text-center"
              >
                Insights Blog
              </Link>
              <Link
                href="/#contact"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center min-h-[48px] p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-sm text-center"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
