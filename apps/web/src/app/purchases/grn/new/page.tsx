"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { erpApi } from "../../../../lib/api";

interface PoWithLines {
  id: string;
  poNumber: string;
  warehouseId: string;
  status: string;
  lines?: Array<{
    id: string;
    productId: string;
    sku: string;
    orderedQty: string;
    receivedQty?: string;
  }>;
}

interface GrnReceiptRow {
  poLineId: string;
  productId: string;
  sku: string;
  orderedQty: string;
  receivedQty: string;
  rejectedQty: string;
  batchNumber: string;
  expiryDate: string;
}

export default function AddGRNPage() {
  const router = useRouter();

  const [purchaseOrders, setPurchaseOrders] = useState<PoWithLines[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [lines, setLines] = useState<GrnReceiptRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPurchaseOrders = useCallback(async () => {
    setError("");
    try {
      const [poRows, whRows] = await Promise.all([
        erpApi.procurement.listPurchaseOrders(),
        erpApi.inventory.listWarehouses(),
      ]);
      const receivablePos = (poRows as PoWithLines[]).filter((p) =>
        ["ISSUED", "PARTIALLY_RECEIVED", "DRAFT"].includes(p.status)
      );
      setPurchaseOrders(receivablePos);
      setWarehouses(whRows);
      if (whRows.length > 0 && !warehouseId) {
        setWarehouseId(whRows[0].id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load open Purchase Orders or Warehouses.");
    }
  }, [warehouseId]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const handleSelectPo = (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) {
      setLines([]);
      return;
    }

    const po = purchaseOrders.find((p) => p.id === poId);
    if (po?.warehouseId) {
      setWarehouseId(po.warehouseId);
    }

    const poLines = po?.lines ?? [];
    setLines(
      poLines.map((pl) => {
        const ordered = new Decimal(pl.orderedQty || "0");
        const alreadyReceived = new Decimal(pl.receivedQty || "0");
        const remaining = Decimal.max(new Decimal("1.0000"), ordered.minus(alreadyReceived));
        return {
          poLineId: pl.id,
          productId: pl.productId,
          sku: pl.sku,
          orderedQty: ordered.toFixed(4),
          receivedQty: remaining.toFixed(4),
          rejectedQty: "0.0000",
          batchNumber: `LOT-${Date.now().toString().slice(-5)}`,
          expiryDate: "",
        };
      })
    );
  };

  const handleLineChange = (index: number, field: keyof GrnReceiptRow, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !warehouseId || lines.length === 0) {
      setError("Please select a Purchase Order with line items and a receiving warehouse.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await erpApi.procurement.approveGrn({
        grnId: crypto.randomUUID(),
        purchaseOrderId: selectedPoId,
        warehouseId,
        lines: lines.map((l) => ({
          poLineId: l.poLineId,
          productId: l.productId,
          receivedQty: new Decimal(l.receivedQty || 0).toFixed(4),
          rejectedQty: new Decimal(l.rejectedQty || 0).toFixed(4),
          batchNumber: l.batchNumber.trim(),
          expiryDate: l.expiryDate ? new Date(`${l.expiryDate}T00:00:00.000Z`).toISOString() : undefined,
        })),
      });

      router.push("/purchases");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve GRN via API Gateway.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/purchases" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Goods Received Note (GRN)</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {error && (
          <div className="m-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Purchase Order *</label>
            <select
              required
              value={selectedPoId}
              onChange={(e) => handleSelectPo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Open Purchase Order...</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} ({po.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Receiving Warehouse *</label>
            <select
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold text-right">PO Ordered Qty</th>
                <th className="p-4 font-semibold w-32 text-right">Received Qty</th>
                <th className="p-4 font-semibold w-32 text-right">Rejected Qty</th>
                <th className="p-4 font-semibold w-40">Batch / Lot #</th>
                <th className="p-4 font-semibold w-40">Expiry Date (FEFO)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.poLineId} className="border-b border-slate-50">
                  <td className="p-4 text-sm font-mono font-medium text-slate-800">{line.sku}</td>
                  <td className="p-4 text-sm font-mono text-right text-slate-600">{line.orderedQty}</td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={line.receivedQty}
                      onChange={(e) => handleLineChange(index, "receivedQty", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-right"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={line.rejectedQty}
                      onChange={(e) => handleLineChange(index, "rejectedQty", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-right"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      required
                      value={line.batchNumber}
                      onChange={(e) => handleLineChange(index, "batchNumber", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                      placeholder="LOT-2026-A"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="date"
                      value={line.expiryDate}
                      onChange={(e) => handleLineChange(index, "expiryDate", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    Select a Purchase Order above to load receivable line items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end space-x-4 bg-slate-50/50">
          <Link
            href="/purchases"
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || lines.length === 0}
            className="flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-50 shadow-sm"
          >
            <CheckCircle2 size={16} />
            <span>{isSubmitting ? "Approving GRN..." : "Approve GRN & Increment Stock"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
