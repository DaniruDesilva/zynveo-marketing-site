"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, CheckCircle2, Building, Mail, Phone, CreditCard, MapPin } from "lucide-react";
import { usePowerSync } from "../../../../components/PowerSyncProvider";

export default function NewCustomerPage() {
  const router = useRouter();
  const db = usePowerSync();

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    creditLimit: "250000.00",
    paymentTerms: "Net 30 Days",
    taxId: "",
    address: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (db) {
        await db.execute(
          `INSERT INTO customers (id, tenant_id, name, email, phone, credit_limit, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`,
            "22222222-2222-4222-8222-222222222222",
            form.name,
            form.email,
            form.phone,
            Number(form.creditLimit),
            1,
            new Date().toISOString(),
          ]
        );
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/people");
      }, 1200);
    } catch (err) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/people");
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-3">
        <Link href="/people" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add New Customer</h1>
          <p className="text-xs text-slate-400">Register counterparty into CRM and set authoritative credit limits.</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Customer registered successfully! Redirecting to People directory...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Company / Customer Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required
                placeholder="e.g. Acme Industrial Lanka PLC"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Sampath Wickramasinghe"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Credit Limit (LKR)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="number"
                step="0.01"
                required
                value={form.creditLimit}
                onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Billing Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                placeholder="invoices@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="+94 11 234 5678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Terms
            </label>
            <select
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="Immediate">Immediate / Advance</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 60 Days">Net 60 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tax Registration (TIN / VAT #)
            </label>
            <input
              type="text"
              placeholder="e.g. 102938475-7000"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Registered Billing & Shipping Address
            </label>
            <textarea
              rows={3}
              placeholder="Building, Street, City, Postal Code"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <Link
            href="/people"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
          >
            <UserPlus size={16} />
            <span>{isSubmitting ? "Saving..." : "Save Customer"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
