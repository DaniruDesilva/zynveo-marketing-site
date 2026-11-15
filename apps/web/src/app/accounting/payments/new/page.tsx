"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { ArrowLeft, DollarSign, CheckCircle2, CreditCard, Building, AlertCircle } from "lucide-react";
import { erpApi } from "../../../../lib/api";

export default function RecordPaymentPage() {
  const [paymentType, setPaymentType] = useState<"CUSTOMER_RECEIPT" | "SUPPLIER_PAYMENT">("CUSTOMER_RECEIPT");
  const [amount, setAmount] = useState("0.00");
  const [reference, setReference] = useState(`PAY-${Date.now().toString().slice(-6)}`);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [bankAccountCode, setBankAccountCode] = useState("1000");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [notes, setNotes] = useState("");

  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [arInvoices, setArInvoices] = useState<Array<{ id: string; invoiceNumber?: string; customerName?: string; balanceDue?: string; totalAmount?: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    entryNumber: string;
    paymentType: string;
    amount: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReferenceData = useCallback(async () => {
    try {
      const [accountsList, customersList, suppliersList, arList] = await Promise.all([
        erpApi.finance.listAccounts(),
        erpApi.sales.listCustomers(),
        erpApi.procurement.listSuppliers(),
        erpApi.finance.listArInvoices(),
      ]);

      const assetAccounts = accountsList.filter((a) => a.type === "ASSET" && a.isActive);
      setBankAccounts(assetAccounts.length > 0 ? assetAccounts : [{ id: "default", code: "1000", name: "Cash & Bank" }]);
      if (assetAccounts.length > 0 && !assetAccounts.some((a) => a.code === bankAccountCode)) {
        setBankAccountCode(assetAccounts[0].code);
      }
      setCustomers(customersList);
      setSuppliers(suppliersList);
      setArInvoices(arList);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load counterparties and GL accounts.");
    }
  }, [bankAccountCode]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const handleSelectInvoice = (selectedId: string) => {
    setInvoiceId(selectedId);
    const inv = arInvoices.find((i) => i.id === selectedId);
    if (inv) {
      const due = inv.balanceDue ?? inv.totalAmount;
      if (due) {
        setAmount(new Decimal(due).toFixed(2));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResult(null);

    let amtDec: Decimal;
    try {
      amtDec = new Decimal(amount || "0");
    } catch {
      setErrorMessage("Please enter a valid payment amount.");
      return;
    }

    if (amtDec.lte(0)) {
      setErrorMessage("Payment amount must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await erpApi.finance.recordPayment({
        paymentType,
        referenceNumber: reference.trim(),
        paymentDate: new Date(`${paymentDate}T00:00:00.000Z`).toISOString(),
        amount: amtDec.toFixed(2),
        bankAccountCode,
        counterpartyId: counterpartyId || undefined,
        invoiceId: paymentType === "CUSTOMER_RECEIPT" && invoiceId ? invoiceId : undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessResult({
        entryNumber: res.entryNumber,
        paymentType: res.paymentType,
        amount: res.amount,
      });
      setReference(`PAY-${Date.now().toString().slice(-6)}`);
      await loadReferenceData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to record payment via API Gateway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const counterparties = paymentType === "CUSTOMER_RECEIPT" ? customers : suppliers;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/accounting" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Record Payment & Settle Ledger</h1>
          <p className="text-xs text-slate-400">Post balanced cash receipt or supplier disbursement into General Ledger.</p>
        </div>
      </div>

      {successResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>Payment posted to General Ledger! Journal Entry: {successResult.entryNumber}</span>
          </div>
          <p className="text-xs text-emerald-700">
            Posted LKR {Number(successResult.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({successResult.paymentType}).
          </p>
          <div className="pt-2 flex space-x-3">
            <Link href="/accounting/journals" className="text-xs font-semibold text-emerald-800 hover:underline">
              View in Journal Entries &rarr;
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setPaymentType("CUSTOMER_RECEIPT");
              setCounterpartyId("");
              setInvoiceId("");
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              paymentType === "CUSTOMER_RECEIPT" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customer Receipt (Cash In &rarr; AR Credit)
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentType("SUPPLIER_PAYMENT");
              setCounterpartyId("");
              setInvoiceId("");
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              paymentType === "SUPPLIER_PAYMENT" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Supplier Payment (AP Debit &rarr; Cash Out)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {paymentType === "CUSTOMER_RECEIPT" ? "Customer (Optional)" : "Supplier (Optional)"}
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={counterpartyId}
                onChange={(e) => setCounterpartyId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select {paymentType === "CUSTOMER_RECEIPT" ? "customer" : "supplier"}...</option>
                {counterparties.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {paymentType === "CUSTOMER_RECEIPT" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Open AR Invoice (Optional)
              </label>
              <select
                value={invoiceId}
                onChange={(e) => handleSelectInvoice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Unapplied / General Receipt</option>
                {arInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber || inv.id.slice(0, 8)} {inv.customerName ? `- ${inv.customerName}` : ""} (LKR{" "}
                    {Number(inv.balanceDue ?? inv.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cash / Bank Account
            </label>
            <select
              value={bankAccountCode}
              onChange={(e) => setBankAccountCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.code}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference Number *
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

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Narration & Audit Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment reference details..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Posts atomically to GL Account {bankAccountCode} & {paymentType === "CUSTOMER_RECEIPT" ? "1100 (AR)" : "2000 (AP)"}.
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
