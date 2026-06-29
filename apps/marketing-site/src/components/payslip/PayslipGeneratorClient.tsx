"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Zap,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { payslipSchema, PayslipData } from "@/lib/payslip-schema";
import PayslipEditor from "@/components/payslip/PayslipEditor";
import PayslipPreview from "@/components/payslip/PayslipPreview";

const DEFAULT_VALUES: PayslipData = {
  companyName: "",
  companyAddress: "",
  companyLogo: "",
  month: "June",
  year: "2026",
  payDate: "",
  paidDays: 30,
  lopDays: 0,
  employeeName: "",
  employeeId: "",
  designation: "",
  department: "",
  panNumber: "",
  currency: "LKR",
  earnings: [
    { label: "Basic Salary", amount: 0 },
    { label: "HRA", amount: 0 },
  ],
  deductions: [
    { label: "Income Tax", amount: 0 },
    { label: "Provident Fund", amount: 0 },
  ],
  customEmployeeFields: [],
  customPaySummaryFields: [],
};

export function PayslipGeneratorClient() {
  const previewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<PayslipData>({
    resolver: zodResolver(payslipSchema),
    defaultValues: DEFAULT_VALUES,
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
      pdf.save(
        `Payslip_${(formData.employeeName || "Employee").replace(/\s+/g, "_")}_${formData.month}_${formData.year}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try reloading the page.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    form.reset(DEFAULT_VALUES);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-28 lg:pb-12 sm:px-6 lg:px-8 max-w-[1600px]">
      {/* Top Value Proposition Banner */}
      <div className="text-center space-y-4 mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-widest shadow-sm animate-bounce">
          <Sparkles className="h-3.5 w-3.5" />
          <span>100% Free Forever • No Sign-Up Required</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text">
          Free PDF Payslip Generator
        </h1>
        <p className="mx-auto text-base sm:text-lg max-w-2xl text-neutral-muted font-medium leading-relaxed">
          Generate professional salary slips for your employees instantly.
          Enter company details, salary components, and download a
          perfectly formatted PDF payslip — no account needed.
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold text-neutral-muted">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <ShieldCheck className="h-4 w-4" /> 100% Private & Offline
          </span>
          <span className="flex items-center gap-1.5 text-indigo-600">
            <CheckCircle2 className="h-4 w-4" /> A4 PDF Ready
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <Zap className="h-4 w-4" /> Zero Friction
          </span>
        </div>
      </div>

      {/* Split Screen Grid */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Column: Editor */}
        <div className="w-full xl:w-5/12 flex-shrink-0">
          <PayslipEditor form={form} />
        </div>

        {/* Right Column: Live Sticky A4 Preview */}
        <div className="w-full xl:w-7/12 flex flex-col items-center xl:sticky xl:top-24">
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 glass-panel p-4 rounded-2xl border border-neutral-border shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-extrabold text-neutral-text text-sm sm:text-base">
                Live Preview
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleReset}
                className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-neutral-bg hover:bg-slate-200 text-neutral-text font-bold text-sm flex items-center justify-center gap-2 border border-neutral-border transition-all active:scale-95"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex-1 sm:flex-none bg-accent hover:bg-accent-hover text-white px-6 sm:px-8 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-accent/25 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {isGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                <span>
                  {isGenerating ? "Generating..." : "Download PDF"}
                </span>
              </button>
            </div>
          </div>

          {/* Scaled A4 Sheet Container */}
          <div className="w-full bg-slate-200/70 rounded-3xl p-2 sm:p-8 flex justify-center overflow-x-auto min-h-[500px] sm:min-h-[850px] border border-slate-300/60 shadow-inner">
            <div className="origin-top transform scale-[0.36] xs:scale-[0.48] sm:scale-[0.72] md:scale-[0.88] lg:scale-100 transition-transform duration-300">
              <div className="shadow-2xl rounded-sm overflow-hidden">
                <PayslipPreview ref={previewRef} data={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen fixed unscaled render node for perfect PDF export */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "794px",
          zIndex: -50,
          opacity: 1,
          pointerEvents: "none",
        }}
      >
        <PayslipPreview ref={printRef} data={formData} />
      </div>
    </div>
  );
}
