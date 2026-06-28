"use client";

import React, { forwardRef } from "react";
import { InvoiceData, CURRENCIES } from "@/lib/invoice-schema";
import { DICT, InvoiceLang } from "@/lib/invoice-i18n";

interface InvoicePreviewProps {
  data: InvoiceData;
  lang?: InvoiceLang;
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data, lang = "en" }, ref) => {
    const t = DICT[lang || "en"];
    const items = data?.items || [];
    const enableTax = data?.enableTax;
    const taxRate = Number(data?.taxRate) || 0;
    const currencyCode = data?.currency || "USD";
    const accentColor = data?.accentColor || "#6d28d9";
    const discountType = data?.discountType || "percentage";
    const discountValue = Number(data?.discountValue) || 0;
    const paymentType = data?.paymentType || "Full Payment";
    const amountPaid = Number(data?.amountPaid) || 0;

    const currObj = CURRENCIES.find((c) => c.code === currencyCode) || { symbol: currencyCode || "$", code: currencyCode || "USD" };

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
    const balanceDue = Math.max(0, total - amountPaid);

    const formatCurr = (amount: number) => {
      return `${currObj.symbol} ${amount.toFixed(2)}`;
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return dateString;
      } catch {
        return dateString || "";
      }
    };

    const statusMap: Record<string, string> = {
      "Full Payment": t.statusFull,
      "Advanced Payment": t.statusAdvance,
      "Partial Payment": t.statusPartial,
      "Due": t.statusDue,
    };
    const translatedStatus = statusMap[paymentType] || paymentType;

    return (
      <div
        ref={ref}
        data-invoice-container="true"
        className="w-[794px] min-h-[1123px] bg-white p-12 text-slate-800 flex flex-col shrink-0 box-border select-text relative overflow-hidden m-0"
        style={{ color: "#1e293b", backgroundColor: "#ffffff", fontFamily: "'Latha', 'Mukta Malar', 'Abhaya Libre', 'Nirmala UI', 'Iskoola Pota', Arial, Helvetica, sans-serif" }}
      >
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-3" style={{ backgroundColor: accentColor }} />

        {/* Header Section */}
        <div className="flex justify-between items-start pt-4 mb-10">
          <div className="max-w-[55%] space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {data?.companyName || t.placeholderCompanyName}
            </h1>
            {data?.companyPhone && <p className="text-xs text-slate-600 font-medium">{data.companyPhone}</p>}
            {data?.companyEmail && <p className="text-xs text-slate-600 font-medium">{data.companyEmail}</p>}
            {data?.companyAddress && (
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{data.companyAddress}</p>
            )}
            {data?.companyWebsite && <p className="text-xs text-slate-600 font-medium">{data.companyWebsite}</p>}
          </div>

          <div className="w-[260px] shrink-0 flex flex-col items-end">
            {data?.logo && (
              <img
                src={data.logo}
                alt="Logo"
                className="max-h-16 max-w-[180px] object-contain mb-6 self-end"
              />
            )}
            <div className="w-full text-right block m-0 p-0">
              <div style={{ width: "100%", textAlign: "right", margin: 0, padding: 0 }}>
                <span
                  className="text-[36px] font-black tracking-[0.08em] uppercase m-0 p-0 inline-block leading-none"
                  style={{ color: accentColor }}
                >
                  {t.docInvoiceTitle}
                </span>
              </div>
              <div style={{ height: "24px", width: "100%", display: "block", margin: 0, padding: 0 }} />
              <div style={{ width: "100%", textAlign: "right", margin: 0, padding: 0 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "140px",
                    height: "28px",
                    padding: "0 14px",
                    boxSizing: "border-box",
                    color: "#1e293b",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0px",
                      lineHeight: "1",
                      whiteSpace: "nowrap",
                      position: "relative",
                      top: "-2.5px",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    {translatedStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Column Metadata Box */}
        <div className="grid grid-cols-3 gap-6 mb-10 p-5 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
          <div>
            <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[10px]" style={{ color: accentColor }}>
              {t.docCustomer}
            </span>
            <p className="font-bold text-slate-900">{data?.clientName || t.placeholderCustomerName}</p>
            {data?.clientPhone && <p className="text-slate-600 mt-0.5">{data.clientPhone}</p>}
          </div>

          <div>
            <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[10px]" style={{ color: accentColor }}>
              {t.billTo}
            </span>
            <p className="font-bold text-slate-900">{data?.clientName || t.placeholderCustomerName}</p>
            {data?.clientAddress && <p className="text-slate-600 whitespace-pre-wrap mt-0.5">{data.clientAddress}</p>}
          </div>

          <div>
            <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[10px]" style={{ color: accentColor }}>
              {t.shipTo}
            </span>
            <p className="text-slate-600 whitespace-pre-wrap">
              {data?.shippingAddress || data?.clientAddress || t.sameAsBilling}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8 flex-grow">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[38%]" />
              <col className="w-[10%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-900 text-[11px] font-black uppercase tracking-wider">
                <th className="py-3 px-2 text-left">{t.itemColLabel}</th>
                <th className="py-3 px-2 text-left">{t.docItemDesc}</th>
                <th className="py-3 px-2 text-center">{t.docQty}</th>
                <th className="py-3 px-2 text-right">{t.docRate}</th>
                <th className="py-3 px-2 text-right">{t.docAmount}</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {items.map((item, index) => {
                const q = Number(item.quantity) || 0;
                const r = Number(item.rate) || 0;
                const d = Number(item.discount) || 0;
                const amt = Math.max(0, q * r - d);

                return (
                  <tr key={index} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-2 font-bold text-slate-900 align-top text-left break-normal whitespace-normal">
                      {item.productName || t.placeholderItemName}
                    </td>
                    <td className="py-3.5 px-2 text-slate-600 font-medium align-top text-left leading-relaxed break-normal whitespace-normal">
                      {item.description || t.placeholderItemDesc}
                      {d > 0 && <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">({t.docDiscount}: {formatCurr(d)})</span>}
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-700 font-bold align-top font-mono">
                      {q}
                    </td>
                    <td className="py-3.5 px-2 text-right text-slate-700 font-medium align-top font-mono">
                      {formatCurr(r)}
                    </td>
                    <td className="py-3.5 px-2 text-right text-slate-900 font-bold align-top font-mono">
                      {formatCurr(amt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mb-10 w-full">
          <div className="ml-auto block w-[340px] border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-2.5 text-xs box-border">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>{t.docSubtotal} ({currObj.code})</span>
              <span className="font-mono text-slate-800 font-bold">{formatCurr(subtotal)}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between items-center text-emerald-600 font-medium">
                <span>{t.docDiscount} ({discountType === "percentage" ? `${discountValue}%` : currObj.code})</span>
                <span className="font-mono font-bold">- {formatCurr(discountAmt)}</span>
              </div>
            )}

            {enableTax && taxRate > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>{t.docTax} ({taxRate}%)</span>
                <span className="font-mono text-slate-800 font-bold">{formatCurr(taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-300 text-sm font-black text-slate-900">
              <span>{t.docTotal} ({currObj.code})</span>
              <span className="font-mono text-base" style={{ color: accentColor }}>
                {formatCurr(total)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 text-slate-600 font-medium">
              <span>{t.docPaidAmount} ({currObj.code})</span>
              <span className="font-mono font-bold">{formatCurr(amountPaid)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-extrabold text-red-600">
              <span>{t.docBalance} ({currObj.code})</span>
              <span className="font-mono">{formatCurr(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Bank Details */}
        {data?.notes && (
          <div className="mb-8 pt-6 border-t border-slate-200 text-xs">
            <span className="font-bold block mb-1.5 uppercase tracking-wider text-[10px] text-slate-400">
              {t.docPaymentTerms}
            </span>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {data.notes}
            </p>
          </div>
        )}

        {/* Bottom Bar matching inspiration + viral marketing link */}
        <div className="mt-auto border border-slate-200 rounded-xl px-6 py-4 bg-slate-50 flex justify-between items-center text-xs text-slate-700 font-bold box-border shrink-0 gap-2 select-none">
          <span className="font-mono whitespace-nowrap leading-normal">{t.docInvNo}: {data?.invoiceNumber || "INV-001"}</span>
          <span className="text-[11px] text-slate-500 font-medium text-center whitespace-nowrap leading-normal">
            {t.docAttribution} <span className="font-bold text-indigo-600 underline">zynveo.com</span>
          </span>
          <span className="font-mono whitespace-nowrap leading-normal">{t.docDate}: {formatDate(data?.date)}</span>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
export default InvoicePreview;
