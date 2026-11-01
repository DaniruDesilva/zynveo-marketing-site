"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  CreditCard, 
  Search,
  CheckCircle2
} from "lucide-react";

export default function PeoplePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">("customers");

  const [customers] = useState([
    {
      id: "cust-001",
      name: "Acme Holdings Ltd",
      contactPerson: "Dinesh Wijesinghe",
      email: "finance@acmeholdings.lk",
      phone: "+94 11 234 5678",
      creditLimit: "LKR 500,000.00",
      openBalance: "LKR 12,105.00",
      status: "ACTIVE",
    },
    {
      id: "cust-002",
      name: "Ceylon Global Logistics",
      contactPerson: "Priyanka Samarasekara",
      email: "accounts@ceylonglobal.com",
      phone: "+94 11 765 4321",
      creditLimit: "LKR 750,000.00",
      openBalance: "LKR 4,500.00",
      status: "ACTIVE",
    },
    {
      id: "cust-003",
      name: "Apex Retail Group",
      contactPerson: "Mahesh Jayatillake",
      email: "billing@apexretail.lk",
      phone: "+94 31 222 3344",
      creditLimit: "LKR 300,000.00",
      openBalance: "LKR 1,845.00",
      status: "ACTIVE",
    },
  ]);

  const [suppliers] = useState([
    {
      id: "supp-001",
      name: "Alpha Component Supplies",
      contactPerson: "Ravindra Senanayake",
      email: "orders@alphasupplies.com",
      phone: "+94 11 987 6543",
      paymentTerms: "Net 30 Days",
      category: "Raw Materials & Electronics",
      status: "ACTIVE",
    },
    {
      id: "supp-002",
      name: "Global Audio OEM Ltd",
      contactPerson: "Sunil Kulatunga",
      email: "sales@globalaudio-oem.com",
      phone: "+94 11 445 5667",
      paymentTerms: "Net 15 Days",
      category: "Peripherals & Audio",
      status: "ACTIVE",
    },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
        <div className="flex space-x-3">
          <Link
            href="/people/customers/new"
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Customers</div>
          <div className="text-2xl font-bold text-slate-800">3 Accounts</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">LKR 1,550,000 Total Credit Line</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Receivables (AR)</div>
          <div className="text-2xl font-bold text-slate-800">LKR 18,450.00</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Across all customer accounts</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-orange-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Supply Chain Vendors</div>
          <div className="text-2xl font-bold text-slate-800">2 Suppliers</div>
          <div className="text-xs text-orange-600 font-medium mt-1">Electronics & OEM Components</div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex space-x-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "customers"
                ? "bg-emerald-50 text-emerald-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "suppliers"
                ? "bg-emerald-50 text-emerald-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50"
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

      {/* Content */}
      {activeTab === "customers" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Open AR</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center space-x-2">
                    <Building2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{c.contactPerson}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">{c.email}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{c.phone}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-800">{c.creditLimit}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-600">{c.openBalance}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {c.status}
                    </span>
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
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{s.category}</td>
                  <td className="py-3.5 px-4 text-slate-700">{s.contactPerson}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">{s.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{s.paymentTerms}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {s.status}
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
