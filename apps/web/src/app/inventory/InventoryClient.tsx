"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import {
  Boxes,
  Search,
  Plus,
  Truck,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  History,
  Layers,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { erpApi } from "../../lib/api";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  wac: Decimal;
  price: Decimal;
  stock: Decimal;
  reserved: Decimal;
  reorderLevel: Decimal;
  warehouseId: string;
  warehouseCode: string;
  batchNumber: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

interface StockMovementRow {
  id: string;
  createdAt: string;
  reason: string;
  referenceDocumentId: string;
  productName: string;
  warehouseCode: string;
  batchNumber: string | null;
  quantityDelta: string;
  unitCostAtMovement: string;
}

interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  isActive: boolean;
}

export default function InventoryClient() {
  const [activeTab, setActiveTab] = useState<"catalog" | "movements" | "warehouses">("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newWac, setNewWac] = useState("100.00");
  const [newPrice, setNewPrice] = useState("150.00");
  const [newStock, setNewStock] = useState("0");
  const [newWarehouseId, setNewWarehouseId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadInventoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, warehousesRes, levelsRes, movementsRes] = await Promise.all([
        erpApi.inventory.listProducts(),
        erpApi.inventory.listWarehouses(),
        erpApi.inventory.listStockLevels(),
        erpApi.inventory.listStockMovements(),
      ]);

      setWarehouses(warehousesRes);
      if (!newWarehouseId && warehousesRes[0]?.id) {
        setNewWarehouseId(warehousesRes[0].id);
      }

      const mapped: InventoryItem[] = productsRes.map((item) => {
        const stockDec = new Decimal(item.stock || "0");
        const reservedDec = new Decimal(item.reserved || "0");
        const reorderDec = new Decimal(item.reorderThreshold || "10");
        const wacDec = new Decimal(item.wacCost || item.cost || "0");
        const priceDec = new Decimal(item.price || "0");

        const level = levelsRes.find((l) => l.productId === item.id || l.sku === item.sku);
        const status: InventoryItem["status"] = stockDec.lte(0)
          ? "Out of Stock"
          : stockDec.lte(reorderDec)
          ? "Low Stock"
          : "In Stock";

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category || "General",
          wac: wacDec,
          price: priceDec,
          stock: stockDec,
          reserved: reservedDec,
          reorderLevel: reorderDec,
          warehouseId: level?.warehouseId || warehousesRes[0]?.id || "",
          warehouseCode: level?.warehouseCode || warehousesRes[0]?.code || "DEFAULT",
          batchNumber: level?.batchNumber || "-",
          status,
        };
      });

      setInventory(mapped);
      setMovements(movementsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inventory data from API Gateway.");
    } finally {
      setLoading(false);
    }
  }, [newWarehouseId]);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  const handleQuickReplenish = async (item: InventoryItem) => {
    const targetWarehouseId = item.warehouseId || warehouses[0]?.id;
    if (!targetWarehouseId) {
      setError("No warehouse exists for this tenant. Create stock with a valid warehouse first.");
      return;
    }

    setAdjustingId(item.id);
    setError(null);
    setNotification(null);
    try {
      await erpApi.inventory.adjustStock({
        warehouseId: targetWarehouseId,
        productId: item.id,
        quantityDelta: "25.0000",
        unitCost: item.wac.gt(0) ? item.wac.toFixed(2) : "1.00",
        notes: `Quick cycle replenishment (+25) for ${item.sku}`,
      });
      setNotification(`Stock replenished: +25.0000 added to ${item.name} (${item.sku}).`);
      await loadInventoryData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to replenish stock.");
    } finally {
      setAdjustingId(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) return;

    setIsCreating(true);
    setError(null);
    setNotification(null);
    try {
      const created = await erpApi.inventory.createProduct({
        sku: newSku.trim().toUpperCase(),
        name: newName.trim(),
        category: newCategory.trim() || "General",
        cost: new Decimal(newWac || 0).toFixed(2),
        price: new Decimal(newPrice || 0).toFixed(2),
        initialStock: new Decimal(newStock || 0).toFixed(4),
        warehouseId: newWarehouseId || undefined,
      });

      setIsAddModalOpen(false);
      setNewSku("");
      setNewName("");
      setNotification(`Product ${created.name} (${created.sku}) created in WMS.`);
      await loadInventoryData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setIsCreating(false);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(inventory.map((i) => i.category)))];

  const filteredInventory = inventory.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalAssetValueDec = inventory.reduce((sum, item) => sum.plus(item.stock.mul(item.wac)), new Decimal(0));
  const totalRetailValueDec = inventory.reduce((sum, item) => sum.plus(item.stock.mul(item.price)), new Decimal(0));
  const totalUnitsOnHandDec = inventory.reduce((sum, item) => sum.plus(item.stock), new Decimal(0));
  const totalReservedUnitsDec = inventory.reduce((sum, item) => sum.plus(item.reserved), new Decimal(0));
  const lowStockCount = inventory.filter((item) => item.status !== "In Stock").length;

  const formatMoney = (dec: Decimal) =>
    Number(dec.toFixed(2)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Boxes size={16} />
            <span>Inventory & Warehouse Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory & Stock Control</h1>
          <p className="text-sm text-slate-400 mt-1">
            Live WMS stock levels, Weighted Average Cost (WAC) valuation, and immutable ledger movements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadInventoryData}
            disabled={loading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/purchases/grn/new"
            className="flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Truck size={16} className="text-slate-600" />
            <span>Receive Goods (GRN)</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
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
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md shrink-0">
            Persisted to WMS
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-indigo-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Stock Value (WAC)</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(totalAssetValueDec)}</div>
          <div className="text-xs text-indigo-600 font-medium mt-1">
            Retail Value: LKR {formatMoney(totalRetailValueDec)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Units On-Hand</div>
          <div className="text-2xl font-bold text-slate-800">
            {Number(totalUnitsOnHandDec.toFixed(2)).toLocaleString()} <span className="text-sm font-normal text-slate-400">Units</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {inventory.length} Products • {totalReservedUnitsDec.toFixed(2)} Reserved
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Low-Stock Reorder Alerts</div>
          <div className="text-2xl font-bold text-slate-800">
            {lowStockCount} {lowStockCount === 1 ? "Item" : "Items"}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">Below minimum safety stock level</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Warehouse Locations</div>
          <div className="text-2xl font-bold text-slate-800">{warehouses.length} Facilities</div>
          <div className="text-xs text-blue-600 font-medium mt-1 truncate">
            {warehouses.map((w) => w.code).join(", ") || "No warehouses configured"}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "catalog" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Layers size={15} />
            <span>Product Catalog ({inventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("movements")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "movements" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <History size={15} />
            <span>Stock Movement History ({movements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("warehouses")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "warehouses" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Warehouse size={15} />
            <span>Warehouse Locations ({warehouses.length})</span>
          </button>
        </div>

        {activeTab === "catalog" && (
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat ? "bg-white text-slate-800 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search SKU, name, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === "catalog" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Product & Warehouse</th>
                  <th className="py-3.5 px-4">SKU / Batch</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">WAC (LKR)</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-right">On-Hand Qty</th>
                  <th className="py-3.5 px-4 text-right">Stock Value</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((product) => {
                  const totalValue = product.stock.mul(product.wac);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{product.name}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-0.5">{product.warehouseCode}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{product.sku}</span>
                        <div className="text-[11px] font-mono text-slate-400 mt-1">{product.batchNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{product.category}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">{formatMoney(product.wac)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">{formatMoney(product.price)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                        {product.stock.toFixed(2)}
                        {product.reserved.gt(0) && (
                          <div className="text-[11px] text-amber-600">{product.reserved.toFixed(2)} reserved</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">{formatMoney(totalValue)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleQuickReplenish(product)}
                          disabled={adjustingId === product.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                        >
                          {adjustingId === product.id ? "Posting..." : "+25 Adjust"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No matching inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "movements" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Immutable Stock Ledger Movements</h3>
              <p className="text-xs text-slate-400">Chronological audit trail from inventory.stock_movements</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Reference Doc</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Warehouse / Batch</th>
                  <th className="py-3 px-4 text-right">Qty Delta</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const deltaDec = new Decimal(m.quantityDelta || 0);
                  const isPositive = deltaDec.gte(0);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {m.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                        {m.referenceDocumentId.slice(0, 12)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">{m.productName}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="font-semibold">{m.warehouseCode || "DEFAULT"}</span>
                        {m.batchNumber ? ` • ${m.batchNumber}` : ""}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {isPositive ? `+${deltaDec.toFixed(4)}` : deltaDec.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                        LKR {formatMoney(new Decimal(m.unitCostAtMovement || 0))}
                      </td>
                    </tr>
                  );
                })}
                {!loading && movements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "warehouses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {wh.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">{wh.name}</h3>
                  <p className="text-xs text-slate-400">{wh.address || "Registered tenant warehouse"}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    wh.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {wh.isActive ? "Operational" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
          {!loading && warehouses.length === 0 && (
            <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
              No warehouses configured yet. Creating a product with opening stock auto-initializes a default warehouse.
            </div>
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Register New Product SKU</h3>
                <p className="text-xs text-slate-400">Creates product, variant, and optional opening stock ledger entry.</p>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NET-RT-600"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Enterprise Firewall Appliance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Cost (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newWac}
                    onChange={(e) => setNewWac(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Selling Price (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {warehouses.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Warehouse</label>
                  <select
                    value={newWarehouseId}
                    onChange={(e) => setNewWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create SKU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "In Stock" | "Low Stock" | "Out of Stock" }) {
  if (status === "In Stock") {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} />
        <span>In Stock</span>
      </span>
    );
  }
  if (status === "Low Stock") {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle size={11} />
        <span>Low Stock</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <AlertTriangle size={11} />
      <span>Out of Stock</span>
    </span>
  );
}
