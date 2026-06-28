"use client";

import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { 
  Plus, Trash2, Upload, X, Calendar, Building2, 
  User, Layers, Sparkles, ArrowRight, Palette, Sliders, FileText
} from "lucide-react";
import { InvoiceData, CURRENCIES, ACCENT_COLORS } from "@/lib/invoice-schema";
import { DICT, InvoiceLang } from "@/lib/invoice-i18n";
import Link from "next/link";

interface InvoiceEditorProps {
  form: UseFormReturn<InvoiceData>;
  lang?: InvoiceLang;
}

export default function InvoiceEditor({ form, lang = "en" }: InvoiceEditorProps) {
  const t = DICT[lang || "en"];
  const { register, control, setValue, watch, formState: { errors } } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const logoBase64 = watch("logo");
  const items = watch("items") || [];
  const currencyCode = watch("currency");
  const accentColor = watch("accentColor") || "#6d28d9";
  const discountType = watch("discountType") || "percentage";
  const enableTax = watch("enableTax");
  const taxRate = Number(watch("taxRate")) || 0;
  const discountValue = Number(watch("discountValue")) || 0;
  const amountPaid = Number(watch("amountPaid")) || 0;

  const currObj = CURRENCIES.find((c) => c.code === currencyCode) || { symbol: currencyCode || "$", code: currencyCode || "USD" };

  // Calculate live preview totals for the sidebar card
  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );
  
  let discountAmt = 0;
  if (discountType === "percentage") {
    discountAmt = subtotal * (discountValue / 100);
  } else {
    discountAmt = discountValue;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmt);
  const taxAmount = enableTax ? taxableAmount * (taxRate / 100) : 0;
  const total = taxableAmount + taxAmount;
  const dueBalance = Math.max(0, total - amountPaid);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo image size must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("logo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* CARD 1: CUSTOMIZATION */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-neutral-border/60 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm shrink-0">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-text tracking-tight">{t.customization}</h2>
            <p className="text-xs text-neutral-muted font-medium">{t.customizationDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          {/* Color Picker */}
          <div className="sm:col-span-6 space-y-2">
            <label className="block text-xs font-bold text-neutral-text uppercase tracking-wider flex items-center justify-between pr-4">
              <span>Brand Accent Color</span>
              <span className="text-[10px] text-neutral-muted font-normal capitalize">Any hex color</span>
            </label>
            
            <div className="flex items-center gap-3 bg-neutral-bg/60 p-2 rounded-2xl border border-neutral-border max-w-[280px]">
              <div className="relative shrink-0">
                <input
                  type="color"
                  {...register("accentColor")}
                  className="w-10 h-10 opacity-0 absolute inset-0 cursor-pointer z-10"
                />
                <div 
                  className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center border border-black/10 transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                  title="Click to open color wheel"
                >
                  <Palette size={16} className="text-white mix-blend-difference opacity-90" />
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex items-center bg-white px-3 py-2 rounded-xl border border-neutral-border/80 focus-within:ring-2 focus-within:ring-primary shadow-sm transition-all">
                  <span className="text-xs font-bold text-neutral-muted mr-1">#</span>
                  <input
                    type="text"
                    value={accentColor ? accentColor.replace("#", "") : "6D28D9"}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      setValue("accentColor", `#${clean}`);
                    }}
                    placeholder="6D28D9"
                    maxLength={6}
                    className="w-full bg-transparent text-xs font-mono font-black uppercase text-neutral-text focus:outline-none tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[10px] font-bold text-neutral-muted mr-1">Presets:</span>
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setValue("accentColor", col.hex)}
                  className={`h-5 w-5 rounded-md transition-all shadow-sm shrink-0 ${accentColor?.toLowerCase() === col.hex.toLowerCase() ? "ring-2 ring-offset-1 ring-slate-900 scale-110" : "hover:scale-110 opacity-75 hover:opacity-100"}`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="sm:col-span-6 space-y-2">
            <label className="block text-xs font-bold text-neutral-text uppercase tracking-wider">
              Business Logo
            </label>
            {logoBase64 ? (
              <div className="relative inline-flex items-center border border-neutral-border rounded-2xl p-2 bg-white shadow-sm gap-3">
                <img src={logoBase64} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" />
                <button
                  type="button"
                  onClick={() => setValue("logo", "")}
                  className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center px-4 py-2.5 border-2 border-dashed border-neutral-border rounded-xl cursor-pointer bg-neutral-bg/50 hover:bg-primary/5 hover:border-primary/40 transition-all text-xs font-bold text-neutral-muted gap-2">
                <Upload size={14} />
                <span>{t.logoUpload}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Business Details Grid */}
        <div className="space-y-4 pt-2">
          <label className="block text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} /> {t.fromLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder={t.companyNamePlaceholder}
                {...register("companyName")}
                className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
              {errors.companyName && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.companyName.message}</p>}
            </div>
            <input
              type="text"
              placeholder={t.companyPhonePlaceholder}
              {...register("companyPhone")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            <input
              type="email"
              placeholder={t.companyEmailPlaceholder}
              {...register("companyEmail")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            <input
              type="text"
              placeholder={t.companyAddressPlaceholder}
              {...register("companyAddress")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            <input
              type="text"
              placeholder={t.companyWebsitePlaceholder}
              {...register("companyWebsite")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* CARD 2: INVOICE BASICS */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center gap-3.5 border-b border-neutral-border/60 pb-4">
          <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-text tracking-tight">{t.businessClient}</h2>
            <p className="text-xs text-neutral-muted font-medium">{t.businessClientDesc}</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} /> {t.toLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder={t.clientNamePlaceholder}
                {...register("clientName")}
                className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
              {errors.clientName && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.clientName.message}</p>}
            </div>
            <input
              type="text"
              placeholder={t.clientPhonePlaceholder}
              {...register("clientPhone")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            <input
              type="text"
              placeholder={t.clientAddressPlaceholder}
              {...register("clientAddress")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder={t.shippingAddressPlaceholder}
                {...register("shippingAddress")}
                className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-neutral-muted uppercase mb-1">{t.invNumberLabel}</label>
            <input
              type="text"
              {...register("invoiceNumber")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-muted uppercase mb-1">{t.currency}</label>
            <select
              {...register("currency")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-neutral-muted uppercase mb-1">{t.issueDateLabel}</label>
            <input
              type="date"
              {...register("date")}
              className="w-full text-sm p-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* CARD 3: ITEMS */}
      <div className="glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-border/60 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-text tracking-tight">{t.lineItemsLabel}</h2>
              <p className="text-xs text-neutral-muted font-medium">{t.lineItemsDesc}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => append({ productName: "", description: "", quantity: 1, rate: 0, discount: 0 })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/20 transition-all active:scale-95 shrink-0"
          >
            <Plus size={14} /> <span>{t.addItemBtn}</span>
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            const q = Number(watch(`items.${index}.quantity`)) || 0;
            const r = Number(watch(`items.${index}.rate`)) || 0;
            const d = Number(watch(`items.${index}.discount`)) || 0;
            const lineTot = Math.max(0, q * r - d);

            return (
              <div key={field.id} className="p-4 rounded-2xl bg-neutral-bg/60 border border-neutral-border/80 space-y-3 relative group transition-all hover:bg-neutral-bg">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-neutral-muted uppercase mb-1">{t.itemColLabel}</label>
                    <input
                      type="text"
                      placeholder={t.placeholderItemName}
                      {...register(`items.${index}.productName` as const)}
                      className="w-full text-sm p-2.5 rounded-xl bg-white border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-bold text-neutral-muted uppercase mb-1">{t.docItemDesc}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.placeholderItemDesc}
                        {...register(`items.${index}.description` as const)}
                        className="w-full text-sm p-2.5 rounded-xl bg-white border border-neutral-border font-medium text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                        className="p-2.5 text-neutral-muted hover:text-red-500 hover:bg-red-50 rounded-xl bg-white border border-neutral-border disabled:opacity-20 transition-all shrink-0"
                        title={t.deleteItemTooltip}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-12 gap-3 items-center pt-1 border-t border-neutral-border/40">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-neutral-muted uppercase mb-1">{t.qtyColLabel}</label>
                    <input
                      type="number"
                      {...register(`items.${index}.quantity` as const)}
                      className="w-full text-sm p-2 rounded-xl bg-white border border-neutral-border font-bold text-center text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-neutral-muted uppercase mb-1">{t.rateColLabel} ({currObj.code})</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.rate` as const)}
                      className="w-full text-sm p-2 rounded-xl bg-white border border-neutral-border font-bold text-right text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-5 flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-5">
                    <span className="text-xs text-neutral-muted font-bold">{t.lineTotalLabel}</span>
                    <span className="text-sm font-mono font-black text-neutral-text">
                      {currObj.symbol} {lineTot.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARD 4: NOTES & TOTALS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notes */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-4">
          <h2 className="text-lg font-black text-neutral-text tracking-tight">{t.notesTermsLabel}</h2>
          <textarea
            rows={6}
            {...register("notes")}
            placeholder={t.notesPlaceholder}
            className="w-full text-sm p-4 rounded-2xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Totals */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-4 sm:p-8 shadow-xl border border-white/80 space-y-4">
          <h2 className="text-lg font-black text-neutral-text tracking-tight border-b border-neutral-border/60 pb-3">
            {t.totalsCalcLabel}
          </h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center font-bold text-neutral-muted">
              <span>{t.subtotalLabel}</span>
              <span className="font-mono text-neutral-text">{currObj.symbol} {subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center gap-4">
              <span className="font-bold text-neutral-muted shrink-0">{t.discountLabel}</span>
              <div className="flex items-center gap-2 max-w-[180px]">
                <select
                  {...register("discountType")}
                  className="text-xs p-1.5 rounded-lg bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:outline-none"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">{currObj.code}</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  {...register("discountValue")}
                  className="w-full text-xs p-1.5 rounded-lg bg-neutral-bg border border-neutral-border font-bold text-right text-neutral-text focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* VAT Switch */}
            <div className="flex justify-between items-center gap-4 py-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-muted select-none">
                <input
                  type="checkbox"
                  {...register("enableTax")}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <span>{t.addTaxLabel}</span>
              </label>
              {enableTax && (
                <div className="flex items-center gap-2 max-w-[120px]">
                  <input
                    type="number"
                    step="0.1"
                    {...register("taxRate")}
                    className="w-16 text-xs p-1.5 rounded-lg bg-neutral-bg border border-neutral-border font-bold text-right text-neutral-text focus:outline-none focus:bg-white"
                  />
                  <span className="text-xs font-bold text-neutral-muted">%</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-lg font-black text-neutral-text">
              <span>{t.totalDueLabel}</span>
              <span className="font-mono text-accent" style={{ color: accentColor }}>
                {currObj.symbol} {total.toFixed(2)}
              </span>
            </div>

            {/* Payment Status Dropdown */}
            <div className="pt-4 border-t border-neutral-border/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-neutral-muted">{t.paymentStatusLabel}</span>
                <select
                  {...register("paymentType")}
                  className="text-xs p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 font-extrabold text-indigo-700 focus:outline-none cursor-pointer"
                >
                  <option value="Full Payment">{t.statusFull}</option>
                  <option value="Advanced Payment">{t.statusAdvance}</option>
                  <option value="Partial Payment">{t.statusPartial}</option>
                  <option value="Due">{t.statusDue}</option>
                </select>
              </div>

              {(watch("paymentType") === "Partial Payment" || watch("paymentType") === "Advanced Payment") && (
                <div className="flex justify-between items-center gap-4 bg-neutral-bg p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-neutral-text">{t.amountPaidLabel} ({currObj.code})</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("amountPaid")}
                    className="w-24 text-xs p-1.5 rounded-lg bg-white border border-neutral-border font-bold text-right text-neutral-text focus:outline-none"
                  />
                </div>
              )}

              {(watch("paymentType") === "Partial Payment" || watch("paymentType") === "Advanced Payment") && (
                <div className="flex justify-between items-center text-xs font-extrabold text-red-600 px-1">
                  <span>{t.balanceDueLabel}</span>
                  <span className="font-mono">{currObj.symbol} {dueBalance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Viral Growth Hook */}
      <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
            <Sparkles className="h-3 w-3 animate-spin" />
            <span>{t.proInvoicing}</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">
            {t.viralTitle}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
            {t.viralDesc}
          </p>
          <div className="pt-2">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg transition-all active:scale-95 group/btn"
            >
              <span>{t.exploreBtn}</span>
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
