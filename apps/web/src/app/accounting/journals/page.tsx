"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePowerSync } from "../../../components/PowerSyncProvider";
import { Plus, Search, Eye } from "lucide-react";
import Link from "next/link";

export default function JournalEntriesPage() {
  const db = usePowerSync();
  const [journals, setJournals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchJournals = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAll(`
        SELECT 
          je.id, je.entry_number, je.date, je.description, je.reference, je.status,
          SUM(jl.debit) as total_amount
        FROM journal_entries je
        LEFT JOIN journal_lines jl ON je.id = jl.journal_entry_id
        GROUP BY je.id, je.entry_number, je.date, je.description, je.reference, je.status
        ORDER BY je.date DESC, je.created_at DESC
      `);
      setJournals(result);
    } catch (e) {
      console.error("Failed to fetch journals:", e);
    }
  }, [db]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const filteredJournals = journals.filter(j => 
    (j.entry_number && j.entry_number.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (j.description && j.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (j.reference && j.reference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-1">Record and view manual accounting entries</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search journals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <Link href="/accounting/journals/new" className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16} />
            <span>New Journal</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Entry #</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournals.map((journal: any) => (
                <tr key={journal.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(journal.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm font-medium text-blue-600">{journal.entry_number}</td>
                  <td className="p-4 text-sm text-slate-700">{journal.description || '-'}</td>
                  <td className="p-4 text-sm text-slate-500">{journal.reference || '-'}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      journal.status === 'posted' ? 'bg-emerald-100 text-emerald-800' : 
                      journal.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {journal.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-800 text-right">
                    {Number(journal.total_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredJournals.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No journal entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
