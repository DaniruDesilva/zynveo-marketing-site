"use client";

import React, { useState, useEffect, useCallback } from "react";
import Decimal from "decimal.js";
import { Factory, Plus, Layers, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { erpApi } from "../../lib/api";

interface WorkOrderRow {
  id: string;
  workOrderNumber: string;
  bomId: string;
  bomCode?: string | null;
  finishedProductId: string;
  plannedQty: string;
  actualProducedQty: string;
  totalProductionCost: string;
  status: string;
}

interface BomRow {
  id: string;
  bomCode: string;
  finishedProductId: string;
  version: string;
  laborCostPerUnit: string;
  overheadCostPerUnit: string;
  isActive: boolean;
  components?: Array<{ id: string; rawMaterialProductId: string; quantityRequiredPerUnit: string; scrapPercentage: string }>;
}

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "boms">("orders");
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [boms, setBoms] = useState<BomRow[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [woBomId, setWoBomId] = useState("");
  const [woPlannedQty, setWoPlannedQty] = useState("10.0000");
  const [woRawWhId, setWoRawWhId] = useState("");
  const [woFgWhId, setWoFgWhId] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);

  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [bomCode, setBomCode] = useState("");
  const [bomFinishedProductId, setBomFinishedProductId] = useState("");
  const [bomLaborCost, setBomLaborCost] = useState("25.00");
  const [bomOverheadCost, setBomOverheadCost] = useState("15.00");
  const [bomRawProductId, setBomRawProductId] = useState("");
  const [bomRawQty, setBomRawQty] = useState("1.0000");
  const [bomScrapPct, setBomScrapPct] = useState("0.00");
  const [isCreatingBom, setIsCreatingBom] = useState(false);

  const loadManufacturingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [woRes, bomRes, prodRes, whRes] = await Promise.all([
        erpApi.manufacturing.listWorkOrders(),
        erpApi.manufacturing.listBoms(),
        erpApi.inventory.listProducts(),
        erpApi.inventory.listWarehouses(),
      ]);
      setWorkOrders(woRes);
      setBoms(bomRes);
      setProducts(prodRes);
      setWarehouses(whRes);

      if (!woBomId && bomRes[0]?.id) setWoBomId(bomRes[0].id);
      if (!woRawWhId && whRes[0]?.id) setWoRawWhId(whRes[0].id);
      if (!woFgWhId && whRes[0]?.id) setWoFgWhId(whRes[0].id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load manufacturing data.");
    } finally {
      setIsLoading(false);
    }
  }, [woBomId, woFgWhId, woRawWhId]);

  useEffect(() => {
    loadManufacturingData();
  }, [loadManufacturingData]);

  const productNameById = (id: string) => {
    const p = products.find((item) => item.id === id);
    return p ? `${p.name} (${p.sku})` : id.slice(0, 8);
  };

  const handleCompleteWorkOrder = async (order: WorkOrderRow) => {
    setCompletingId(order.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await erpApi.manufacturing.completeWorkOrder({
        workOrderId: order.id,
        actualProducedQty: new Decimal(order.plannedQty || 1).toFixed(4),
        outputBatchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      });
      setSuccessMessage(
        `Work Order ${res.workOrderNumber} completed! Unit Finished Good Cost: LKR ${res.unitFinishedGoodCost} (Total: LKR ${res.totalProductionCost}).`
      );
      await loadManufacturingData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to complete work order ${order.workOrderNumber}.`);
    } finally {
      setCompletingId(null);
    }
  };

  const handleReleaseWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBom = boms.find((b) => b.id === woBomId);
    if (!selectedBom || !woRawWhId || !woFgWhId) {
      setError("Please select a valid BOM and warehouses.");
      return;
    }

    setIsReleasing(true);
    setError(null);
    try {
      await erpApi.manufacturing.releaseWorkOrder({
        bomId: selectedBom.id,
        finishedProductId: selectedBom.finishedProductId,
        plannedQty: new Decimal(woPlannedQty || 1).toFixed(4),
        sourceRawWarehouseId: woRawWhId,
        targetFinishedWarehouseId: woFgWhId,
      });
      setIsWoModalOpen(false);
      setSuccessMessage("Work Order released to production floor.");
      await loadManufacturingData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to release work order.");
    } finally {
      setIsReleasing(false);
    }
  };

  const handleCreateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomCode.trim() || !bomFinishedProductId || !bomRawProductId) {
      setError("Please fill all BOM fields.");
      return;
    }

    setIsCreatingBom(true);
    setError(null);
    try {
      await erpApi.manufacturing.createBom({
        bomCode: bomCode.trim().toUpperCase(),
        finishedProductId: bomFinishedProductId,
        version: "1.0",
        laborCostPerUnit: new Decimal(bomLaborCost || 0).toFixed(2),
        overheadCostPerUnit: new Decimal(bomOverheadCost || 0).toFixed(2),
        components: [
          {
            rawMaterialProductId: bomRawProductId,
            quantityRequiredPerUnit: new Decimal(bomRawQty || 1).toFixed(4),
            scrapPercentage: new Decimal(bomScrapPct || 0).toFixed(2),
          },
        ],
      });
      setIsBomModalOpen(false);
      setBomCode("");
      setActiveTab("boms");
      setSuccessMessage("Bill of Materials created.");
      await loadManufacturingData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create BOM.");
    } finally {
      setIsCreatingBom(false);
    }
  };

  const activeWorkOrdersCount = workOrders.filter((w) => w.status !== "COMPLETED" && w.status !== "CANCELLED").length;
  const totalProdCostDec = workOrders
    .filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum.plus(new Decimal(w.totalProductionCost || 0)), new Decimal(0));

  const formatMoney = (val: string | Decimal) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Factory size={16} />
            <span>Manufacturing Execution System (MES)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Manufacturing & Work Orders</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bills of Materials (BOM), component backflush, and work order production yields.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadManufacturingData}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setIsBomModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Layers size={16} />
            <span>New BOM</span>
          </button>
          <button
            type="button"
            onClick={() => setIsWoModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Work Orders</div>
          <div className="text-2xl font-bold text-slate-800">{activeWorkOrdersCount} In-Flight</div>
          <div className="text-xs text-amber-600 font-medium mt-1">{workOrders.length} Total Work Orders</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Bills of Materials</div>
          <div className="text-2xl font-bold text-slate-800">{boms.length} Released</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Component specs</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-purple-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Completed Production Cost</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(totalProdCostDec)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">WIP to Finished Goods</div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "orders" ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Work Orders ({workOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("boms")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "boms" ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Bills of Materials ({boms.length})
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Finished Product</th>
                  <th className="py-3 px-4">BOM Code</th>
                  <th className="py-3 px-4 text-right">Planned Qty</th>
                  <th className="py-3 px-4 text-right">Produced Qty</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{order.workOrderNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{productNameById(order.finishedProductId)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{order.bomCode || order.bomId.slice(0, 8)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">{order.plannedQty}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">{order.actualProducedQty}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      LKR {formatMoney(order.totalProductionCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          order.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
                        <button
                          type="button"
                          onClick={() => handleCompleteWorkOrder(order)}
                          disabled={completingId === order.id}
                          className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          {completingId === order.id ? "Completing..." : "Complete & Yield"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Posted</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && workOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No work orders found. Release a Work Order using a BOM above.
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
                  <th className="py-3 px-4">BOM Code</th>
                  <th className="py-3 px-4">Finished Product</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4 text-center">Components</th>
                  <th className="py-3 px-4 text-right">Labor / Unit</th>
                  <th className="py-3 px-4 text-right">Overhead / Unit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boms.map((bom) => (
                  <tr key={bom.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{bom.bomCode}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{productNameById(bom.finishedProductId)}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">v{bom.version}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">{bom.components?.length ?? 0}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">LKR {formatMoney(bom.laborCostPerUnit)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">LKR {formatMoney(bom.overheadCostPerUnit)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {bom.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && boms.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No Bills of Materials defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isWoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Release Work Order</h2>
              <button type="button" onClick={() => setIsWoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReleaseWorkOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bill of Materials *</label>
                <select
                  required
                  value={woBomId}
                  onChange={(e) => setWoBomId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select BOM...</option>
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bomCode} ({productNameById(b.finishedProductId)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Planned Quantity *</label>
                <input
                  required
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={woPlannedQty}
                  onChange={(e) => setWoPlannedQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Raw Materials Warehouse *</label>
                <select
                  required
                  value={woRawWhId}
                  onChange={(e) => setWoRawWhId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Finished Goods Warehouse *</label>
                <select
                  required
                  value={woFgWhId}
                  onChange={(e) => setWoFgWhId(e.target.value)}
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
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsWoModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasing}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {isReleasing ? "Releasing..." : "Release Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Create Bill of Materials</h2>
              <button type="button" onClick={() => setIsBomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBom} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">BOM Code *</label>
                <input
                  required
                  type="text"
                  value={bomCode}
                  onChange={(e) => setBomCode(e.target.value)}
                  placeholder="e.g. BOM-FG-001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Finished Good Product *</label>
                <select
                  required
                  value={bomFinishedProductId}
                  onChange={(e) => setBomFinishedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Labor / Unit (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bomLaborCost}
                    onChange={(e) => setBomLaborCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Overhead / Unit (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bomOverheadCost}
                    onChange={(e) => setBomOverheadCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Raw Material Component *</label>
                <select
                  required
                  value={bomRawProductId}
                  onChange={(e) => setBomRawProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Raw Material...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qty Per Unit</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={bomRawQty}
                    onChange={(e) => setBomRawQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Scrap %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bomScrapPct}
                    onChange={(e) => setBomScrapPct(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsBomModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBom}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {isCreatingBom ? "Creating..." : "Create BOM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
