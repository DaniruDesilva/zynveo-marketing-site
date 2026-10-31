"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { usePowerSync } from "../../../../components/PowerSyncProvider";
import { erpApi } from "../../../../lib/api";

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
  const db = usePowerSync();
  const router = useRouter();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [lines, setLines] = useState<GrnReceiptRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPurchaseOrders = useCallback(async () => {
    if (!db) return;
    try {
      const [poRows, whRows] = await Promise.all([
        db.getAll(
          "SELECT id, po_number, warehouse_id, status FROM purchase_orders WHERE status IN ('ISSUED', 'PARTIALLY_RECEIVED', 'DRAFT') ORDER BY created_at DESC"
        ),
        db.getAll("SELECT id, name FROM warehouses ORDER BY name ASC"),
      ]);
      setPurchaseOrders(poRows);
      setWarehouses(whRows);
      if (whRows.length > 0 && !warehouseId) {
        setWarehouseId(whRows[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [db, warehouseId]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const handleSelectPo = async (poId: string) => {
    setSelectedPoId(poId);
    if (!db || !poId) {
      setLines([]);
      return;
    }

    const po = purchaseOrders.find((p) => p.id === poId);
    if (po?.warehouse_id) {
      setWarehouseId(po.warehouse_id);
    }

    const poLineRows = await db.getAll(
      "SELECT id, product_id, sku, ordered_qty, received_qty FROM po_lines WHERE purchase_order_id = ?",
      [poId]
    );

    setLines(
      poLineRows.map((pl: any) => ({
        poLineId: pl.id,
        productId: pl.product_id,
        sku: pl.sku,
        orderedQty: String(pl.ordered_qty || "0.0000"),
        receivedQty: String(pl.ordered_qty || "1.0000"),
        rejectedQty: "0.0000",
        batchNumber: `LOT-${Date.now().toString().slice(-5)}`,
        expiryDate: "",
      }))
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
          receivedQty: (Number(l.receivedQty) || 0).toFixed(4),
          rejectedQty: (Number(l.rejectedQty) || 0).toFixed(4),
          batchNumber: l.batchNumber.trim(),
          expiryDate: l.expiryDate
            ? new Date(`${l.expiryDate}T00:00:00.000Z`).toISOString()
            : undefined,
        })),
      });

      router.push("/purchases");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to approve GRN via API Gateway.");
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
          <div className="m-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Purchase Order</label>
            <select
              required
              value={selectedPoId}
              onChange={(e) => handleSelectPo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Issued Purchase Order...</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_number} ({po.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Receiving Warehouse</label>
            <select
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
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
                  <td className="p-4 text-sm font-medium text-slate-800">{line.sku}</td>
                  <td className="p-4 text-sm text-right text-slate-600">{line.orderedQty}</td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={line.receivedQty}
                      onChange={(e) => handleLineChange(index, "receivedQty", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={line.rejectedQty}
                      onChange={(e) => handleLineChange(index, "rejectedQty", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      required
                      value={line.batchNumber}
                      onChange={(e) => handleLineChange(index, "batchNumber", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
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
          <Link href="/purchases" className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl">
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
