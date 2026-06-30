"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Gift, ArrowRight, AlertCircle } from "lucide-react";

export function WishlistSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl z-10 scroll-mt-28">
      <div className="relative rounded-3xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-indigo-700 to-indigo-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/30 rounded-full blur-[80px]" />

        <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6 text-white text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-widest backdrop-blur-sm">
                <Gift className="h-3.5 w-3.5 text-accent" />
                <span>Exclusive Early Access</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Join The VIP
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-orange-400 to-amber-300">
                  Launch Waitlist
                </span>
              </h2>

              <p className="text-base sm:text-lg text-indigo-100 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                Be the first to access the Zynveo Cloud OS when it launches. VIP waitlist members receive an exclusive <strong className="text-white font-extrabold">30% lifetime discount</strong> on all premium plans.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm font-bold text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  30% Launch Discount
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Beta Early Access
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Priority Support
                </span>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              {submitted ? (
                <div className="p-8 sm:p-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center space-y-5 text-white animate-in fade-in zoom-in-95 duration-300">
                  <div className="h-16 w-16 bg-emerald-400/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black">You're On The List! 🎉</h3>
                  <p className="text-indigo-100 font-medium max-w-sm mx-auto">
                    Check your email for your <strong className="text-accent font-bold">30% discount confirmation</strong>. We'll notify you the moment Zynveo Cloud OS launches.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 sm:p-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 space-y-5">
                  <h3 className="text-xl font-black text-white text-center sm:text-left">
                    Reserve Your <span className="text-accent">30% Discount</span>
                  </h3>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <input
                      required
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300/60 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent backdrop-blur-sm"
                    />
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300/60 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent backdrop-blur-sm"
                    />
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone / WhatsApp Number"
                      className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300/60 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent backdrop-blur-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-accent via-orange-500 to-amber-600 text-white font-extrabold text-base shadow-xl shadow-accent/30 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Joining Waitlist...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Join VIP Waitlist — Get 30% Off</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-indigo-300/60 font-medium">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
