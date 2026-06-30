"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function NewsletterSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  if (submitted) {
    return (
      <div className="pt-8 mt-8 border-t border-slate-800/80">
        <div className="flex items-center gap-3 text-emerald-400 text-sm font-bold">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>You're subscribed! Check your email for a welcome message.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 mt-8 border-t border-slate-800/80">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="shrink-0">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Stay Updated</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Get updates on new tools & launches.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Enter your email address"
              className="w-full h-11 pl-4 pr-4 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95 disabled:opacity-70 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Subscribe</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-xs font-semibold">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
