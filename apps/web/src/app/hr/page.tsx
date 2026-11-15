"use client";

import React, { useState, useEffect, useCallback } from "react";
import Decimal from "decimal.js";
import { UserCheck, Plus, DollarSign, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { erpApi } from "../../lib/api";

interface EmployeeRow {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  epfNumber?: string | null;
  isActive: boolean;
  basicSalary: string;
  fixedAllowances: string;
}

interface PayrollRunRow {
  id: string;
  runNumber: string;
  periodMonth: number;
  periodYear: number;
  totalGrossSalary: string;
  totalEmployeeEpf8: string;
  totalEmployerEpf12: string;
  totalEmployerEtf3: string;
  totalApitTax: string;
  totalNetPayable: string;
  status: string;
}

export default function HrPayrollPage() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<"employees" | "runs">("employees");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunRow[]>([]);
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());

  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [empNumber, setEmpNumber] = useState(`EMP-${Date.now().toString().slice(-4)}`);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [epfNumber, setEpfNumber] = useState("");
  const [basicSalary, setBasicSalary] = useState("150000.00");
  const [fixedAllowances, setFixedAllowances] = useState("0.00");
  const [isCreatingEmp, setIsCreatingEmp] = useState(false);

  const loadHrData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empsRes, runsRes] = await Promise.all([
        erpApi.hr.listEmployees(),
        erpApi.hr.listPayrollRuns(),
      ]);
      setEmployees(empsRes);
      setPayrollRuns(runsRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load HR & Payroll data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHrData();
  }, [loadHrData]);

  const handleExecutePayroll = async () => {
    const activeIds = employees.filter((e) => e.isActive).map((e) => e.id);
    if (activeIds.length === 0) {
      setError("Add at least one active employee before executing payroll.");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccessBanner(null);
    try {
      const res = await erpApi.hr.executePayrollRun({
        periodMonth,
        periodYear,
        employeeIds: activeIds,
      });

      setActiveTab("runs");
      setSuccessBanner(
        `Payroll Run ${res.runNumber} disbursed! Gross: LKR ${res.totalGrossSalary}, Net Payable: LKR ${res.totalNetPayable}.`
      );
      await loadHrData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute payroll run.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingEmp(true);
    setError(null);
    try {
      await erpApi.hr.createEmployee({
        employeeNumber: empNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: empEmail.trim() || undefined,
        phone: empPhone.trim() || undefined,
        epfNumber: epfNumber.trim() || undefined,
        basicSalary: new Decimal(basicSalary || 0).toFixed(2),
        fixedAllowances: new Decimal(fixedAllowances || 0).toFixed(2),
      });
      setIsEmployeeModalOpen(false);
      setEmpNumber(`EMP-${Date.now().toString().slice(-4)}`);
      setFirstName("");
      setLastName("");
      setEmpEmail("");
      setEmpPhone("");
      setEpfNumber("");
      setSuccessBanner("Employee added with active salary structure.");
      await loadHrData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create employee.");
    } finally {
      setIsCreatingEmp(false);
    }
  };

  const activeEmployees = employees.filter((e) => e.isActive);
  const monthlyGrossDec = activeEmployees.reduce(
    (sum, e) => sum.plus(new Decimal(e.basicSalary || 0)).plus(new Decimal(e.fixedAllowances || 0)),
    new Decimal(0)
  );
  const estEmployeeEpfDec = monthlyGrossDec.mul("0.08");
  const estEmployerContribDec = monthlyGrossDec.mul("0.15");

  const formatMoney = (val: string | Decimal) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <UserCheck size={16} />
            <span>Human Capital & Payroll Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">HR & Payroll Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Statutory calculations (EPF 8%/12%, ETF 3%, APIT Tax) and automated General Ledger disbursement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadHrData}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
          >
            {Array.from({ length: 12 }, (_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                Month {idx + 1}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={2024}
            max={2100}
            value={periodYear}
            onChange={(e) => setPeriodYear(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-white"
          />
          <button
            type="button"
            onClick={() => setIsEmployeeModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
          <button
            type="button"
            onClick={handleExecutePayroll}
            disabled={isExecuting || activeEmployees.length === 0}
            className="flex items-center space-x-2 text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <DollarSign size={16} />
            <span>{isExecuting ? "Calculating..." : `Execute Payroll (${periodYear}-${String(periodMonth).padStart(2, "0")})`}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Active Staff</div>
          <div className="text-2xl font-bold text-slate-800">{activeEmployees.length} Employees</div>
          <div className="text-xs text-blue-600 font-medium mt-1">EPF/ETF Enrolled</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Monthly Gross Payroll</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(monthlyGrossDec)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Basic + Fixed Allowances</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-purple-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Est. Employee EPF (8%)</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(estEmployeeEpfDec)}</div>
          <div className="text-xs text-purple-600 font-medium mt-1">Statutory employee deduction</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
          <div className="text-xs font-medium text-slate-400 mb-1">Est. Employer EPF/ETF (15%)</div>
          <div className="text-2xl font-bold text-slate-800">LKR {formatMoney(estEmployerContribDec)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">EPF 12% + ETF 3%</div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "employees" ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Staff Directory ({employees.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("runs")}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === "runs" ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Payroll Disbursement Runs ({payrollRuns.length})
        </button>
      </div>

      {activeTab === "employees" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Emp #</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 font-mono text-center">EPF Number</th>
                  <th className="py-3 px-4 text-right">Basic Salary</th>
                  <th className="py-3 px-4 text-right">Allowances</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{emp.employeeNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{emp.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{emp.email || "-"}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">{emp.epfNumber || "-"}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      LKR {formatMoney(emp.basicSalary)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      LKR {formatMoney(emp.fixedAllowances)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {emp.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && employees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No employees registered yet. Click &quot;Add Employee&quot; to onboard staff.
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
                  <th className="py-3 px-4">Run #</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">Emp EPF (8%)</th>
                  <th className="py-3 px-4 text-right">Employer EPF/ETF</th>
                  <th className="py-3 px-4 text-right">APIT Tax</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRuns.map((run) => {
                  const employerTotal = new Decimal(run.totalEmployerEpf12 || 0).plus(new Decimal(run.totalEmployerEtf3 || 0));
                  return (
                    <tr key={run.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{run.runNumber}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {run.periodYear}-{String(run.periodMonth).padStart(2, "0")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                        LKR {formatMoney(run.totalGrossSalary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                        LKR {formatMoney(run.totalEmployeeEpf8)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        LKR {formatMoney(employerTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        LKR {formatMoney(run.totalApitTax)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        LKR {formatMoney(run.totalNetPayable)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && payrollRuns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No payroll runs executed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Add New Employee</h2>
              <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employee # *</label>
                  <input
                    required
                    type="text"
                    value={empNumber}
                    onChange={(e) => setEmpNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">EPF Number</label>
                  <input
                    type="text"
                    value={epfNumber}
                    onChange={(e) => setEpfNumber(e.target.value)}
                    placeholder="e.g. EPF-4091"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Basic Salary (LKR) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fixed Allowances (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fixedAllowances}
                    onChange={(e) => setFixedAllowances(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEmp}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {isCreatingEmp ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
