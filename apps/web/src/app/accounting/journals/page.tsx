"use client";

import React, { useEffect, useState, useCallback } from "react";
import Decimal from "decimal.js";
import { Plus, Search, Eye, X, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { erpApi } from "../../../lib/api";

interface JournalSummary {
  id: string;
  entryNumber: string;
  date: string;
  description?: string | null;
  reference?: string | null;
  sourceModule: string;
  status: string;
  totalAmount: string;
}

interface JournalDetailLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description?: string | null;
}

interface JournalDetail {
  id: string;
  entryNumber: string;
  date: string;
  description?: string | null;
  reference?: string | null;
  sourceModule: string;
  status: string;
  lines: JournalDetailLine[];
}

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState<JournalSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<JournalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchJournals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await erpApi.finance.listJournals();
      setJournals(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch journal entries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleViewJournal = async (id: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await erpApi.finance.getJournalDetail(id);
      setSelectedJournal(detail);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load journal detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredJournals = journals.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      j.entryNumber.toLowerCase().includes(q) ||
      (j.description && j.description.toLowerCase().includes(q)) ||
      (j.reference && j.reference.toLowerCase().includes(q))
    );
  });

  const formatMoney = (val: string | number) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-1">Record and inspect double-entry General Ledger postings</p>
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
          <button
            onClick={fetchJournals}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/accounting/journals/new"
            className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Journal</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Entry #</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Amount (LKR)</th>
                <th className="p-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournals.map((journal) => {
                const statusUpper = (journal.status || "POSTED").toUpperCase();
                return (
                  <tr key={journal.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">{new Date(journal.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-mono font-medium text-blue-600">{journal.entryNumber}</td>
                    <td className="p-4 text-xs font-medium text-slate-500 uppercase">{journal.sourceModule}</td>
                    <td className="p-4 text-sm text-slate-700">{journal.description || "-"}</td>
                    <td className="p-4 text-sm text-slate-500">{journal.reference || "-"}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          statusUpper === "POSTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : statusUpper === "DRAFT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {statusUpper}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono font-medium text-slate-800 text-right">
                      {formatMoney(journal.totalAmount)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewJournal(journal.id)}
                        disabled={detailLoading}
                        title="View journal lines"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filteredJournals.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No journal entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJournal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Journal {selectedJournal.entryNumber}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(selectedJournal.date).toLocaleDateString()} • {selectedJournal.sourceModule} • {selectedJournal.description}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedJournal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2 pr-3">Account</th>
                    <th className="py-2 px-3">Line Note</th>
                    <th className="py-2 px-3 text-right">Debit</th>
                    <th className="py-2 pl-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedJournal.lines.map((line) => (
                    <tr key={line.id} className="border-b border-slate-100 text-sm">
                      <td className="py-3 pr-3 font-medium text-slate-700">
                        <span className="font-mono text-xs text-slate-500 mr-2">{line.accountCode}</span>
                        {line.accountName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{line.description || "-"}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">
                        {new Decimal(line.debit || 0).gt(0) ? formatMoney(line.debit) : "-"}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono text-slate-800">
                        {new Decimal(line.credit || 0).gt(0) ? formatMoney(line.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedJournal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
