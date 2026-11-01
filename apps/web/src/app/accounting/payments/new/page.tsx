"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, CheckCircle2, CreditCard, Building, Calendar, FileText } from "lucide-react";
import { erpApi } from "../../../../lib/api";

export default function RecordPaymentPage() {
  const router = useRouter();

  const [paymentType, setPaymentType] = useState<"RECEIPT" | "PAYMENT">("RECEIPT");
  const [amount, setAmount] = useState("5000.00");
  const [reference, setReference] = useState(`PAY-${Date.now().toString().slice(-6)}`);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [counterparty, setCounterparty] = useState("Acme Holdings Ltd");
  const [narration, setNarration] = useState("Payment received against outstanding receivables");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    entryNumber: string;
    totalDebit: string;
    totalCredit: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessResult(null);

    const formattedAmount = Number(amount).toFixed(2);

    // Build balanced double-entry lines:
    // If Customer Receipt: Debit 1000 Cash, Credit 1100 AR
    // If Vendor Payment: Debit 2000 AP, Credit 1000 Cash
    const lines =
      paymentType === "RECEIPT"
        ? [
            {
              accountId: "11111111-1111-4111-8111-000000001000",
              accountCode: "1000",
              description: `${paymentMethod} deposit - ${counterparty}`,
              debit: formattedAmount,
              credit: "0.00",
            },
            {
              accountId: "11111111-1111-4111-8111-000000001100",
              accountCode: "1100",
              description: `Settlement of Accounts Receivable - ${counterparty}`,
              debit: "0.00",
              credit: formattedAmount,
            },
          ]
        : [
            {
              accountId: "11111111-1111-4111-8111-000000002000",
              accountCode: "2000",
              description: `Settlement of Accounts Payable - ${counterparty}`,
              debit: formattedAmount,
              credit: "0.00",
            },
            {
              accountId: "11111111-1111-4111-8111-000000001000",
              accountCode: "1000",
              description: `${paymentMethod} disbursement - ${counterparty}`,
              debit: "0.00",
              credit: formattedAmount,
            },
          ];

    try {
      const res = await erpApi.finance.postJournalEntry({
        referenceNumber: reference,
        sourceModule: "MANUAL",
        postingDate: new Date().toISOString(),
        narration: `${paymentType === "RECEIPT" ? "Customer Receipt" : "Supplier Disbursement"} (${paymentMethod}): ${narration}`,
        lines,
      });

      setSuccessResult({
        entryNumber: res.entryNumber,
        totalDebit: res.totalDebit,
        totalCredit: res.totalCredit,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to post payment journal entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-3">
        <Link href="/accounting" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Record Payment & Settle Ledger</h1>
          <p className="text-xs text-slate-400">Post balanced cash receipt or disbursement into General Ledger.</p>
        </div>
      </div>

      {successResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Payment posted to General Ledger! Journal Entry: {successResult.entryNumber}</span>
          </div>
          <p className="text-xs text-emerald-700">
            Debits: LKR {successResult.totalDebit} = Credits: LKR {successResult.totalCredit} (Double-entry balanced).
          </p>
          <div className="pt-2 flex space-x-3">
            <Link
              href="/accounting/journals"
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              View in Journal Entries &rarr;
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        {/* Payment Direction Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setPaymentType("RECEIPT");
              setCounterparty("Acme Holdings Ltd");
              setNarration("Payment received against customer receivables");
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              paymentType === "RECEIPT"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customer Receipt (Cash In &rarr; AR Credit)
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentType("PAYMENT");
              setCounterparty("Alpha Component Supplies");
              setNarration("Disbursement to supplier against invoice");
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              paymentType === "PAYMENT"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vendor Payment (AP Debit &rarr; Cash Out)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Counterparty ({paymentType === "RECEIPT" ? "Customer" : "Supplier"})
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Amount (LKR) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="Bank Transfer">Bank Wire / Online Transfer</option>
              <option value="Cash">Cash in Hand</option>
              <option value="Cheque">Corporate Cheque</option>
              <option value="Card">Credit / Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference / Cheque Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Narration & Audit Notes
            </label>
            <input
              type="text"
              required
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Automatically posts to Account 1000 (Cash & Bank) & {paymentType === "RECEIPT" ? "Account 1100 (AR)" : "Account 2000 (AP)"}.
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Posting to Ledger..." : "Post Balanced Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
