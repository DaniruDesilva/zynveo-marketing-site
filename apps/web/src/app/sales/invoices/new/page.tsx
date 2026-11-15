"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Save, AlertCircle } from "lucide-react";
import { erpApi } from "../../../../lib/api";

interface InvoiceLineForm {
  id: string;
  productId: string;
  sku: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRatePercent: string;
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Array<{ id: string; name: string; company?: string | null }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; sku: string; name: string; price: string }>>([]);

  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [currency] = useState("LKR");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<InvoiceLineForm[]>([
    {
      id: "line-1",
      productId: "",
      sku: "",
      description: "",
      quantity: "1.0000",
      unitPrice: "0.00",
      discountAmount: "0.00",
      taxRatePercent: "18.00",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadReferenceData = useCallback(async () => {
    setError("");
    try {
      const [custRows, whRows, prodRows] = await Promise.all([
        erpApi.sales.listCustomers(),
        erpApi.inventory.listWarehouses(),
        erpApi.inventory.listProducts(),
      ]);
      setCustomers(custRows);
      setWarehouses(whRows);
      setProducts(prodRows);
      if (whRows.length > 0 && !warehouseId) {
        setWarehouseId(whRows[0].id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load customers, warehouses, or products from API Gateway.");
    }
  }, [warehouseId]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const handleProductSelect = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    setLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: selected?.id || "",
        sku: selected?.sku || "",
        description: selected?.name || "",
        unitPrice: selected?.price != null ? new Decimal(selected.price).toFixed(2) : "0.00",
      };
      return next;
    });
  };

  const handleLineChange = (index: number, field: keyof InvoiceLineForm, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: "",
        sku: "",
        description: "",
        quantity: "1.0000",
        unitPrice: "0.00",
        discountAmount: "0.00",
        taxRatePercent: "18.00",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const safeDecimal = (val: string) => {
    try {
      return val.trim() === "" ? new Decimal(0) : new Decimal(val);
    } catch {
      return new Decimal(0);
    }
  };

  const estimatedTotals = lines.reduce(
    (acc, line) => {
      const qty = safeDecimal(line.quantity);
      const price = safeDecimal(line.unitPrice);
      const disc = safeDecimal(line.discountAmount);
      const taxRate = safeDecimal(line.taxRatePercent).div(100);
      const lineGross = qty.mul(price);
      const taxable = Decimal.max(new Decimal(0), lineGross.minus(disc));
      const tax = taxable.mul(taxRate);
      return {
        subtotal: acc.subtotal.plus(lineGross),
        discount: acc.discount.plus(disc),
        tax: acc.tax.plus(tax),
        total: acc.total.plus(taxable).plus(tax),
      };
    },
    { subtotal: new Decimal(0), discount: new Decimal(0), tax: new Decimal(0), total: new Decimal(0) }
  );

  const handleSave = async (finalizeImmediately: boolean) => {
    if (!customerId || !warehouseId) {
      setError("Please select both a Customer and a Dispatch Warehouse.");
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].productId) {
        setError(`Please select a product on line ${i + 1}.`);
        return;
      }
      if (safeDecimal(lines[i].quantity).lte(0)) {
        setError(`Quantity on line ${i + 1} must be positive.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const draft = await erpApi.sales.createDraftInvoice({
        customerId,
        warehouseId,
        currency,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : undefined,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          sku: l.sku,
          description: l.description || l.sku,
          quantity: safeDecimal(l.quantity).toFixed(4),
          unitPrice: safeDecimal(l.unitPrice).toFixed(2),
          discountAmount: safeDecimal(l.discountAmount).toFixed(2),
          taxRatePercent: safeDecimal(l.taxRatePercent).toFixed(2),
        })),
      });

      if (finalizeImmediately) {
        await erpApi.sales.finalizeInvoice(draft.invoiceId, { warehouseId });
      }

      router.push("/sales");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save invoice via API Gateway.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/sales" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">New Sales Invoice</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {error && (
          <div className="m-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Customer *</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Dispatch Warehouse *</label>
            <select
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional delivery or billing instructions..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Product / SKU</th>
                <th className="p-4 font-semibold w-28 text-right">Qty</th>
                <th className="p-4 font-semibold w-32 text-right">Unit Price ({currency})</th>
                <th className="p-4 font-semibold w-28 text-right">Discount</th>
                <th className="p-4 font-semibold w-24 text-right">Tax %</th>
                <th className="p-4 font-semibold w-14 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id} className="border-b border-slate-50">
                  <td className="p-4">
                    <select
                      required
                      value={line.productId}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitPrice}
                      onChange={(e) => handleLineChange(index, "unitPrice", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.discountAmount}
                      onChange={(e) => handleLineChange(index, "discountAmount", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={line.taxRatePercent}
                      onChange={(e) => handleLineChange(index, "taxRatePercent", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={addLine}
              className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} />
              <span>Add Line Item</span>
            </button>
            <div className="text-xs text-slate-500 font-mono">
              Subtotal: LKR {estimatedTotals.subtotal.toFixed(2)} • Discount: LKR {estimatedTotals.discount.toFixed(2)} • Tax: LKR{" "}
              {estimatedTotals.tax.toFixed(2)} • Est. Total:{" "}
              <span className="font-bold text-slate-800">LKR {estimatedTotals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl disabled:opacity-50"
            >
              <Save size={16} />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "Finalizing..." : "Finalize & Dispatch Stock"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
