"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { ShoppingCart, Plus, FileText, Search, Zap, RefreshCw, AlertCircle, X, Eye } from "lucide-react";
import { erpApi } from "../../lib/api";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string | null;
  warehouseId?: string | null;
  currency?: string;
  invoiceDate: string;
  dueDate?: string | null;
  subtotalAmount: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  totalCogsAmount: string;
  status: string;
}

interface QuotationRow {
  id: string;
  quoteNumber: string;
  customerName?: string | null;
  createdAt: string;
  validUntil?: string | null;
  totalAmount: string;
  status: string;
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"invoices" | "quotes">("invoices");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSalesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invRes, quoteRes, whRes] = await Promise.all([
        erpApi.sales.listInvoices(),
        erpApi.sales.listQuotations(),
        erpApi.inventory.listWarehouses(),
      ]);
      setInvoices(invRes);
      setQuotations(quoteRes);
      if (whRes[0]?.id) {
        setDefaultWarehouseId(whRes[0].id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load sales data from API Gateway.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const handleFinalize = async (inv: InvoiceRow) => {
    const warehouseId = inv.warehouseId || defaultWarehouseId;
    if (!warehouseId) {
      setError("No dispatch warehouse available. Configure a warehouse before finalizing invoices.");
      return;
    }

    setFinalizingId(inv.id);
    setError(null);
    setNotification(null);
    try {
      const res = await erpApi.sales.finalizeInvoice(inv.id, { warehouseId });
      setNotification(
        `Invoice ${res.invoiceNumber} finalized! Gross AR: LKR ${res.grossReceivableAmount}, COGS: LKR ${res.totalCogsAmount}.`
      );
      await loadSalesData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Failed to finalize invoice ${inv.invoiceNumber}.`);
    } finally {
      setFinalizingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q))
    );
  });

  const filteredQuotes = quotations.filter((qt) => {
    const q = searchTerm.toLowerCase();
    return (
      qt.quoteNumber.toLowerCase().includes(q) ||
      (qt.customerName && qt.customerName.toLowerCase().includes(q))
    );
  });

  const totalFinalizedDec = invoices
    .filter((i) => i.status === "FINALIZED")
    .reduce((sum, i) => sum.plus(new Decimal(i.totalAmount || 0)), new Decimal(0));
  const totalPaidDec = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum.plus(new Decimal(i.totalAmount || 0)), new Decimal(0));
  const draftInvoicesCount = invoices.filter((i) => i.status === "DRAFT").length;
  const openQuotesDec = quotations.reduce((sum, q) => sum.plus(new Decimal(q.totalAmount || 0)), new Decimal(0));

  const formatMoney = (val: string | Decimal) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShoppingCart size={16} />
            <span>Sales & Customer Billing</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sales & Invoices</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer invoices, Order-to-Cash Saga dispatch, quotations, and collections.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={loadSalesData}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/sales/invoices/new"
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 font-semibold">
            <Zap size={18} className="text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
            Completed
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Open Billed Receivables</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(totalFinalizedDec)}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">
            {invoices.filter((i) => i.status === "FINALIZED").length} Finalized Invoices
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Settled / Paid Invoices</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(totalPaidDec)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {invoices.filter((i) => i.status === "PAID").length} Invoices Settled
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Draft Invoices</div>
          <div className="text-2xl font-bold text-slate-800">{draftInvoicesCount} Pending</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Awaiting dispatch confirmation</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-purple-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Open Quotations</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(openQuotesDec)}</div>
          <div className="text-xs text-purple-600 font-medium mt-1">{quotations.length} Active Quotes</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "invoices" ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "quotes" ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Quotations ({quotations.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {activeTab === "invoices" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoice Amount</th>
                  <th className="py-3 px-4 text-right">Dispatched COGS</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 flex items-center space-x-2">
                      <FileText size={16} className="text-blue-500 shrink-0" />
                      <span>{inv.invoiceNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {inv.customerName || inv.customerId.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {inv.currency || "LKR"} {formatMoney(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                      {inv.currency || "LKR"} {formatMoney(inv.totalCogsAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "FINALIZED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status === "DRAFT" ? (
                        <button
                          type="button"
                          onClick={() => handleFinalize(inv)}
                          disabled={finalizingId === inv.id}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Zap size={13} className="shrink-0" />
                          <span>{finalizingId === inv.id ? "Finalizing..." : "Finalize & Dispatch"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-blue-600"
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No invoices found. Click &quot;New Invoice&quot; to create a customer invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Quoted Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((qt) => (
                  <tr key={qt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{qt.quoteNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{qt.customerName || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(qt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {qt.validUntil ? new Date(qt.validUntil).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      LKR {formatMoney(qt.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {qt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href="/sales/invoices/new" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                        Create Invoice &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No quotations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">{selectedInvoice.invoiceNumber}</h2>
              <button type="button" onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.customerName || selectedInvoice.customerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-blue-700">{selectedInvoice.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono">LKR {formatMoney(selectedInvoice.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="font-mono">LKR {formatMoney(selectedInvoice.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-mono">LKR {formatMoney(selectedInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-800">Total Amount</span>
                <span className="font-mono">LKR {formatMoney(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Recorded COGS</span>
                <span className="font-mono">LKR {formatMoney(selectedInvoice.totalCogsAmount)}</span>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
              <Link
                href="/accounting/payments/new"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                Record Payment
              </Link>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
