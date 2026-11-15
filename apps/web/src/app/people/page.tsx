"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Decimal from "decimal.js";
import { Users, Plus, Building2, Search, AlertCircle, RefreshCw, X } from "lucide-react";
import { erpApi } from "../../lib/api";

interface CustomerRow {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  tier?: string;
  creditLimit: string;
  currentBalance?: string;
  isActive: boolean;
}

interface SupplierRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxRegistrationNumber?: string | null;
  isActive: boolean;
}

export default function PeoplePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">("customers");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supTax, setSupTax] = useState("");
  const [savingSupplier, setSavingSupplier] = useState(false);

  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custRes, supRes] = await Promise.all([
        erpApi.sales.listCustomers(),
        erpApi.procurement.listSuppliers(),
      ]);
      setCustomers(custRes);
      setSuppliers(supRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load People directory from API Gateway.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupplier(true);
    setError(null);
    try {
      await erpApi.procurement.createSupplier({
        name: supName.trim(),
        email: supEmail.trim() || undefined,
        phone: supPhone.trim() || undefined,
        address: supAddress.trim() || undefined,
        taxRegistrationNumber: supTax.trim() || undefined,
      });
      setIsSupplierModalOpen(false);
      setSupName("");
      setSupEmail("");
      setSupPhone("");
      setSupAddress("");
      setSupTax("");
      setActiveTab("suppliers");
      await loadDirectory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create supplier.");
    } finally {
      setSavingSupplier(false);
    }
  };

  const q = searchTerm.toLowerCase();
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
  );
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.taxRegistrationNumber && s.taxRegistrationNumber.toLowerCase().includes(q))
  );

  const totalCreditDec = customers.reduce((sum, c) => sum.plus(new Decimal(c.creditLimit || 0)), new Decimal(0));
  const totalArDec = customers.reduce((sum, c) => sum.plus(new Decimal(c.currentBalance || 0)), new Decimal(0));

  const formatMoney = (val: string | Decimal) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Users size={16} />
            <span>Counterparty & Relationship Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">People & Organizations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer credit limits, suppliers, and contacts across your supply chain.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadDirectory}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setIsSupplierModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Plus size={16} />
            <span>Add Supplier</span>
          </button>
          <Link
            href="/people/customers/new"
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Customer</span>
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
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Customers</div>
          <div className="text-2xl font-bold text-slate-800">{customers.length} Accounts</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            LKR {formatMoney(totalCreditDec)} Total Credit Line
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Customer Receivables (AR)</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(totalArDec)}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Across all customer accounts</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-orange-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Supply Chain Vendors</div>
          <div className="text-2xl font-bold text-slate-800">{suppliers.length} Suppliers</div>
          <div className="text-xs text-orange-600 font-medium mt-1">Registered procurement vendors</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "customers" ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "suppliers" ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search directory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {activeTab === "customers" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Customer / Company</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Open Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center space-x-2">
                      <Building2 size={16} className="text-emerald-500 shrink-0" />
                      <div>
                        <div>{c.name}</div>
                        {c.company && <div className="text-xs text-slate-400 font-normal">{c.company}</div>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">{c.email || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{c.phone || "-"}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{c.tier || "STANDARD"}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      LKR {formatMoney(c.creditLimit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600">
                      LKR {formatMoney(c.currentBalance || "0")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No customers found.
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
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Tax / TIN</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">{s.email || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{s.phone || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{s.taxRegistrationNumber || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{s.address || "-"}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {s.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Add New Supplier</h2>
              <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier Name *</label>
                <input
                  required
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Alpha Component Supplies"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tax Registration (TIN)</label>
                <input
                  type="text"
                  value={supTax}
                  onChange={(e) => setSupTax(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
                >
                  {savingSupplier ? "Saving..." : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
