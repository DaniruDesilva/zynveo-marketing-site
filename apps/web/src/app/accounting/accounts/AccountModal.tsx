"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { erpApi } from "../../../lib/api";

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export default function AccountModal({
  existingAccounts,
  onClose,
  onSaved,
}: {
  existingAccounts: Array<{ code: string; type: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    type: AccountType;
    normalBalance: "DEBIT" | "CREDIT";
    description: string;
  }>({
    code: "1010",
    name: "",
    type: "ASSET",
    normalBalance: "DEBIT",
    description: "",
  });

  useEffect(() => {
    const baseByType: Record<AccountType, number> = {
      ASSET: 1000,
      LIABILITY: 2000,
      EQUITY: 3000,
      REVENUE: 4000,
      EXPENSE: 5000,
    };

    const baseCode = baseByType[formData.type];
    let nextCode = baseCode;
    for (const acc of existingAccounts) {
      if (acc.type.toUpperCase() === formData.type) {
        const parsed = parseInt(acc.code, 10);
        if (!Number.isNaN(parsed) && parsed >= nextCode && parsed < baseCode + 1000) {
          nextCode = parsed + 1;
        }
      }
    }

    setFormData((prev) => ({ ...prev, code: String(nextCode) }));
  }, [formData.type, existingAccounts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "type") {
      const nextType = value as AccountType;
      const normalBalance = ["LIABILITY", "EQUITY", "REVENUE"].includes(nextType) ? "CREDIT" : "DEBIT";
      setFormData((prev) => ({
        ...prev,
        type: nextType,
        normalBalance,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await erpApi.finance.createAccount({
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        normalBalance: formData.normalBalance,
        description: formData.description.trim() || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">New GL Account</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Account Code</label>
              <input
                required
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 1050"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Account Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Account Name</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Cash in Bank"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Normal Balance</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="normalBalance"
                  value="DEBIT"
                  checked={formData.normalBalance === "DEBIT"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Debit</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="normalBalance"
                  value="CREDIT"
                  checked={formData.normalBalance === "CREDIT"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Credit</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assets & Expenses carry a Debit normal balance. Liabilities, Equity & Revenue carry Credit.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
