"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2, Sparkles, Share2, ShieldCheck, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { invoiceSchema, InvoiceData } from "@/lib/invoice-schema";
import { DICT, InvoiceLang } from "@/lib/invoice-i18n";
import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoicePreview from "@/components/invoice/InvoicePreview";

export function InvoiceGeneratorClient() {
  const previewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lang, setLang] = useState<InvoiceLang>("en");

  const t = DICT[lang];
  const isIndic = lang === "si" || lang === "ta";

  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      accentColor: "#6d28d9",
      logo: "",
      companyName: "",
      companyPhone: "",
      companyEmail: "",
      companyAddress: "",
      companyWebsite: "",

      clientName: "",
      clientPhone: "",
      clientAddress: "",
      shippingAddress: "",

      invoiceNumber: "INV-001",
      date: new Date().toISOString().split("T")[0],
      currency: "USD",
      enableTax: false,
      taxRate: 0,
      discountType: "percentage",
      discountValue: 0,
      paymentType: "Full Payment",
      amountPaid: 0,
      notes: "Thank you for your business! Please remit payment within 30 days.",
      items: [
        { productName: "Web Development", description: "Frontend architecture & design system setup", quantity: 1, rate: 1500, discount: 0 },
        { productName: "UI/UX Design", description: "Figma wireframing & interactive mockups", quantity: 2, rate: 450, discount: 0 },
      ],
    },
    mode: "onChange",
  });

  const formData = form.watch();

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Dynamically measure the exact position of only the zynveo.com text
      const linkEl = printRef.current.querySelector('[data-pdf-link="zynveo"]');
      if (linkEl) {
        const containerRect = printRef.current.getBoundingClientRect();
        const linkRect = linkEl.getBoundingClientRect();

        const relX = linkRect.left - containerRect.left;
        const relY = linkRect.top - containerRect.top;
        const scaleRatio = pdfWidth / 794;
        const padX = 6 * scaleRatio;
        const padY = 4 * scaleRatio;

        pdf.link(
          relX * scaleRatio - padX,
          relY * scaleRatio - padY,
          linkRect.width * scaleRatio + padX * 2,
          linkRect.height * scaleRatio + padY * 2,
          { url: "https://zynveo.com" } as any
        );

        // Intercept internal buffer write during save to reliably append /NewWindow true while preserving 100% accurate xref byte offsets
        const origWrite = (pdf.internal as any).write;
        (pdf.internal as any).write = function (...args: any[]) {
          const modifiedArgs = args.map((arg) => {
            if (typeof arg === "string" && arg.includes("/URI (https://zynveo.com)")) {
              return arg.replace(
                /\/A\s*<<\s*\/S\s*\/URI\s*\/URI\s*\(([^)]+)\)\s*>>/g,
                "/A <</S /URI /URI ($1) /NewWindow true >>"
              );
            }
            return arg;
          });
          return origWrite.apply(this, modifiedArgs);
        };
      }

      pdf.save(`Invoice_${formData.invoiceNumber || "INV-001"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try reloading the page.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-28 lg:pb-12 sm:px-6 lg:px-8 max-w-[1600px]">
      {/* Language Switch Toggle */}
      <div className="flex justify-center mb-8 flex-wrap">
        <div className="bg-slate-200/90 p-1.5 rounded-full inline-flex flex-wrap items-center justify-center gap-1.5 border border-slate-300/80 shadow-inner">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 flex items-center gap-2 ${lang === "en" ? "bg-white text-indigo-700 shadow-md scale-105" : "text-slate-600 hover:text-slate-900"}`}
          >
            <img src="https://flagcdn.com/w40/gb.png" alt="" className="h-3.5 w-5 object-cover rounded-sm shadow-sm shrink-0" /> English
          </button>
          <button
            type="button"
            onClick={() => setLang("si")}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 flex items-center gap-2 ${lang === "si" ? "bg-white text-indigo-700 shadow-md scale-105" : "text-slate-600 hover:text-slate-900"}`}
          >
            <img src="https://flagcdn.com/w40/lk.png" alt="" className="h-3.5 w-5 object-cover rounded-sm shadow-sm shrink-0" /> සිංහල
          </button>
          <button
            type="button"
            onClick={() => setLang("ta")}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 flex items-center gap-2 ${lang === "ta" ? "bg-white text-indigo-700 shadow-md scale-105" : "text-slate-600 hover:text-slate-900"}`}
          >
            <img src="https://flagcdn.com/w40/in.png" alt="" className="h-3.5 w-5 object-cover rounded-sm shadow-sm shrink-0" /> தமிழ் (Tamil)
          </button>
        </div>
      </div>

      {/* Top Value Proposition Banner */}
      <div className="text-center space-y-4 mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-widest shadow-sm animate-bounce">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t.bannerBadge}</span>
        </div>
        <h1
          className={`font-black tracking-tight text-neutral-text ${
            isIndic ? "text-2xl sm:text-4xl leading-snug" : "text-3xl sm:text-5xl"
          }`}
        >
          {t.heroTitle}
        </h1>
        <p
          className={`mx-auto text-neutral-muted font-medium leading-relaxed ${
            isIndic ? "text-sm sm:text-base max-w-3xl" : "text-base sm:text-lg max-w-2xl"
          }`}
        >
          {t.heroDesc}
        </p>

        {/* Shareability Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold text-neutral-muted">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <ShieldCheck className="h-4 w-4" /> {t.privacy}
          </span>
          <span className="flex items-center gap-1.5 text-indigo-600">
            <CheckCircle2 className="h-4 w-4" /> {t.scaling}
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <Share2 className="h-4 w-4" /> {t.frictionless}
          </span>
        </div>
      </div>

      {/* Split Screen Grid */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Column: Editor */}
        <div className="w-full xl:w-5/12 flex-shrink-0">
          <InvoiceEditor form={form} lang={lang} />
        </div>

        {/* Right Column: Live Sticky A4 Preview */}
        <div className="w-full xl:w-7/12 flex flex-col items-center xl:sticky xl:top-24">
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 glass-panel p-4 rounded-2xl border border-neutral-border shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-extrabold text-neutral-text text-sm sm:text-base">{t.livePreview}</span>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-accent/25 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              <span>{isGenerating ? t.generatingBtn : t.downloadBtn}</span>
            </button>
          </div>

          {/* Scaled A4 Sheet Container */}
          <div className="w-full bg-slate-200/70 rounded-3xl p-4 sm:p-8 flex justify-center items-center overflow-hidden border border-slate-300/60 shadow-inner">
            <div className="h-[430px] w-[305px] xs:h-[625px] xs:w-[440px] sm:h-[815px] sm:w-[580px] md:h-[995px] md:w-[705px] lg:h-[1130px] lg:w-[800px] flex justify-center items-start transition-all duration-300">
              <div className="origin-top transform scale-[0.38] xs:scale-[0.55] sm:scale-[0.72] md:scale-[0.88] lg:scale-100 transition-transform duration-300">
                <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
                  <InvoicePreview ref={previewRef} data={formData} lang={lang} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen fixed unscaled render node guaranteeing 100% device independent PDF export identical to Live Preview */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, width: "794px", zIndex: -50, opacity: 1, pointerEvents: "none" }}>
        <InvoicePreview ref={printRef} data={formData} lang={lang} />
      </div>
    </div>
  );
}
