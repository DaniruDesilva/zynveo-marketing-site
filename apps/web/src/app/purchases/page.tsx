"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { ShoppingBag, Plus, FileCheck, Truck, Search, RefreshCw, AlertCircle, X, Trash2 } from "lucide-react";
import { erpApi } from "../../lib/api";

interface PurchaseOrderRow {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string | null;
  warehouseId: string;
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  totalAmount: string;
  lines?: Array<{ id: string; productId: string; sku: string; orderedQty: string; unitCost: string }>;
}

interface GrnRow {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  supplierName?: string | null;
  status: string;
  date: string;
  total: string;
}

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pos" | "grns">("pos");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [grns, setGrns] = useState<GrnRow[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; sku: string; name: string; cost: string }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poWarehouseId, setPoWarehouseId] = useState("");
  const [poExpectedDate, setPoExpectedDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poLines, setPoLines] = useState([{ productId: "", sku: "", orderedQty: "10.0000", unitCost: "0.00" }]);
  const [isCreatingPo, setIsCreatingPo] = useState(false);

  const loadProcurementData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [poRes, grnRes, supRes, whRes, prodRes] = await Promise.all([
        erpApi.procurement.listPurchaseOrders(),
        erpApi.procurement.listGrns(),
        erpApi.procurement.listSuppliers(),
        erpApi.inventory.listWarehouses(),
        erpApi.inventory.listProducts(),
      ]);
      setPurchaseOrders(poRes);
      setGrns(grnRes);
      setSuppliers(supRes);
      setWarehouses(whRes);
      setProducts(prodRes);
      if (!poWarehouseId && whRes[0]?.id) setPoWarehouseId(whRes[0].id);
      if (!poSupplierId && supRes[0]?.id) setPoSupplierId(supRes[0].id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load procurement data.");
    } finally {
      setIsLoading(false);
    }
  }, [poSupplierId, poWarehouseId]);

  useEffect(() => {
    loadProcurementData();
  }, [loadProcurementData]);

  const handleProductPick = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setPoLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: prod?.id || "",
        sku: prod?.sku || "",
        unitCost: prod?.cost ? new Decimal(prod.cost).toFixed(2) : "0.00",
      };
      return next;
    });
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poWarehouseId || poLines.some((l) => !l.productId)) {
      setError("Please select Supplier, Warehouse, and valid Products on all PO lines.");
      return;
    }

    setIsCreatingPo(true);
    setError(null);
    try {
      await erpApi.procurement.createPurchaseOrder({
        supplierId: poSupplierId,
        warehouseId: poWarehouseId,
        expectedDeliveryDate: poExpectedDate ? new Date(`${poExpectedDate}T00:00:00.000Z`).toISOString() : undefined,
        notes: poNotes.trim() || undefined,
        lines: poLines.map((l) => ({
          productId: l.productId,
          sku: l.sku,
          orderedQty: new Decimal(l.orderedQty || 1).toFixed(4),
          unitCost: new Decimal(l.unitCost || 0).toFixed(2),
        })),
      });
      setIsPoModalOpen(false);
      setPoNotes("");
      setPoLines([{ productId: "", sku: "", orderedQty: "10.0000", unitCost: "0.00" }]);
      await loadProcurementData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create Purchase Order.");
    } finally {
      setIsCreatingPo(false);
    }
  };

  const q = searchTerm.toLowerCase();
  const filteredPos = purchaseOrders.filter(
    (po) => po.poNumber.toLowerCase().includes(q) || (po.supplierName && po.supplierName.toLowerCase().includes(q))
  );
  const filteredGrns = grns.filter(
    (grn) =>
      grn.grnNumber.toLowerCase().includes(q) ||
      (grn.supplierName && grn.supplierName.toLowerCase().includes(q)) ||
      grn.purchaseOrderId.toLowerCase().includes(q)
  );

  const openPoDec = purchaseOrders
    .filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED")
    .reduce((sum, p) => sum.plus(new Decimal(p.totalAmount || 0)), new Decimal(0));
  const approvedGrnDec = grns
    .filter((g) => g.status === "APPROVED")
    .reduce((sum, g) => sum.plus(new Decimal(g.total || 0)), new Decimal(0));

  const formatMoney = (val: string | Decimal) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <ShoppingBag size={16} />
            <span>Procurement & Supply Chain Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Purchases & Goods Receipts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage vendor purchase orders, warehouse receipts (GRN), and 3-Way matching.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={loadProcurementData}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setIsPoModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
          </button>
          <Link
            href="/purchases/grn/new"
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-orange-600 px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Truck size={16} />
            <span>Add GRN (Receive Stock)</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-orange-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Open Purchase Orders</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(openPoDec)}</div>
          <div className="text-xs text-orange-600 font-medium mt-1">
            {purchaseOrders.filter((p) => p.status !== "COMPLETED").length} Orders pending receipt
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Approved Receipts (GRN)</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(approvedGrnDec)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">{grns.length} GRN vouchers recorded</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Vendors</div>
          <div className="text-2xl font-bold text-slate-800">{suppliers.length} Suppliers</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Registered supply chain partners</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "pos" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grns")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "grns" ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Goods Received Notes ({grns.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search PO, GRN or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {activeTab === "pos" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-right">Order Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{po.poNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {po.supplierName || po.supplierId.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      LKR {formatMoney(po.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {po.status !== "COMPLETED" && (
                        <Link href="/purchases/grn/new" className="text-xs font-semibold text-orange-600 hover:text-orange-800">
                          Receive Stock (GRN) &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredPos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No purchase orders found.
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
                  <th className="py-3 px-4">GRN #</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-right">Accepted Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGrns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{grn.grnNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{grn.purchaseOrderId.slice(0, 8)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{grn.supplierName || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(grn.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      LKR {formatMoney(grn.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
                        <FileCheck size={12} />
                        <span>{grn.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredGrns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No Goods Received Notes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Create Purchase Order</h2>
              <button type="button" onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePo} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier *</label>
                  <select
                    required
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Warehouse *</label>
                  <select
                    required
                    value={poWarehouseId}
                    onChange={(e) => setPoWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Order Lines</label>
                  <button
                    type="button"
                    onClick={() => setPoLines((p) => [...p, { productId: "", sku: "", orderedQty: "10.0000", unitCost: "0.00" }])}
                    className="text-xs font-semibold text-orange-600 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                {poLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      required
                      value={line.productId}
                      onChange={(e) => handleProductPick(idx, e.target.value)}
                      className="col-span-6 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={line.orderedQty}
                      onChange={(e) =>
                        setPoLines((prev) => prev.map((r, i) => (i === idx ? { ...r, orderedQty: e.target.value } : r)))
                      }
                      placeholder="Qty"
                      className="col-span-2 px-2 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitCost}
                      onChange={(e) =>
                        setPoLines((prev) => prev.map((r, i) => (i === idx ? { ...r, unitCost: e.target.value } : r)))
                      }
                      placeholder="Cost"
                      className="col-span-3 px-2 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono"
                    />
                    <button
                      type="button"
                      disabled={poLines.length <= 1}
                      onClick={() => setPoLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="col-span-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 flex justify-center"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPo}
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl disabled:opacity-50"
                >
                  {isCreatingPo ? "Creating PO..." : "Issue Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
