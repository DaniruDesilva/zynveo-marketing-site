"use client";

import React, { forwardRef } from "react";
import { Sparkles, CheckCircle2, TrendingUp, DollarSign, ArrowRight } from "lucide-react";
import { ReportLang } from "@/components/breakeven/BreakEvenReportPreview";

export interface MrpReportData {
  mode: "cost-plus" | "target-price" | "distributor-mrp";
  cost: number;
  activeMrp: number;
  activeBrandProfit: number;
  activeBrandMargin: number;
  activeWholesalerCut: number;
  wholesalerMargin: number;
  activeRetailerCut: number;
  retailerMargin: number;
  activeTaxAmount: number;
  taxRate: number;
  activePtw: number;
  currencyCode: string;
}

interface MrpReportPreviewProps {
  data: MrpReportData;
  lang?: ReportLang;
}

const DICT = {
  en: {
    headerTitle: "PRODUCT MRP & PROFIT MARGIN INTELLIGENCE REPORT",
    companySub: "Generated via Zynveo Pricing & ERP Intelligence System",
    dateLabel: "Report Date",
    modeLabel: "Calculation Mode",
    execTitle: "Executive Summary & Financial Takeaway",
    waterfallTitle: "Margin Breakdown & Revenue Distribution",
    metricCol: "PRICING TIER / MARGIN COMPONENT",
    valueCol: "AMOUNT PER UNIT",
    pctCol: "SHARE / %",
    actionTitle: "Strategic Pricing Recommendations",
    action1Title: "Optimize Retail Shop Commission Tier",
    action1Desc: "Supermarkets and corner shops take between 20%–30% of the shelf price. If your brand volume is high, negotiate volume rebates to recover 2%–4% back into your net profit margin.",
    action2Title: "Wholesaler & Distributor Trade Terms",
    action2Desc: "Distributor commissions strictly reduce your Price to Wholesaler (PTW). Ensure all transportation and damage replacement agreements are clearly bundled into this margin.",
    action3Title: "Live Batch Profitability & ERP Tracking",
    action3Desc: "Raw material costs fluctuate constantly. Instead of setting shelf MRP once and forgetting it, link your production recipes to live purchase orders inside Zynveo Cloud ERP.",
    ctaTitle: "✨ Automate Your Profit & Inventory with Zynveo Cloud ERP",
    ctaDesc: "Connect directly to live inventory costs, supplier purchases, and multi-branch POS terminals. Calculate true item margins and cash register targets automatically without manual spreadsheets.",
    modes: {
      "cost-plus": "Cost-Plus Pricing Mode (Target Brand Margin)",
      "target-price": "Reverse Shelf MRP Deduction Mode",
      "distributor-mrp": "Distributor Flat Commission % Mode",
    },
    labels: {
      cost: "Production / Landed Unit Cost",
      mrp: "Recommended / Target Shelf MRP",
      brandProfit: "Net Brand Profit per Unit",
      distributor: "Wholesaler / Distributor Commission Cut",
      retailer: "Retailer / Supermarket Margin Cut",
      tax: "Government VAT / GST Tax Included",
      ptw: "Wholesale Billing Price (PTW)",
    },
    execSummary: (cost: string, mrp: string, profit: string, margin: string, retailer: string, distributor: string) =>
      `For a product manufactured at ${cost} and sold at a shelf MRP of ${mrp}, your brand captures a Net Profit of ${profit} (${margin} net margin). Meanwhile, Retailers receive ${retailer} per unit and Distributors take ${distributor}.`,
  },
  si: {
    headerTitle: "නිෂ්පාදන MRP සහ ලාභ ප්‍රතිශත විශ්ලේෂණ වාර්තාව",
    companySub: "Zynveo මූල්‍ය සහ ERP බුද්ධි පද්ධතිය මඟින් සකසන ලදී",
    dateLabel: "දිනය",
    modeLabel: "ගණනය කළ ක්‍රමය",
    execTitle: "විධායක සාරාංශය සහ ප්‍රධාන මූල්‍ය නිගමනය",
    waterfallTitle: "මිල සහ කොමිස් බෙදී යන ආකාරය",
    metricCol: "මූල්‍ය අංගය / කොමිස් වර්ගය",
    valueCol: "ඒකකයකට මුදල",
    pctCol: "ප්‍රතිශතය (%)",
    actionTitle: "උපක්‍රමශීලී මිල සහ කොමිස් නිර්දේශ",
    action1Title: "සිල්ලර කඩ සහ සුපිරි වෙළඳසැල් කොමිස් පාලනය",
    action1Desc: "සුපිරි වෙළඳසැල් සහ සිල්ලර කඩ විකුණුම් මිලෙන් 20%–30% ක කොමිසමක් ලබා ගනී. විකුණුම් ප්‍රමාණය ඉහළ යන විට මෙම ප්‍රතිශතය සාකච්ඡා කර 2%–3% කින් සන්නාම ලාභය වැඩි කරගන්න.",
    action2Title: "බෙදාහරින්නාගේ (Distributor) කොමිස් කොන්දේසි",
    action2Desc: "බෙදාහරින්නාගේ කොමිසම ඔබේ තොග විකුණුම් මිලෙන් (PTW) සෘජුවම අඩු වේ. ප්‍රවාහන සහ හානි වූ භාණ්ඩ ප්‍රතිපූරණය මෙම කොමිසමටම ඇතුළත් කර ගැනීමට වගබලා ගන්න.",
    action3Title: "සජීවී නිෂ්පාදන වියදම් සහ ERP නිරීක්ෂණය",
    action3Desc: "අමුද්‍රව්‍ය මිල නිරතුරුව වෙනස් වේ. එක් වරක් MRP තීරණය කර අමතක කිරීම වෙනුවට, Zynveo Cloud ERP මඟින් සජීවී නිෂ්පාදන වියදම් සමඟ නිශ්චිත ලාභය නිරීක්ෂණය කරන්න.",
    ctaTitle: "✨ Zynveo Cloud ERP සමඟ ඔබේ ලාභය සහ තොග කළමනාකරණය ස්වයංක්‍රීය කරන්න",
    ctaDesc: "සජීවී අමුද්‍රව්‍ය මිල, සැපයුම්කරුවන්ගේ බිල්පත් සහ POS යන්ත්‍ර සමඟ සෘජුව සම්බන්ධ වී, අතින් ගණනය කිරීමකින් තොරව නිශ්චිත ලාභ සීමා සහ දෛනික අයකැමි ඉලක්ක ස්වයංක්‍රීයව දැනගන්න.",
    modes: {
      "cost-plus": "1. ඉදිරි විකුණුම් මිල (MRP) ගණනය",
      "target-price": "2. ස්ථාවර MRP මිලෙන් ආපසු ලාභය ගණනය",
      "distributor-mrp": "3. ස්ථාවර කොමිස් ප්‍රතිශතයෙන් ලාභය ගණනය",
    },
    labels: {
      cost: "නිෂ්පාදන වියදම (Landed Cost)",
      mrp: "අවසාන සිල්ලර විකුණුම් මිල (MRP)",
      brandProfit: "සන්නාමයට ලැබෙන ශුද්ධ ලාභය",
      distributor: "බෙදාහරින්නාගේ කොමිසම (Distributor)",
      retailer: "සිල්ලර කඩයේ / සුපිරි වෙළඳසැලේ කොමිසම",
      tax: "රජයේ VAT / GST බදු",
      ptw: "තොග විකුණුම් බිල්පත් මිල (PTW)",
    },
    execSummary: (cost: string, mrp: string, profit: string, margin: string, retailer: string, distributor: string) =>
      `නිෂ්පාදන වියදම ${cost} සහ සිල්ලර විකුණුම් මිල ${mrp} වන භාණ්ඩයක් සඳහා ඔබේ සන්නාමයේ ශුද්ධ ලාභය ${profit} (${margin} ශුද්ධ ලාභ ප්‍රතිශතය) වන අතර, සිල්ලර කඩයට ${retailer} සහ බෙදාහරින්නාට ${distributor} හිමි වේ.`,
  },
  ta: {
    headerTitle: "தயாரிப்பு MRP மற்றும் இலாப வரம்பு பகுப்பாய்வு அறிக்கை",
    companySub: "Zynveo ERP மற்றும் விலை நிர்ணய அமைப்பால் உருவாக்கப்பட்டது",
    dateLabel: "அறிக்கை திகதி",
    modeLabel: "கணக்கீட்டு முறை",
    execTitle: "நிர்வாக சுருக்கம் மற்றும் முக்கிய நிதி முடிவு",
    waterfallTitle: "விலை மற்றும் கமிஷன் பகிர்வு பகுப்பாய்வு",
    metricCol: "நிதி கூறு / கமிஷன் வகை",
    valueCol: "அலகுக்கு தொகை",
    pctCol: "சதவீதம் (%)",
    actionTitle: "மூலோபாய விலை மற்றும் கமிஷன் பரிந்துரைகள்",
    action1Title: "சில்லறை கடை கமிஷன் மேலாண்மை",
    action1Desc: "பல்பொருள் அங்காடிகள் மற்றும் சில்லறை கடைகள் விற்பனை விலையில் 20%–30% கமிஷன் பெறுகின்றன. அதிக விற்பனை அளவின் போது இதை பேசி 2%–3% இலாபத்தை அதிகரிக்கவும்.",
    action2Title: "விநியோகஸ்தர் (Distributor) ஒப்பந்த நிபந்தனைகள்",
    action2Desc: "விநியோகஸ்தர் கமிஷன் உங்கள் மொத்த விற்பனை விலையை (PTW) நேரடியாக குறைக்கிறது. போக்குவரத்து மற்றும் சேதமடைந்த பொருட்களுக்கான மாற்று செலவுகள் இதில் அடங்குவதை உறுதி செய்யுங்கள்.",
    action3Title: "நேரடி உற்பத்தி செலவு மற்றும் ERP கண்காணிப்பு",
    action3Desc: "மூலப்பொருள் விலைகள் தொடர்ந்து மாறுகின்றன. ஒரு முறை MRP நிர்ணயித்து மறப்பதற்கு பதிலாக, Zynveo Cloud ERP மூலம் நேரடி கொள்முதல் விலைகளுடன் இலாபத்தை கண்காணிக்கவும்.",
    ctaTitle: "✨ Zynveo Cloud ERP மூலம் உங்கள் இலாபம் மற்றும் இருப்பை தானியங்குபடுத்துங்கள்",
    ctaDesc: "நேரடி மூலப்பொருள் செலவுகள் மற்றும் POS இயந்திரங்களுடன் நேரடியாக இணைத்து, விரிதாள்கள் இல்லாமல் தானாகவே இலாப நிலை மற்றும் தினசரி இலக்குகளை கணக்கிடுங்கள்.",
    modes: {
      "cost-plus": "1. முன்னோக்கு சில்லறை விலை (MRP) கணக்கீடு",
      "target-price": "2. நிலையான MRP விலையிலிருந்து இலாப கணக்கீடு",
      "distributor-mrp": "3. நேரடி கமிஷன் சதவீத இலாப கணக்கீடு",
    },
    labels: {
      cost: "உற்பத்தி / இறக்குமதி அலகு செலவு",
      mrp: "பரிந்துரைக்கப்பட்ட சில்லறை விலை (MRP)",
      brandProfit: "பிராண்டின் நிகர இலாபம் (அலகுக்கு)",
      distributor: "விநியோகஸ்தர் கமிஷன் (Distributor)",
      retailer: "சில்லறை கடை / பல்பொருள் அங்காடி கமிஷன்",
      tax: "அரசு VAT / GST வரி",
      ptw: "மொத்த விற்பனை பில்லிங் விலை (PTW)",
    },
    execSummary: (cost: string, mrp: string, profit: string, margin: string, retailer: string, distributor: string) =>
      `உற்பத்தி செலவு ${cost} மற்றும் சில்லறை விற்பனை விலை ${mrp} கொண்ட பொருளுக்கு உங்கள் பிராண்டின் நிகர இலாபம் ${profit} (${margin} இலாபம்) ஆகும். சில்லறை வர்த்தகருக்கு ${retailer} மற்றும் விநியோகஸ்தருக்கு ${distributor} கிடைக்கும்.`,
  },
};

const MrpReportPreview = forwardRef<HTMLDivElement, MrpReportPreviewProps>(
  ({ data, lang = "en" }, ref) => {
    const t = DICT[lang] || DICT.en;
    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: data.currencyCode || "USD",
        maximumFractionDigits: 2,
      }).format(val || 0);

    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const modeName = t.modes[data.mode] || data.mode;

    return (
      <div
        ref={ref}
        className="w-[794px] min-h-[1123px] bg-white p-10 text-slate-800 flex flex-col justify-between relative overflow-hidden box-border select-text"
        style={{
          fontFamily:
            "'Inter', 'Abhaya Libre', 'Mukta Malar', 'Iskoola Pota', 'Latha', 'Nirmala UI', Arial, sans-serif",
          color: "#1e293b",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Top Vibrant Gradient Header Strip */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600" />

        <div className="flex-grow space-y-6">
          {/* Header Bar */}
          <div className="flex justify-between items-start pt-2 border-b border-slate-200 pb-5">
            <div className="space-y-1 max-w-[65%]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[11px] uppercase tracking-wider">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>ZYNVEO PRICING INTELLIGENCE</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug pt-1">
                {t.headerTitle}
              </h1>
              <p className="text-xs text-slate-500 font-medium">{t.companySub}</p>
            </div>

            <div className="text-right space-y-1 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                {t.dateLabel}
              </span>
              <span className="text-sm font-bold text-slate-800 block">{dateStr}</span>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  {t.modeLabel}: <span className="text-indigo-700">{modeName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Executive Summary Highlight Card */}
          <div className="bg-indigo-50/80 border-l-4 border-indigo-600 p-5 rounded-2xl shadow-sm space-y-2">
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
              {t.execTitle}
            </h3>
            <p className="text-xs sm:text-[13px] text-indigo-900 font-medium leading-relaxed">
              {t.execSummary(
                formatCurrency(data.cost),
                formatCurrency(data.activeMrp),
                formatCurrency(data.activeBrandProfit),
                `${data.activeBrandMargin.toFixed(1)}%`,
                formatCurrency(data.activeRetailerCut),
                formatCurrency(data.activeWholesalerCut)
              )}
            </p>
          </div>

          {/* Financial Margin Waterfall Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              {t.waterfallTitle}
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4 text-left">{t.metricCol}</th>
                    <th className="py-3 px-4 text-right">{t.valueCol}</th>
                    <th className="py-3 px-4 text-right">{t.pctCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 font-medium">
                    <td className="py-3 px-4 text-slate-700 font-bold">{t.labels.cost}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[13px]">
                      {formatCurrency(data.cost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 font-bold">
                      {data.activeMrp > 0 ? `${((data.cost / data.activeMrp) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60 font-medium bg-indigo-50/40">
                    <td className="py-3 px-4 text-indigo-950 font-black">{t.labels.mrp}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                      {formatCurrency(data.activeMrp)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-700 font-black">100.0%</td>
                  </tr>

                  <tr className="hover:bg-slate-50/60 font-medium bg-emerald-50/40">
                    <td className="py-3 px-4 text-emerald-900 font-black">{t.labels.brandProfit}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-[13px]">
                      {formatCurrency(data.activeBrandProfit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-black">
                      {data.activeBrandMargin.toFixed(1)}%
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60 font-medium">
                    <td className="py-3 px-4 text-slate-700 font-bold">{t.labels.ptw}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 text-[13px]">
                      {formatCurrency(data.activePtw)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">
                      {data.activeMrp > 0 ? `${((data.activePtw / data.activeMrp) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60 font-medium">
                    <td className="py-3 px-4 text-slate-700">{t.labels.distributor}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 font-bold">
                      {formatCurrency(data.activeWholesalerCut)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">
                      {(data.wholesalerMargin * 100).toFixed(1)}%
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/60 font-medium">
                    <td className="py-3 px-4 text-slate-700">{t.labels.retailer}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 font-bold">
                      {formatCurrency(data.activeRetailerCut)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">
                      {(data.retailerMargin * 100).toFixed(1)}%
                    </td>
                  </tr>

                  {data.activeTaxAmount > 0 && (
                    <tr className="hover:bg-slate-50/60 font-medium bg-amber-50/30">
                      <td className="py-3 px-4 text-amber-900 font-bold">{t.labels.tax}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800 font-bold">
                        {formatCurrency(data.activeTaxAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700 font-bold">
                        {data.taxRate.toFixed(1)}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic Recommendations Block */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-600 shrink-0" />
              {t.actionTitle}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
                <span className="text-xs font-extrabold text-slate-900 block">
                  1. {t.action1Title}
                </span>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {t.action1Desc}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
                <span className="text-xs font-extrabold text-slate-900 block">
                  2. {t.action2Title}
                </span>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {t.action2Desc}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
                <span className="text-xs font-extrabold text-slate-900 block">
                  3. {t.action3Title}
                </span>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {t.action3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action Footer Card */}
        <div className="mt-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-500/30 shadow-lg shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-[75%]">
            <h4 className="text-sm font-black text-indigo-300 tracking-tight leading-snug">
              {t.ctaTitle}
            </h4>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              {t.ctaDesc}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span
              data-pdf-link="zynveo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md"
            >
              <span>Explore ERP</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="block text-[10px] text-slate-400 font-bold mt-1.5">
              zynveo.com
            </span>
          </div>
        </div>
      </div>
    );
  }
);

MrpReportPreview.displayName = "MrpReportPreview";
export default MrpReportPreview;
