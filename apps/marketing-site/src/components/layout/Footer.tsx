import React from "react";
import Link from "next/link";
import { Zap, Mail, Phone, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import { NewsletterSection } from "@/components/sections/NewsletterSection";

export function Footer() {
  return (
    <footer className="bg-primary-dark text-slate-300 border-t border-primary/20 relative overflow-hidden">
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg group-hover:scale-105 transition-transform duration-200">
                <img src="/logo.png" alt="Zynveo Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Zyn<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">veo</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering fast-growing FMCG brands, wholesalers, and retail SMEs with cloud ERP operating systems, real-time POS, and instant zero-login pricing utilities.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All systems operational</span>
              </span>
            </div>
          </div>

          {/* Viral Free Tools (Highlighted Column) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-primary/15 to-transparent border border-primary/30 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-accent uppercase tracking-wider">
              <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Free Instant Utilities</span>
            </div>
            <ul className="space-y-3 text-sm font-semibold">
              <li>
                <Link
                  href="/mrp-calculator"
                  className="group flex items-center justify-between text-white hover:text-accent transition-colors py-1"
                >
                  <span className="flex items-center gap-1">
                    <span>MRP & Margin Calculator</span>
                  </span>
                  <span className="rounded bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 text-[9px] font-black uppercase">
                    Viral
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/invoice-generator"
                  className="group flex items-center justify-between text-slate-300 hover:text-white transition-colors py-1"
                >
                  <span>No-Login Invoice Maker</span>
                  <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase">
                    Free
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/barcode-generator"
                  className="group flex items-center justify-between text-slate-300 hover:text-white transition-colors py-1"
                >
                  <span>SKU & Barcode Maker</span>
                  <span className="rounded bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 text-[9px] font-black uppercase">
                    New
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/payslip-generator"
                  className="group flex items-center justify-between text-slate-300 hover:text-white transition-colors py-1"
                >
                  <span>Payslip & Salary Slip Maker</span>
                  <span className="rounded bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 text-[9px] font-black uppercase">
                    New
                  </span>
                </Link>
              </li>
              <li className="pt-2 border-t border-primary/20">
                <Link
                  href="/#free-tools"
                  className="text-xs text-primary-light hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Explore all utility tools</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Platform Links */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-3 text-sm font-medium text-slate-400">
              <li>
                <Link href="/#free-tools" className="hover:text-white transition-colors block py-1">
                  Free Viral Suite
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors block py-1">
                  Premium Tools (Coming Soon)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors block py-1">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors block py-1">
                  Insights & Blogs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors block py-1">
                  Contact Support & Sales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-3 text-sm text-slate-400 font-medium">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-accent shrink-0 mt-1" />
                <a href="mailto:hello@zynveo.com" className="hover:text-white transition-colors">
                  hello@zynveo.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-accent shrink-0 mt-1" />
                <a href="tel:+94723758191" className="hover:text-white transition-colors">
                  +94 72 375 8191
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-1" />
                <span>Zynveo Technologies, Galle, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription Bar */}
        <NewsletterSection />

        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-xs text-slate-500 font-medium text-center sm:text-left">
          <p>© 2026 Zynveo Technologies. All rights reserved.</p>
          <div className="flex flex-wrap gap-3 sm:gap-6 justify-center">
            <Link href="/llms.txt" className="hover:text-slate-300 transition-colors">AI Index (llms.txt)</Link>
            <Link href="/sitemap.xml" className="hover:text-slate-300 transition-colors">Sitemap</Link>
            <Link href="/legal" className="hover:text-slate-300 transition-colors">Legal Policy</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
