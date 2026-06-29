"use client";

import React, { forwardRef } from "react";
import { PayslipData, numberToWords } from "@/lib/payslip-schema";
import { CURRENCIES } from "@/lib/invoice-schema";

interface PayslipPreviewProps {
  data: PayslipData;
}

const PayslipPreview = forwardRef<HTMLDivElement, PayslipPreviewProps>(
  ({ data }, ref) => {
    const earnings = data?.earnings || [];
    const deductions = data?.deductions || [];
    const currencyCode = data?.currency || "LKR";
    const customEmployeeFields = data?.customEmployeeFields || [];
    const customPaySummaryFields = data?.customPaySummaryFields || [];

    const currObj = CURRENCIES.find((c) => c.code === currencyCode) || {
      symbol: currencyCode || "Rs.",
      code: currencyCode || "LKR",
    };

    const grossEarnings = earnings.reduce(
      (acc, item) => acc + (Number(item.amount) || 0),
      0
    );

    const totalDeductions = deductions.reduce(
      (acc, item) => acc + (Number(item.amount) || 0),
      0
    );

    const netPayable = Math.max(0, grossEarnings - totalDeductions);

    const formatCurr = (amount: number) => {
      return `${currObj.symbol} ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    // Pad arrays to have equal length for side-by-side table rendering
    const maxRows = Math.max(earnings.length, deductions.length, 3);

    return (
      <div
        ref={ref}
        data-payslip-container="true"
        className="w-[794px] min-h-[1123px] bg-white p-12 text-slate-800 flex flex-col shrink-0 box-border select-text relative overflow-hidden m-0"
        style={{
          color: "#1e293b",
          backgroundColor: "#ffffff",
          fontFamily:
            "'Inter', 'Segoe UI', Arial, Helvetica, sans-serif",
        }}
      >
        {/* Top Accent Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: "#4F46E5" }}
        />

        {/* ── Header Section ─────────────────────────────────────────────── */}
        <div className="flex justify-between items-start pt-4 mb-6">
          <div className="max-w-[55%] space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {data?.companyName || "Your Company Name"}
            </h1>
            {data?.companyAddress && (
              <p className="text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed font-medium">
                {data.companyAddress}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            {data?.companyLogo && (
              <img
                src={data.companyLogo}
                alt="Logo"
                className="max-h-14 max-w-[160px] object-contain"
              />
            )}
            <div className="text-right">
              <span
                className="text-[32px] font-black tracking-[0.06em] uppercase leading-none"
                style={{ color: "#4F46E5" }}
              >
                Salary Slip
              </span>
              <p className="text-xs text-slate-400 font-semibold mt-1.5">
                For the month of {data?.month || "Month"}{" "}
                {data?.year || "Year"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Employee Details Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-6 p-5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs">
          {[
            { label: "Employee Name", value: data?.employeeName },
            { label: "Employee ID", value: data?.employeeId },
            { label: "Designation", value: data?.designation },
            { label: "Department", value: data?.department },
            ...(data?.panNumber
              ? [{ label: "PAN Number", value: data.panNumber }]
              : []),
            { label: "Paid Days", value: String(data?.paidDays ?? 30) },
            {
              label: "Loss of Pay Days",
              value: String(data?.lopDays ?? 0),
            },
            ...(data?.payDate
              ? [{ label: "Pay Date", value: data.payDate }]
              : []),
            ...customEmployeeFields
              .filter((f) => f.label && f.value)
              .map((f) => ({ label: f.label, value: f.value })),
            ...customPaySummaryFields
              .filter((f) => f.label && f.value)
              .map((f) => ({ label: f.label, value: f.value })),
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2.5 border-b border-slate-200/80 last:border-b-0"
            >
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                {item.label}
              </span>
              <span className="font-bold text-slate-900 text-[11px]">
                {item.value || "---"}
              </span>
            </div>
          ))}
        </div>

        {/* ── Financial Tables (Side-by-Side) ────────────────────────────── */}
        <div className="flex gap-5 mb-6 flex-grow">
          {/* Earnings Table */}
          <div className="w-1/2">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#4F46E5" }}>
                  <th className="text-left p-3 text-[11px] font-black text-white uppercase tracking-wider border border-slate-300">
                    Earnings
                  </th>
                  <th className="text-right p-3 text-[11px] font-black text-white uppercase tracking-wider border border-slate-300 w-[140px]">
                    Amount ({currObj.code})
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => {
                  const item = earnings[i];
                  return (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="p-3 text-[11px] border border-slate-200 text-slate-700 font-semibold">
                        {item?.label || ""}
                      </td>
                      <td className="p-3 text-[11px] border border-slate-200 text-right font-bold font-mono text-slate-800">
                        {item ? formatCurr(Number(item.amount) || 0) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100">
                  <td className="p-3 text-[11px] border border-slate-300 font-black text-slate-900 uppercase tracking-wider">
                    Gross Earnings
                  </td>
                  <td className="p-3 text-[11px] border border-slate-300 text-right font-black font-mono text-slate-900">
                    {formatCurr(grossEarnings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions Table */}
          <div className="w-1/2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="text-left p-3 text-[11px] font-black text-white uppercase tracking-wider border border-slate-300">
                    Deductions
                  </th>
                  <th className="text-right p-3 text-[11px] font-black text-white uppercase tracking-wider border border-slate-300 w-[140px]">
                    Amount ({currObj.code})
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => {
                  const item = deductions[i];
                  return (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="p-3 text-[11px] border border-slate-200 text-slate-700 font-semibold">
                        {item?.label || ""}
                      </td>
                      <td className="p-3 text-[11px] border border-slate-200 text-right font-bold font-mono text-slate-800">
                        {item ? formatCurr(Number(item.amount) || 0) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100">
                  <td className="p-3 text-[11px] border border-slate-300 font-black text-slate-900 uppercase tracking-wider">
                    Total Deductions
                  </td>
                  <td className="p-3 text-[11px] border border-slate-300 text-right font-black font-mono text-slate-900">
                    {formatCurr(totalDeductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Net Salary Payable ──────────────────────────────────────────── */}
        <div
          className="p-6 flex justify-between items-center rounded-xl mb-3"
          style={{
            backgroundColor: "#EEF2FF",
            border: "2px solid #C7D2FE",
          }}
        >
          <span className="text-base font-black text-slate-900 uppercase tracking-wider">
            Net Salary Payable
          </span>
          <span
            className="text-3xl font-black"
            style={{ color: "#4F46E5" }}
          >
            {formatCurr(netPayable)}
          </span>
        </div>

        {/* ── Amount in Words ─────────────────────────────────────────────── */}
        <div className="mb-6 px-1">
          <p className="text-[11px] text-slate-500 font-semibold">
            <span className="font-bold text-slate-700">Amount in words: </span>
            {numberToWords(netPayable)}
          </p>
        </div>

        {/* ── Signature Lines ─────────────────────────────────────────────── */}
        <div className="mt-auto pt-16 flex justify-between px-8">
          <div className="text-center">
            <div className="w-48 border-t-2 border-slate-400 mx-auto" />
            <p className="mt-2.5 text-[11px] text-slate-500 font-bold">
              Employer Signature
            </p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t-2 border-slate-400 mx-auto" />
            <p className="mt-2.5 text-[11px] text-slate-500 font-bold">
              Employee Signature
            </p>
          </div>
        </div>

        {/* ── Footer Attribution ──────────────────────────────────────────── */}
        <div className="mt-8 border border-slate-200 rounded-lg px-6 py-3.5 bg-slate-50 flex justify-between items-center text-[10px] text-slate-500 font-semibold box-border shrink-0 gap-2 select-none">
          <span>This is a system-generated payslip.</span>
          <span>
            Generated via{" "}
            <span className="font-bold text-indigo-600 underline">
              zynveo.com
            </span>
          </span>
        </div>
      </div>
    );
  }
);

PayslipPreview.displayName = "PayslipPreview";
export default PayslipPreview;
