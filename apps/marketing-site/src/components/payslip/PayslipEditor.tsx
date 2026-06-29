"use client";

import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Building2,
  User,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  Briefcase,
  BadgePlus,
} from "lucide-react";
import { PayslipData, MONTHS, YEARS } from "@/lib/payslip-schema";
import { CURRENCIES } from "@/lib/invoice-schema";
import Link from "next/link";

interface PayslipEditorProps {
  form: UseFormReturn<PayslipData>;
}

export default function PayslipEditor({ form }: PayslipEditorProps) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const {
    fields: earningFields,
    append: appendEarning,
    remove: removeEarning,
  } = useFieldArray({ control, name: "earnings" });

  const {
    fields: deductionFields,
    append: appendDeduction,
    remove: removeDeduction,
  } = useFieldArray({ control, name: "deductions" });

  const {
    fields: customEmpFields,
    append: appendCustomEmp,
    remove: removeCustomEmp,
  } = useFieldArray({ control, name: "customEmployeeFields" });

  const {
    fields: customPayFields,
    append: appendCustomPay,
    remove: removeCustomPay,
  } = useFieldArray({ control, name: "customPaySummaryFields" });

  const companyLogo = watch("companyLogo");
  const earnings = watch("earnings") || [];
  const deductions = watch("deductions") || [];
  const currencyCode = watch("currency");

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo image size must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("companyLogo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const inputClass =
    "w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all";
  const inputBoldClass =
    "w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all";
  const labelClass =
    "block text-[11px] font-bold text-neutral-muted uppercase mb-1 tracking-wider";

  return (
    <div className="w-full space-y-6">
      {/* ═══ CARD 1: COMPANY DETAILS ═══ */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-neutral-border/60 pb-4">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-text tracking-tight">
              Company Details
            </h2>
            <p className="text-xs text-neutral-muted font-medium">
              Your business name, address, and logo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              placeholder="e.g., Delight Consumer Products"
              {...register("companyName")}
              className={inputBoldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Company Address</label>
            <input
              type="text"
              placeholder="e.g., 42 Galle Road, Colombo 03"
              {...register("companyAddress")}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Company Logo</label>
            {companyLogo ? (
              <div className="relative inline-flex items-center border border-neutral-border rounded-2xl p-2 bg-white shadow-sm gap-3">
                <img
                  src={companyLogo}
                  alt="Logo"
                  className="h-10 w-auto max-w-[120px] object-contain"
                />
                <button
                  type="button"
                  onClick={() => setValue("companyLogo", "")}
                  className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center px-4 py-2.5 border-2 border-dashed border-neutral-border rounded-xl cursor-pointer bg-neutral-bg/50 hover:bg-primary/5 hover:border-primary/40 transition-all text-xs font-bold text-neutral-muted gap-2">
                <Upload size={14} />
                <span>Upload Logo (Max 2MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CARD 2: PAY SUMMARY ═══ */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-neutral-border/60 pb-4">
          <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-text tracking-tight">
              Employee Pay Summary
            </h2>
            <p className="text-xs text-neutral-muted font-medium">
              Select the month, year, and provide payment information.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Month</label>
            <select {...register("month")} className={inputBoldClass}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Year</label>
            <select {...register("year")} className={inputBoldClass}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Paid Days<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="E.g., 22"
              {...register("paidDays")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Loss of Pay Days</label>
            <input
              type="number"
              placeholder="E.g., 0"
              {...register("lopDays")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pay Date</label>
            <input
              type="date"
              {...register("payDate")}
              className={inputClass}
            />
          </div>
        </div>

        {/* Custom Pay Summary Fields */}
        <div className="pt-2 border-t border-neutral-border/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-muted">
              Custom Pay Summary Fields
            </span>
            <button
              type="button"
              onClick={() => appendCustomPay({ label: "", value: "" })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-bg hover:bg-primary/10 text-xs font-bold text-neutral-text border border-neutral-border transition-all"
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
          {customPayFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Field Name"
                {...register(
                  `customPaySummaryFields.${index}.label` as const
                )}
                className="flex-1 text-xs p-2.5 rounded-lg bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Value"
                {...register(
                  `customPaySummaryFields.${index}.value` as const
                )}
                className="flex-1 text-xs p-2.5 rounded-lg bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => removeCustomPay(index)}
                className="p-2 text-neutral-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CARD 3: EMPLOYEE INFORMATION ═══ */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-neutral-border/60 pb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-text tracking-tight">
              Employee Information
            </h2>
            <p className="text-xs text-neutral-muted font-medium">
              Enter the employee details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Employee Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Jane Doe"
              {...register("employeeName")}
              className={inputBoldClass}
            />
            {errors.employeeName && (
              <p className="text-xs text-red-500 mt-1 font-semibold">
                {errors.employeeName.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Employee ID</label>
            <input
              type="text"
              placeholder="e.g., EMP-042"
              {...register("employeeId")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Designation</label>
            <input
              type="text"
              placeholder="e.g., Sales Executive"
              {...register("designation")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input
              type="text"
              placeholder="e.g., Sales & Marketing"
              {...register("department")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>PAN Number</label>
            <input
              type="text"
              placeholder="e.g., ABCDE1234F"
              {...register("panNumber")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select
              {...register("currency")}
              className={inputBoldClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Employee Fields */}
        <div className="pt-2 border-t border-neutral-border/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-muted">
              Custom Employee Fields
            </span>
            <button
              type="button"
              onClick={() => appendCustomEmp({ label: "", value: "" })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-bg hover:bg-primary/10 text-xs font-bold text-neutral-text border border-neutral-border transition-all"
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
          {customEmpFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Field Name"
                {...register(
                  `customEmployeeFields.${index}.label` as const
                )}
                className="flex-1 text-xs p-2.5 rounded-lg bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Value"
                {...register(
                  `customEmployeeFields.${index}.value` as const
                )}
                className="flex-1 text-xs p-2.5 rounded-lg bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => removeCustomEmp(index)}
                className="p-2 text-neutral-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CARD 4: SALARY COMPONENTS ═══ */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-neutral-border/60 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-text tracking-tight">
              Salary Components
            </h2>
            <p className="text-xs text-neutral-muted font-medium">
              Add all earnings and deductions that make up the
              employee&apos;s salary.
            </p>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-700 flex items-center gap-1.5">
              <BadgePlus size={14} /> Earnings
            </h3>
            <button
              type="button"
              onClick={() => appendEarning({ label: "", amount: 0 })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 border border-emerald-200 transition-all"
            >
              <Plus size={12} /> Add Earning
            </button>
          </div>

          {earningFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 sm:gap-3"
            >
              <input
                type="text"
                placeholder="e.g., Basic Salary"
                {...register(`earnings.${index}.label` as const)}
                className="flex-grow text-sm p-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all min-w-0"
              />
              <input
                type="number"
                step="0.01"
                placeholder="0"
                {...register(`earnings.${index}.amount` as const)}
                className="w-24 sm:w-28 text-sm p-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-right text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all shrink-0"
              />
              <button
                type="button"
                disabled={earningFields.length === 1}
                onClick={() => removeEarning(index)}
                className="p-2 text-neutral-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 disabled:opacity-20"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-black text-emerald-800">
            <span>Gross Earnings</span>
            <span className="font-mono">
              {currObj.symbol} {grossEarnings.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-border/60" />

        {/* Deductions Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-red-700 flex items-center gap-1.5">
              <Briefcase size={14} /> Deductions
            </h3>
            <button
              type="button"
              onClick={() => appendDeduction({ label: "", amount: 0 })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 border border-red-200 transition-all"
            >
              <Plus size={12} /> Add Deduction
            </button>
          </div>

          {deductionFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 sm:gap-3"
            >
              <input
                type="text"
                placeholder="e.g., Income Tax"
                {...register(`deductions.${index}.label` as const)}
                className="flex-grow text-sm p-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all min-w-0"
              />
              <input
                type="number"
                step="0.01"
                placeholder="0"
                {...register(`deductions.${index}.amount` as const)}
                className="w-24 sm:w-28 text-sm p-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-right text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all shrink-0"
              />
              <button
                type="button"
                onClick={() => removeDeduction(index)}
                className="p-2 text-neutral-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {deductionFields.length === 0 && (
            <p className="text-xs text-neutral-muted font-medium text-center py-4 bg-neutral-bg/50 rounded-xl border border-dashed border-neutral-border">
              No deductions added yet. Click &quot;Add Deduction&quot;
              above.
            </p>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200 text-sm font-black text-red-800">
            <span>Total Deductions</span>
            <span className="font-mono">
              {currObj.symbol} {totalDeductions.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ CARD 5: NET PAYABLE SUMMARY ═══ */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-4">
        <h2 className="text-lg font-black text-neutral-text tracking-tight border-b border-neutral-border/60 pb-3">
          Net Payable Summary
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center font-bold text-neutral-muted">
            <span>Gross Earnings</span>
            <span className="font-mono text-neutral-text">
              {currObj.symbol} {grossEarnings.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center font-bold text-red-600">
            <span>Total Deductions</span>
            <span className="font-mono">
              − {currObj.symbol} {totalDeductions.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-lg font-black text-neutral-text">
            <span>Net Salary Payable</span>
            <span className="font-mono text-primary">
              {currObj.symbol} {netPayable.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ CARD 6: HR MODULE UPSELL HOOK ═══ */}
      <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
            <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: "8s" }} />
            <span>Pro HR Module</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">
            Tired of making these one by one?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
            Our upcoming HR &amp; Accounting module automates payroll,
            calculates taxes, and emails PDF payslips to your entire team
            in one click. No more manual salary stubs.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg transition-all active:scale-95 group/btn"
            >
              <span>Join the HR Module Waitlist</span>
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
