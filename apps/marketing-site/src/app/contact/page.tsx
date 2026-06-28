"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Sparkles, Clock, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    mainEntity: {
      "@type": "Organization",
      name: "Zynveo Technologies",
      telephone: "+94-72-375-8191",
      email: "hello@zynveo.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Tech Hub, Galle Road",
        addressLocality: "Galle",
        addressRegion: "Southern Province",
        addressCountry: "LK",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+94-72-375-8191",
        contactType: "sales and technical support",
        availableLanguage: ["English", "Sinhala"],
      },
    },
  };

  return (
    <div className="flex flex-col gap-24 pb-24 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Ambient glow */}
      <div className="glow-blob w-[500px] h-[500px] bg-primary/15 top-10 right-10" />

      {/* Hero Header */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-widest border border-accent/20">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>We respond within 2 hours</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-text">
          Let's Scale Your Retail & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-600 to-accent">
            Warehouse Operations
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg font-medium text-neutral-muted leading-relaxed">
          Have questions about our cloud ERP roadmap, custom enterprise pricing tiers, or need help with our free utilities? Send us a message below.
        </p>
      </section>

      {/* Contact Form & Info Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Channels & Office Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-3xl glass-panel border border-neutral-border shadow-lg space-y-8">
              <div>
                <h3 className="text-2xl font-black text-neutral-text">Direct Contact Channels</h3>
                <p className="text-sm font-medium text-neutral-muted mt-1">Reach our technical and sales team directly.</p>
              </div>

              <div className="space-y-6">
                <a
                  href="mailto:hello@zynveo.com"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm group"
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Sales & Support</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">hello@zynveo.com</div>
                    <div className="text-xs text-emerald-600 font-bold mt-1">24/7 Monitored Inbox</div>
                  </div>
                </a>

                <a
                  href="tel:+94723758191"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm group"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone & WhatsApp</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">+94 72 375 8191</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Mon-Sat • 9:00 AM - 6:00 PM IST</div>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global Headquarters</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">Galle, Sri Lanka</div>
                    <div className="text-xs text-slate-500 font-medium mt-1">Supporting clients across South Asia & Middle East</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-border flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Avg Response Time: &lt; 2 Hours</span>
                </span>
                <Link href="/#faq" className="text-primary hover:underline flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  <span>Read FAQ</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-neutral-border shadow-2xl relative overflow-hidden">
              {submitted ? (
                <div className="text-center py-16 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900">Message Received!</h3>
                    <p className="text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
                      Thank you for reaching out. One of our enterprise solutions engineers will review your inquiry and contact you shortly.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="px-8 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 border-b border-slate-100 pb-6">
                    <h3 className="text-2xl font-black text-slate-900">Send Us a Message</h3>
                    <p className="text-sm font-medium text-slate-500">Fill out the fields below and we'll connect you with the right specialist.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">Full Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Daniru De Silva"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">Work Email *</label>
                      <input
                        required
                        type="email"
                        placeholder="name@company.com"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">Phone / WhatsApp *</label>
                      <input
                        required
                        type="tel"
                        placeholder="+94 77 123 4567"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">Company / Brand Name</label>
                      <input
                        type="text"
                        placeholder="Zynveo Retailers"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">How Can We Help You? *</label>
                    <select
                      required
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm text-slate-800 bg-slate-50/50"
                    >
                      <option value="">Select a subject...</option>
                      <option value="enterprise">Enterprise Cloud ERP Inquiry</option>
                      <option value="pos">Smart Retail POS Demo</option>
                      <option value="tools">Free Utility Tools Support</option>
                      <option value="partnership">Wholesale Partnership</option>
                      <option value="other">General Question</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">Message Details *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about your number of branch locations, current billing setup, or question..."
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-accent text-white font-black text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Request...</span>
                      </span>
                    ) : (
                      <>
                        <span>Submit Enterprise Inquiry</span>
                        <Send className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
