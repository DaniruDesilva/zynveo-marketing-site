"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePowerSync } from "../../../../components/PowerSyncProvider";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewJournalEntryPage() {
  const db = usePowerSync();
  const router = useRouter();
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [header, setHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: "",
    description: "",
  });

  const [lines, setLines] = useState<any[]>([
    { id: crypto.randomUUID(), accountId: "", description: "", debit: 0, credit: 0 },
    { id: crypto.randomUUID(), accountId: "", description: "", debit: 0, credit: 0 },
  ]);

  const fetchAccounts = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAll("SELECT id, code, name, type FROM accounts WHERE is_active = 1 OR is_active = 'true' ORDER BY code ASC");
      setAccounts(result);
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHeader(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    setLines(prev => {
      const newLines = [...prev];
      if (field === 'debit') {
        newLines[index].debit = Number(value);
        if (Number(value) > 0) newLines[index].credit = 0; // Clear credit if debit is entered
      } else if (field === 'credit') {
        newLines[index].credit = Number(value);
        if (Number(value) > 0) newLines[index].debit = 0; // Clear debit if credit is entered
      } else {
        newLines[index][field] = value;
      }
      return newLines;
    });
  };

  const addLine = () => {
    setLines(prev => [...prev, { id: crypto.randomUUID(), accountId: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return; // Enforce minimum 2 lines
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!isBalanced) {
      setError("Total Debits must equal Total Credits.");
      return;
    }
    
    // Validate lines
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].accountId) {
        setError(`Please select an account for line ${i + 1}.`);
        return;
      }
      if (lines[i].debit === 0 && lines[i].credit === 0) {
        setError(`Line ${i + 1} must have a debit or credit amount.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const tenantRes = await db.getAll("SELECT id FROM tenants LIMIT 1");
      const tenantId = tenantRes.length > 0 ? tenantRes[0].id : crypto.randomUUID();

      const journalId = crypto.randomUUID();
      // Generate dummy entry number
      const entryNumber = `JE-${Date.now().toString().slice(-6)}`;

      await db.execute(
        `INSERT INTO journal_entries (id, tenant_id, entry_number, date, description, reference, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'posted', datetime('now'), datetime('now'))`,
        [journalId, tenantId, entryNumber, header.date, header.description, header.reference]
      );

      for (const line of lines) {
        const lineId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO journal_lines (id, tenant_id, journal_entry_id, account_id, debit, credit, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [lineId, tenantId, journalId, line.accountId, line.debit, line.credit, line.description || header.description]
        );
      }

      router.push('/accounting/journals');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save journal entry.");
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
          <div className="m-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="p-6 border-b border-slate-100 grid grid-cols-3 gap-6">
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
              placeholder="e.g. Invoice #1234"
            />
          </div>
          <div className="space-y-1 col-span-3">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea 
              name="description"
              value={header.description}
              onChange={handleHeaderChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Internal notes or description for this journal..."
            />
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold w-1/3">Account</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold w-32 text-right">Debit</th>
                <th className="p-4 font-semibold w-32 text-right">Credit</th>
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
                      onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Account...</option>
                      {accounts.map(acc => (
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
                      onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-transparent hover:border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      placeholder="Line description (optional)"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit || ""}
                      onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit || ""}
                      onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      type="button" 
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 2}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
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
                <td className="p-4 text-right font-semibold text-slate-800">
                  {totalDebit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
                <td className="p-4 text-right font-semibold text-slate-800">
                  {totalCredit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
                <td></td>
              </tr>
              {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
                <tr className="bg-red-50/50">
                  <td colSpan={5} className="p-3 text-center text-sm font-medium text-red-600">
                    Difference: {Math.abs(totalDebit - totalCredit).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end space-x-4 bg-slate-50/50">
          <Link href="/accounting/journals" className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
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
