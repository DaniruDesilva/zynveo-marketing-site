"use client";

import React, { useState, useEffect, useCallback } from "react";
import Decimal from "decimal.js";
import { erpApi } from "../../../../lib/api";
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AccountOption = Awaited<ReturnType<typeof erpApi.finance.listAccounts>>[number];

interface JournalDraftLine {
  id: string;
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [header, setHeader] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
  });

  const [lines, setLines] = useState<JournalDraftLine[]>([
    { id: "line-1", accountId: "", description: "", debit: "0.00", credit: "0.00" },
    { id: "line-2", accountId: "", description: "", debit: "0.00", credit: "0.00" },
  ]);

  const fetchAccounts = useCallback(async () => {
    try {
      const result = await erpApi.finance.listAccounts();
      setAccounts(result.filter((a) => a.isActive));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load GL accounts from API Gateway.");
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHeader((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLineChange = (index: number, field: keyof JournalDraftLine, value: string) => {
    setLines((prev) => {
      const newLines = prev.map((item) => ({ ...item }));
      const target = newLines[index];
      if (!target) return prev;

      if (field === "debit") {
        target.debit = value;
        const parsed = new Decimal(value || 0);
        if (parsed.gt(0)) target.credit = "0.00";
      } else if (field === "credit") {
        target.credit = value;
        const parsed = new Decimal(value || 0);
        if (parsed.gt(0)) target.debit = "0.00";
      } else {
        target[field] = value;
      }
      return newLines;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), accountId: "", description: "", debit: "0.00", credit: "0.00" },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const safeDecimal = (val: string) => {
    try {
      return val.trim() === "" ? new Decimal(0) : new Decimal(val);
    } catch {
      return new Decimal(0);
    }
  };

  const totalDebitDec = lines.reduce((sum, line) => sum.plus(safeDecimal(line.debit)), new Decimal(0));
  const totalCreditDec = lines.reduce((sum, line) => sum.plus(safeDecimal(line.credit)), new Decimal(0));
  const diffDec = totalDebitDec.minus(totalCreditDec).abs();
  const isBalanced = totalDebitDec.equals(totalCreditDec) && totalDebitDec.gt(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError("Total Debits must equal Total Credits.");
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.accountId) {
        setError(`Please select an account for line ${i + 1}.`);
        return;
      }
      const d = safeDecimal(line.debit);
      const c = safeDecimal(line.credit);
      if (d.lte(0) && c.lte(0)) {
        setError(`Line ${i + 1} must have a positive debit or credit amount.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const referenceNumber = header.reference.trim() || `JE-${Date.now().toString().slice(-6)}`;
      const postingDate = new Date(`${header.date}T00:00:00.000Z`).toISOString();

      await erpApi.finance.postJournalEntry({
        referenceNumber,
        sourceModule: "MANUAL",
        postingDate,
        narration: header.description.trim() || `Manual Journal ${referenceNumber}`,
        lines: lines.map((line) => {
          const acct = accounts.find((a) => a.id === line.accountId);
          if (!acct) {
            throw new Error("Invalid GL account selection.");
          }
          return {
            accountId: line.accountId,
            accountCode: acct.code,
            description: line.description.trim() || header.description.trim() || undefined,
            debit: safeDecimal(line.debit).toFixed(2),
            credit: safeDecimal(line.credit).toFixed(2),
          };
        }),
      });

      router.push("/accounting/journals");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post journal entry via API Gateway.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/accounting/journals" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">New Journal Entry</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {error && (
          <div className="m-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              required
              type="date"
              name="date"
              value={header.date}
              onChange={handleHeaderChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Reference</label>
            <input
              type="text"
              name="reference"
              value={header.reference}
              onChange={handleHeaderChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. JE-2026-001"
            />
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="text-sm font-medium text-slate-700">Narration / Description</label>
            <textarea
              name="description"
              value={header.description}
              onChange={handleHeaderChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Internal notes or narration for this double-entry journal..."
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold w-1/3">Account</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold w-36 text-right">Debit</th>
                <th className="p-4 font-semibold w-36 text-right">Credit</th>
                <th className="p-4 font-semibold w-16 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id} className="border-b border-slate-50">
                  <td className="p-4">
                    <select
                      required
                      value={line.accountId}
                      onChange={(e) => handleLineChange(index, "accountId", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Account...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => handleLineChange(index, "description", e.target.value)}
                      className="w-full px-3 py-2 border border-transparent hover:border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      placeholder="Line description (optional)"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit}
                      onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit}
                      onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 2}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={2} className="p-4">
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    <span>Add Line</span>
                  </button>
                </td>
                <td className="p-4 text-right font-mono font-semibold text-slate-800">
                  {Number(totalDebitDec.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right font-mono font-semibold text-slate-800">
                  {Number(totalCreditDec.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
              {!isBalanced && (totalDebitDec.gt(0) || totalCreditDec.gt(0)) && (
                <tr className="bg-red-50/50">
                  <td colSpan={5} className="p-3 text-center text-sm font-medium text-red-600">
                    Out of balance difference: {Number(diffDec.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end space-x-4 bg-slate-50/50">
          <Link
            href="/accounting/journals"
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isBalanced || isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save size={16} />
            <span>{isSubmitting ? "Posting..." : "Post Journal"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
