"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle, Lightbulb, Bug, MessageCircle, HelpCircle } from "lucide-react";

const feedbackTypes = [
  { value: "feedback", label: "General Feedback", icon: MessageCircle, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { value: "idea", label: "Feature Idea", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "issue", label: "Bug / Issue", icon: Bug, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  { value: "other", label: "Other", icon: HelpCircle, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "feedback",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
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

  const resetForm = () => {
    setFormData({ name: "", email: "", type: "feedback", message: "" });
    setSubmitted(false);
    setError("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
          isOpen
            ? "bg-slate-800 text-white rotate-90 shadow-slate-800/30"
            : "bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-primary/40 hover:scale-110 hover:shadow-xl"
        }`}
        aria-label={isOpen ? "Close feedback" : "Send feedback"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquarePlus className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          onClick={resetForm}
        />
      )}

      {/* Slide-Out Drawer */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out ${
          isOpen
            ? "bottom-0 right-0 sm:bottom-24 sm:right-6 opacity-100 translate-y-0 sm:translate-y-0 pointer-events-auto"
            : "bottom-0 right-0 sm:bottom-24 sm:right-6 opacity-0 translate-y-full sm:translate-y-4 pointer-events-none"
        }`}
      >
        <div className="w-screen sm:w-[400px] max-h-[90vh] sm:max-h-[600px] bg-white sm:rounded-2xl sm:border sm:border-slate-200 shadow-2xl overflow-hidden flex flex-col rounded-t-3xl sm:rounded-t-2xl">
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-primary to-indigo-600 text-white flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-black">Share Your Thoughts</h3>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">Feedback, ideas, or bug reports</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {submitted ? (
              <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-black text-slate-900">Thank You! 🙏</h4>
                <p className="text-sm text-slate-600 font-medium max-w-sm mx-auto">
                  Your feedback has been received. We've sent a confirmation to your email.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map((ft) => (
                      <button
                        key={ft.value}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, type: ft.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          formData.type === ft.value
                            ? `${ft.color} ring-2 ring-offset-1 ring-current`
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <ft.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{ft.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">Name (Optional)</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">Email *</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">Message *</label>
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us your feedback, idea, or describe the issue..."
                    className="w-full p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {loading ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
