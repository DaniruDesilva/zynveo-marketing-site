"use client";

import React, { useState, useEffect, useRef } from "react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Package,
  Tag,
  ArrowRight,
  Sparkles,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Layers,
  Truck,
  QrCode as QrIcon,
  ShoppingBag,
  Info,
  ExternalLink,
  Hash,
  Barcode as BarcodeIcon,
  Sliders,
  Printer,
  Check,
  Type,
} from "lucide-react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BARCODE_DICT, BarcodeLang } from "@/lib/barcode-i18n";

type CategoryKey = "retail" | "internal" | "logistics" | "matrix";

export function SKUAndBarcodeGeneratorClient() {
  const [lang, setLang] = useState<BarcodeLang>("en");
  const t = BARCODE_DICT[lang];
  const isIndic = lang === "si" || lang === "ta";

  // Category & Format selection
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("retail");
  const [activeFormat, setActiveFormat] = useState<string>("EAN13");

  // Product & Label Data
  const [productName, setProductName] = useState("Organic Aloe Vera Shampoo");
  const [category, setCategory] = useState("Skincare");
  const [size, setSize] = useState("250ml");
  const [showProductLabel, setShowProductLabel] = useState(true);

  const [sku, setSku] = useState("SKI-ORGA-250ML");
  const [isManualSku, setIsManualSku] = useState(false);

  // GTIN & Logistics Data
  const [gtin, setGtin] = useState("479100012345");
  const [batchNo, setBatchNo] = useState("BATCH-09");
  const [digitalLinkPrefix, setDigitalLinkPrefix] = useState(
    "https://synctrahq.com/gtin"
  );

  // Customization Sliders & Ink Theme
  const [barHeight, setBarHeight] = useState<number>(85);
  const [barWidth, setBarWidth] = useState<number>(2);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [inkColor, setInkColor] = useState<string>("#0F172A"); // Obsidian Black

  const previewCardRef = useRef<HTMLDivElement>(null);
  const bwipCanvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-generate SKU logic
  useEffect(() => {
    if (isManualSku) return;
    const clean = (str: string) =>
      str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const catCode = clean(category).substring(0, 3);
    const nameCode = clean(productName).substring(0, 4);
    const sizeCode = clean(size);
    const generated = [catCode, nameCode, sizeCode].filter(Boolean).join("-");
    setSku(generated || "SYNCTRA-ITEM");
  }, [productName, category, size, isManualSku]);

  // Category switch defaults
  const handleCategoryChange = (cat: CategoryKey) => {
    setActiveCategory(cat);
    if (cat === "retail") setActiveFormat("EAN13");
    if (cat === "internal") setActiveFormat("CODE128");
    if (cat === "logistics") setActiveFormat("GS1_128");
    if (cat === "matrix") setActiveFormat("GS1_DIGITAL_LINK");
  };

  // Canvas PostScript render via bwip-js
  useEffect(() => {
    if (activeFormat === "GS1_128" || activeFormat === "DATA_MATRIX") {
      // @ts-ignore
      import("bwip-js").then((bwipjs: any) => {
        if (!bwipCanvasRef.current) return;
        const bjs = bwipjs.default || bwipjs;
        const cleanNum = (gtin.replace(/[^0-9]/g, "") || "479100012345").padEnd(14, "0").slice(0, 14);
        const textToEncode =
          activeFormat === "GS1_128"
            ? `(01)${cleanNum}(10)${batchNo || "LOT1"}`
            : `${sku || gtin}#${batchNo}`;

        try {
          bjs.toCanvas(bwipCanvasRef.current, {
            bcid: activeFormat === "GS1_128" ? "gs1-128" : "datamatrix",
            text: textToEncode,
            scale: Math.max(2, barWidth * 2),
            height: activeFormat === "GS1_128" ? Math.max(12, barHeight / 5) : 12,
            includetext: showNumbers,
            textxalign: "center",
            backgroundcolor: "ffffff",
            barcolor: inkColor.replace("#", ""),
            padding: 10,
          });
        } catch (strictErr) {
          // Fallback to robust code128/datamatrix if strict GS1 check-digit validation fails
          try {
            bjs.toCanvas(bwipCanvasRef.current, {
              bcid: activeFormat === "GS1_128" ? "code128" : "datamatrix",
              text: activeFormat === "GS1_128" ? `01${cleanNum}10${batchNo || "LOT1"}` : `${sku || gtin}#${batchNo}`,
              scale: Math.max(2, barWidth * 2),
              height: activeFormat === "GS1_128" ? Math.max(12, barHeight / 5) : 12,
              includetext: showNumbers,
              textxalign: "center",
              backgroundcolor: "ffffff",
              barcolor: inkColor.replace("#", ""),
              padding: 10,
            });
          } catch (fallbackErr) {
            console.error("bwip fallback error:", fallbackErr);
          }
        }
      });
    }
  }, [activeFormat, gtin, batchNo, sku, barHeight, barWidth, showNumbers, inkColor]);

  // Safe 1D Props generator for react-barcode
  const get1DBarcodeProps = () => {
    const numericOnly = gtin.replace(/[^0-9]/g, "") || "479100012345";
    switch (activeFormat) {
      case "EAN13":
        return {
          format: "EAN13" as const,
          value: numericOnly.padEnd(12, "0").slice(0, 12),
        };
      case "UPCA":
        return {
          format: "UPC" as const,
          value: numericOnly.padEnd(11, "0").slice(0, 11),
        };
      case "EAN8":
        return {
          format: "EAN8" as const,
          value: numericOnly.padEnd(7, "0").slice(0, 7),
        };
      case "CODE128":
        return { format: "CODE128" as const, value: sku || "SYNCTRA" };
      case "CODE39":
        return {
          format: "CODE39" as const,
          value: (sku || "SYNCTRA")
            .replace(/[^A-Z0-9 -.$/+%]/gi, "")
            .toUpperCase(),
        };
      case "ITF14":
        return {
          format: "ITF14" as const,
          value: numericOnly.padEnd(13, "0").slice(0, 13),
        };
      default:
        return { format: "CODE128" as const, value: sku || "SYNCTRA" };
    }
  };

  // Safe 2D value generator
  const get2DValue = () => {
    if (activeFormat === "GS1_DIGITAL_LINK") {
      const cleanGtin =
        gtin.replace(/[^0-9]/g, "").padEnd(14, "0").slice(0, 14) ||
        "04791000123456";
      return `${digitalLinkPrefix.replace(/\/$/, "")}/01/${cleanGtin}/10/${encodeURIComponent(batchNo || "LOT1")}`;
    }
    return sku || "https://synctrahq.com";
  };

  // PNG Export Handler
  const handleExport = async () => {
    if (activeFormat === "GS1_128" || activeFormat === "DATA_MATRIX") {
      if (!bwipCanvasRef.current) return;
      const url = bwipCanvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `Synctra_Label_${activeFormat}_${sku || gtin}.png`;
      link.click();
      return;
    }

    if (!previewCardRef.current) return;
    try {
      const canvas = await html2canvas(previewCardRef.current, {
        scale: 4, // 4x high-res thermal scale
        backgroundColor: "#ffffff",
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `Synctra_Label_${activeFormat}_${sku || gtin}.png`;
      link.click();
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to download label.");
    }
  };

  // Browser Print trigger (Bulletproof snapshot print tab + fixed fallback)
  const handlePrint = async () => {
    if (!previewCardRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(
      `<html><head><title>Preparing Label...</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;">Generating high-res thermal preview...</body></html>`
    );
    try {
      const canvas = await html2canvas(previewCardRef.current, {
        scale: 4,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label - Synctra</title>
            <style>
              body { margin: 0; padding: 40px; display: flex; justify-content: center; align-items: flex-start; background: white; }
              img { max-width: 100%; height: auto; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; }
              @media print {
                body { padding: 0; }
                img { border: none; padding: 0; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); window.close(); }, 150);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print error:", err);
      printWindow.close();
      window.print();
    }
  };

  const currentFormatInfo =
    (t.formats as any)[activeFormat] || t.formats.CODE128;

  const colorOptions = [
    { name: t.colors.black, hex: "#0F172A" },
    { name: t.colors.navy, hex: "#1E3A8A" },
    { name: t.colors.indigo, hex: "#312E81" },
    { name: t.colors.emerald, hex: "#065F46" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 pb-28 lg:pb-16 sm:px-6 lg:px-8 max-w-6xl font-sans text-neutral-text">
      {/* Sleek Header & Language Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-10 pb-6 border-b border-neutral-border/60 text-center sm:text-left">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30 shrink-0">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="font-extrabold tracking-tight text-xl sm:text-2xl block leading-tight">
              Synctra
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent block mt-0.5">
              Worldwide Retail & Warehouse OS
            </span>
          </div>
        </div>

        {/* Region Flag Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200/80 shadow-inner w-full sm:w-auto">
          <span className="text-[11px] font-extrabold text-slate-500 px-2 flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="h-3.5 w-3.5 text-primary" /> Region
          </span>
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto">
            {(["en", "si", "ta"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-1.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  lang === l
                    ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w40/${l === "en" ? "gb" : l === "si" ? "lk" : "in"}.png`}
                  alt=""
                  className="h-3.5 w-5 object-cover rounded-[2px] shadow-sm shrink-0"
                />
                <span className="truncate">
                  {l === "en" ? "English" : l === "si" ? "සිංහල" : "தமிழ்"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Title Section */}
      <div className="text-center space-y-4 mb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest shadow-sm">
          <BarcodeIcon className="h-4 w-4 text-primary" />
          <span>{t.badge}</span>
        </div>
        <h1
          className={`font-black tracking-tight text-slate-900 ${
            isIndic ? "text-2xl sm:text-4xl leading-snug" : "text-3xl sm:text-5xl"
          }`}
        >
          {t.title}
        </h1>
        <p
          className={`text-slate-600 font-medium leading-relaxed mx-auto ${
            isIndic ? "text-sm sm:text-base max-w-3xl" : "text-base sm:text-lg max-w-2xl"
          }`}
        >
          {t.subtitle}
        </p>
      </div>

      {/* Premium Segmented Category Selector Hub (Full Width & Zero Truncation) */}
      <div className="mb-6 bg-slate-900 p-2 sm:p-2.5 rounded-3xl shadow-2xl border border-slate-800 max-w-6xl w-full mx-auto backdrop-blur-xl">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {[
            { id: "retail", label: t.categories.retail, icon: ShoppingBag },
            { id: "internal", label: t.categories.internal, icon: Layers },
            { id: "logistics", label: t.categories.logistics, icon: Truck },
            { id: "matrix", label: t.categories.matrix, icon: QrIcon },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as CategoryKey)}
                className={`py-3 px-2 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 relative text-center min-h-[56px] sm:min-h-0 ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/40 font-black scale-[1.02] border border-white/10"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <IconComponent
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-accent animate-pulse" : "text-slate-400"}`}
                />
                <span className="tracking-tight leading-tight block break-words">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Format Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12 bg-slate-100 p-2 rounded-2xl max-w-3xl mx-auto border border-slate-200 shadow-inner">
        {(activeCategory === "retail"
          ? ["EAN13", "UPCA", "EAN8"]
          : activeCategory === "internal"
            ? ["CODE128", "CODE39"]
            : activeCategory === "logistics"
              ? ["GS1_128", "ITF14"]
              : ["QR", "GS1_DIGITAL_LINK", "DATA_MATRIX"]
        ).map((fmt) => {
          const info = (t.formats as any)[fmt];
          const isSelected = activeFormat === fmt;
          return (
            <button
              key={fmt}
              type="button"
              onClick={() => setActiveFormat(fmt)}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                isSelected
                  ? "bg-white text-primary shadow-md border border-primary/20 scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-bold"
              }`}
            >
              {info ? info.name.split(" (")[0] : fmt}
            </button>
          );
        })}
      </div>

      {/* Main Symmetrical Split Grid (Flaw 2 & 3 Fix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2-Step Customization Studio (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Studio Box 1: Code & Inventory Data */}
          <motion.div
            layout
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl bg-white space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <h2
                className={`font-black text-slate-900 flex items-start gap-2.5 ${
                  isIndic ? "text-sm sm:text-base tracking-tight" : "text-base sm:text-lg"
                }`}
              >
                <Package className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{t.productDetails}</span>
              </h2>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1.5 border border-emerald-100 shrink-0 whitespace-nowrap self-start sm:self-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span>{t.realtimeActive}</span>
              </span>
            </div>

            <div className="space-y-4 text-slate-800 font-semibold text-sm">
              {/* Product Label Name (Available everywhere) */}
              <div>
                <label className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-slate-700 font-bold mb-1.5 text-xs">
                  <span>{t.productNameLabel}</span>
                  <button
                    type="button"
                    onClick={() => setShowProductLabel(!showProductLabel)}
                    className="text-primary hover:underline text-[11px] font-extrabold shrink-0"
                  >
                    {showProductLabel
                      ? lang === "si"
                        ? "ලේබලයෙන් සඟවන්න"
                        : lang === "ta"
                          ? "மறை"
                          : "Hide on label"
                      : lang === "si"
                        ? "ලේබලයේ පෙන්වන්න"
                        : lang === "ta"
                          ? "காட்டு"
                          : "Show on label"}
                  </button>
                </label>
                <div className="relative">
                  <Type size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t.productNamePlace}
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition font-semibold text-slate-900 text-sm"
                  />
                </div>
              </div>

              {/* Show Alphanumeric SKU for Warehouse or Matrix */}
              {(activeCategory === "internal" || activeCategory === "matrix") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        {t.categoryLabel}
                      </label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setIsManualSku(false);
                        }}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        {t.sizeLabel}
                      </label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => {
                          setSize(e.target.value);
                          setIsManualSku(false);
                        }}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-indigo-700 font-black mb-1.5 text-xs">
                      <span>{t.generatedSkuLabel}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {t.manualEditHint}
                      </span>
                    </label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-3.5 top-3.5 text-indigo-400" />
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => {
                          setSku(e.target.value.toUpperCase());
                          setIsManualSku(true);
                        }}
                        className="w-full pl-10 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl font-mono font-black text-indigo-950 focus:ring-2 focus:ring-primary focus:outline-none text-base tracking-wider"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Show GTIN Numeric input for Retail, Logistics, or Digital Link */}
              {(activeCategory === "retail" ||
                activeCategory === "logistics" ||
                activeFormat === "GS1_DIGITAL_LINK") && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-slate-800 font-bold mb-1 text-xs">
                      <span>{t.gtinLabel}</span>
                      <span className="text-[11px] text-primary font-black bg-primary-light/30 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                        {activeFormat === "EAN13"
                          ? lang === "si"
                            ? "අංක 12"
                            : lang === "ta"
                              ? "12 இலக்கங்கள்"
                              : "12 Digits"
                          : activeFormat === "UPCA"
                            ? lang === "si"
                              ? "අංක 11"
                              : lang === "ta"
                                ? "11 இலக்கங்கள்"
                                : "11 Digits"
                            : activeFormat === "EAN8"
                              ? lang === "si"
                                ? "අංක 7"
                                : lang === "ta"
                                  ? "7 இலக்கங்கள்"
                                  : "7 Digits"
                              : lang === "si"
                                ? "අංක 13"
                                : lang === "ta"
                                  ? "13 இலக்கங்கள்"
                                  : "13 Digits"}
                      </span>
                    </label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={gtin}
                        onChange={(e) =>
                          setGtin(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="Numeric checkout GTIN"
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none tracking-widest text-base"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t.gtinHint}
                    </p>
                  </div>

                  {(activeCategory === "logistics" ||
                    activeFormat === "GS1_DIGITAL_LINK") && (
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5 text-xs">
                        {t.batchLabel}
                      </label>
                      <input
                        type="text"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value.toUpperCase())}
                        placeholder="e.g., BATCH01"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Show Web URL Prefix for GS1 Digital Link */}
              {activeFormat === "GS1_DIGITAL_LINK" && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-slate-800 font-bold mb-1.5 flex items-center gap-1.5 text-xs">
                    <ExternalLink size={14} className="text-accent" />
                    <span>{t.digitalLinkLabel}</span>
                  </label>
                  <input
                    type="text"
                    value={digitalLinkPrefix}
                    onChange={(e) => setDigitalLinkPrefix(e.target.value)}
                    className="w-full p-3 bg-cyan-50/50 border border-cyan-200 rounded-xl font-mono text-xs font-semibold text-cyan-950 focus:ring-2 focus:ring-accent focus:outline-none"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Studio Box 2: Sticker & Printer Customization Sliders */}
          <motion.div
            layout
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl bg-white space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                className={`font-black text-slate-900 flex items-center gap-2 ${
                  isIndic ? "text-sm sm:text-base tracking-tight" : "text-base sm:text-lg"
                }`}
              >
                <Sliders className="h-5 w-5 text-indigo-600 shrink-0" />
                <span>{t.customizationTitle}</span>
              </h3>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label>{t.barHeightLabel}</label>
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                      {barHeight}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="135"
                    value={barHeight}
                    onChange={(e) => setBarHeight(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label>{t.barWidthLabel}</label>
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                      {barWidth}x Density
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.5"
                    value={barWidth}
                    onChange={(e) => setBarWidth(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Toggle & Color Swatches */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4 border-slate-300"
                  />
                  <span>{t.showTextLabel}</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 mr-1">{t.colorThemeLabel}:</span>
                  {colorOptions.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setInkColor(col.hex)}
                      title={col.name}
                      className={`h-6 w-6 rounded-full transition-transform flex items-center justify-center ${
                        inkColor === col.hex
                          ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md"
                          : "hover:scale-105 opacity-80"
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {inkColor === col.hex && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Integrated Preview Card & Explainer (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            layout
            className="glass-panel p-4 sm:p-8 lg:p-10 rounded-3xl border border-slate-200/80 shadow-2xl bg-white flex flex-col justify-between min-h-[560px] relative overflow-hidden"
          >
            {/* Top Corner Watermark */}
            <div className="absolute top-0 right-0 bg-primary/5 text-primary/20 p-8 rounded-bl-full pointer-events-none hidden sm:block">
              <BarcodeIcon size={120} />
            </div>

            {/* Preview Header & Explainer Box (Flaw 3 Fix) */}
            <div className="space-y-4 mb-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary bg-primary-light/40 px-3 py-1 rounded-full border border-primary/10 shrink-0 whitespace-nowrap">
                  {t.previewTitle}
                </span>
                <span className="text-[11px] font-extrabold text-slate-400 text-left sm:text-right leading-tight">
                  {t.previewSub}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-slate-50 border border-indigo-100/80 shadow-sm flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-primary text-white shrink-0 shadow-md shadow-primary/25 mt-0.5">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-0.5">
                    {currentFormatInfo.name}
                  </h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    {currentFormatInfo.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* The Live Thermal Sticker Preview Canvas */}
            <div
              id="printable-barcode-sticker"
              ref={previewCardRef}
              className="w-full my-auto flex flex-col items-center justify-center bg-white p-4 sm:p-8 lg:p-10 rounded-2xl border-2 border-dashed border-slate-200/80 shadow-inner relative z-10 min-h-[220px]"
            >
              {/* Optional Product Label Tag on Sticker */}
              {showProductLabel && productName && (
                <div className="font-black text-slate-900 text-sm sm:text-base tracking-tight mb-3 text-center max-w-md uppercase" style={{ color: inkColor }}>
                  {productName}
                </div>
              )}

              {/* Code Vector */}
              <div className="flex justify-center items-center w-full overflow-x-auto py-2">
                {activeFormat === "GS1_128" || activeFormat === "DATA_MATRIX" ? (
                  <canvas ref={bwipCanvasRef} className="max-w-full" />
                ) : activeFormat === "QR" || activeFormat === "GS1_DIGITAL_LINK" ? (
                  <QRCodeSVG
                    value={get2DValue()}
                    size={barHeight * 1.8}
                    fgColor={inkColor}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <Barcode
                    {...get1DBarcodeProps()}
                    width={barWidth}
                    height={barHeight}
                    fontSize={15}
                    displayValue={showNumbers}
                    lineColor={inkColor}
                    margin={8}
                    background="#ffffff"
                  />
                )}
              </div>

              {/* Bottom Synctra Verification Watermark on Sticker */}
              {(() => {
                const gs1Formats = ["EAN13", "UPCA", "EAN8", "UPCE", "GS1_128", "GS1_DIGITAL_LINK"];
                const verifyLabel = gs1Formats.includes(activeFormat)
                  ? "Synctra GS1 Verified"
                  : activeFormat === "QR"
                    ? "Synctra QR Verified"
                    : activeFormat === "DATA_MATRIX"
                      ? "Synctra Matrix Verified"
                      : activeFormat === "ITF14"
                        ? "Synctra Logistics Verified"
                        : "Synctra SKU Verified";
                return (
                  <div className="mt-3.5 text-center text-[9px] font-mono font-extrabold uppercase tracking-widest select-none leading-none">
                    <span className="text-emerald-500 mr-1.5 inline-block font-sans">✔</span>
                    <span className="text-slate-400 inline-block">{verifyLabel}</span>
                  </div>
                );
              })()}
            </div>

            {/* Big Dual Action Trigger Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mt-8 relative z-10">
              <button
                type="button"
                onClick={handleExport}
                className="sm:col-span-8 bg-slate-900 hover:bg-primary active:scale-95 text-white py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-slate-900/20"
              >
                <Download size={18} className="animate-bounce" />
                <span>{t.downloadBtn}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="sm:col-span-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 border border-slate-200"
              >
                <Printer size={18} className="text-slate-600" />
                <span>{t.printBtn}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Synctra PLG Upsell Hook Banner */}
      <motion.div
        layout
        className="mt-16 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <ShoppingBag size={300} />
        </div>
        <div className="max-w-3xl space-y-3.5 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent border border-accent/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> Worldwide POS & Inventory Sync
          </div>
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {t.upsellTitle}
          </h3>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            {t.upsellDesc}
          </p>
        </div>
        <Link
          href="/#pricing"
          className="shrink-0 w-full md:w-auto bg-accent hover:bg-accent-hover active:scale-95 text-white px-8 py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-2xl shadow-accent/40 relative z-10"
        >
          <span>{t.joinWaitlistBtn}</span>
          <ArrowRight size={20} />
        </Link>
      </motion.div>

      {/* Print Isolation CSS: Fallback for keyboard Ctrl+P shortcuts */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-barcode-sticker, #printable-barcode-sticker * {
            visibility: visible !important;
          }
          * {
            overflow: visible !important;
            transform: none !important;
          }
          #printable-barcode-sticker {
            position: fixed !important;
            left: 50% !important;
            top: 40px !important;
            width: auto !important;
            min-width: 340px !important;
            margin: 0 !important;
            padding: 30px !important;
            background: white !important;
            border: 2px dashed #cbd5e1 !important;
            border-radius: 16px !important;
            z-index: 999999 !important;
          }
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
