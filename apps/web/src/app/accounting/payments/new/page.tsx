import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RecordPaymentPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center space-x-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Record Payment</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 text-purple-500 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Payment Entry Form</h2>
        <p className="text-slate-500 max-w-sm mx-auto mb-6">
          This form is under construction. It will allow you to record an incoming payment against an invoice.
        </p>
      </div>
    </div>
  );
}
