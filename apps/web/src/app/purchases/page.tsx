"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Plus, 
  FileCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search,
  ArrowRight
} from "lucide-react";

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pos" | "grns">("pos");

  const [purchaseOrders] = useState([
    {
      id: "po-001",
      poNumber: "PO-2026-1001",
      supplier: "Alpha Component Supplies",
      warehouse: "Colombo Central Warehouse",
      orderedValue: "LKR 11,550.00",
      linesCount: 2,
      expectedDate: "2026-11-04",
      status: "ISSUED",
    },
    {
      id: "po-002",
      poNumber: "PO-2026-1002",
      supplier: "Global Audio OEM Ltd",
      warehouse: "Colombo Central Warehouse",
      orderedValue: "LKR 4,800.00",
      linesCount: 1,
      expectedDate: "2026-11-08",
      status: "PARTIALLY_RECEIVED",
    },
  ]);

  const [grns] = useState([
    {
      grnNumber: "GRN-2026-0501",
      poNumber: "PO-2026-1001",
      supplier: "Alpha Component Supplies",
      receivedDate: "2026-10-31",
      acceptedValue: "LKR 11,550.00",
      matchStatus: "3-WAY MATCHED",
      status: "APPROVED",
    },
    {
      grnNumber: "GRN-2026-0502",
      poNumber: "PO-2026-1002",
      supplier: "Global Audio OEM Ltd",
      receivedDate: "2026-11-01",
      acceptedValue: "LKR 1,200.00",
      matchStatus: "3-WAY MATCHED",
      status: "APPROVED",
    },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
          <Link
            href="/purchases/grn/new"
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-orange-600 px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Truck size={16} />
            <span>Add GRN (Receive Stock)</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-orange-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Open Purchase Orders</div>
          <div className="text-2xl font-bold text-slate-800">LKR 16,350.00</div>
          <div className="text-xs text-orange-600 font-medium mt-1">2 Issued Orders in-flight</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Approved Receipts (GRN)</div>
          <div className="text-2xl font-bold text-slate-800">LKR 12,750.00</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">100% 3-Way Matched</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Vendors</div>
          <div className="text-2xl font-bold text-slate-800">2 Suppliers</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Authorized supply chain partners</div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex space-x-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "pos"
                ? "bg-orange-50 text-orange-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("grns")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "grns"
                ? "bg-orange-50 text-orange-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Goods Received Notes ({grns.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search PO or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "pos" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Target Warehouse</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{po.poNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{po.supplier}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{po.warehouse}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{po.expectedDate}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">{po.orderedValue}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href="/purchases/grn/new"
                      className="text-xs font-semibold text-orange-600 hover:text-orange-800"
                    >
                      Receive Stock (GRN) &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">GRN #</th>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-right">Accepted Value</th>
                <th className="py-3 px-4 text-center">3-Way Match</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grns.map((grn) => (
                <tr key={grn.grnNumber} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{grn.grnNumber}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{grn.poNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{grn.supplier}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{grn.receivedDate}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">{grn.acceptedValue}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center space-x-1">
                      <FileCheck size={12} />
                      <span>{grn.matchStatus}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {grn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
