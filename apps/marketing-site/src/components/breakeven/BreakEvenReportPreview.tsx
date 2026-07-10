"use client";

import React, { forwardRef } from "react";
import { Sparkles, CheckCircle2, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export type ReportLang = "en" | "si" | "ta";

export interface BreakEvenReportData {
  businessModel: "single" | "multi-mix" | "retail-margin";
  totalFixedCost: number;
  targetProfit: number;
  activeBreakEvenUnits: number;
  activeBreakEvenRevenue: number;
  activeTargetRevenue: number;
  retailBreakEvenDaily?: number;
  retailCMRatio?: number;
  currencyCode: string;
  mixItems?: Array<{ name: string; price: number; cost: number; volume: number }>;
}

interface BreakEvenReportPreviewProps {
  data: BreakEvenReportData;
  lang?: ReportLang;
}

const DICT = {
  en: {
    headerTitle: "BREAK-EVEN & PROFIT MARGIN INTELLIGENCE REPORT",
    companySub: "Generated via Zynveo Pricing & ERP Intelligence System",
    dateLabel: "Report Date",
    modelLabel: "Industry Mode",
    execTitle: "Executive Summary & Financial Takeaway",
    metricsTitle: "Key Calculation Breakdown",
    metricCol: "METRIC / PARAMETER DESCRIPTION",
    valueCol: "CALCULATED VALUE / AMOUNT",
    itemTableTitle: "Service & Menu Itemized Contribution Breakdown",
    itemName: "Service / Item Name",
    itemPrice: "Price",
    itemCost: "Variable Cost",
    itemMargin: "Contrib. Margin",
    itemVol: "Monthly Volume",
    actionTitle: "Strategic Recommendations & Action Plan",
    action1Title: "Strict Variable Cost Control",
    action1Desc: "Ensure direct unit production or supplier costs stay well below your selling price. Even a 5% supplier price hike increases your break-even unit threshold significantly.",
    action2Title: "Fixed Overhead Optimization",
    action2Desc: "Every additional fixed cost (rent, staff salary, utilities) directly pushes up the monthly turnover required before your business earns its first dollar of profit.",
    action3Title: "Real-Time Margin Tracking",
    action3Desc: "Replace static manual spreadsheets by syncing live cash register and supplier purchase invoices to track contribution margins daily.",
    ctaTitle: "✨ Automate Your Profit & Inventory with Zynveo Cloud ERP",
    ctaDesc: "Connect directly to live inventory costs, supplier purchases, and multi-branch POS terminals. Calculate true item margins and cash register targets automatically without manual spreadsheets.",
    models: {
      single: "Single Product / Manufacturer Mode",
      "multi-mix": "Service & Menu Mix Mode (Salon / Restaurant)",
      "retail-margin": "Supermarket & Retail Margin Mode",
    },
    labels: {
      fixed: "Total Fixed Monthly Costs (Overhead)",
      targetProfit: "Target Monthly Net Profit Goal",
      beUnits: "Required Monthly Break-Even Units",
      beRevenue: "Required Monthly Break-Even Revenue / Turnover",
      dailyRegister: "Required Daily Register Turnover Target",
      cmPercent: "Average Gross Contribution Margin (%)",
      targetRevenue: "Required Turnover to Hit Profit Goal",
    },
    execSummary: (fixed: string, revenue: string, unitsOrDaily: string, isRetail: boolean) =>
      isRetail
        ? `To fully cover your monthly fixed overhead of ${fixed} and reach the break-even point without losing money, your retail store must generate exactly ${revenue} in monthly turnover, which averages to a daily cash register target of ${unitsOrDaily}.`
        : `To fully cover your monthly fixed overhead of ${fixed} and reach the break-even point without incurring losses, your business must generate exactly ${revenue} in total monthly sales turnover, requiring a monthly volume of ${unitsOrDaily}.`,
  },
  si: {
    headerTitle: "ලාභ සීමා සහ දායක ලාභ විශ්ලේෂණ වාර්තාව",
    companySub: "Zynveo මූල්‍ය සහ ERP බුද්ධි පද්ධතිය මඟින් සකසන ලදී",
    dateLabel: "දිනය",
    modelLabel: "ව්‍යාපාර ආකෘතිය",
    execTitle: "විධායක සාරාංශය සහ ප්‍රධාන මූල්‍ය නිගමනය",
    metricsTitle: "ප්‍රධාන මූල්‍ය ගණනය කිරීම් සාරාංශය",
    metricCol: "පරාමිතිය / විස්තරය",
    valueCol: "ගණනය කළ අගය",
    itemTableTitle: "සේවා සහ මෙනු අයිතමවල ලාභ විශ්ලේෂණය",
    itemName: "සේවාවේ / අයිතමයේ නම",
    itemPrice: "මිල",
    itemCost: "විචල්‍ය වියදම",
    itemMargin: "දායක ලාභය",
    itemVol: "මාසික ප්‍රමාණය",
    actionTitle: "උපක්‍රමශීලී නිර්දේශ සහ ඉදිරි ක්‍රියාමාර්ග",
    action1Title: "ඒකක වියදම් නිශ්චිතව පාලනය කරන්න",
    action1Desc: "එක් ඒකකයක විචල්‍ය වියදම විකුණුම් මිලට වඩා සැලකිය යුතු ලෙස අඩුවෙන් තබා ගන්න. අමුද්‍රව්‍ය මිල 5% කින් වැඩි වුවද ලාභ සීමාවට පැමිණීමට විකිණිය යුතු ප්‍රමාණය විශාල ලෙස ඉහළ යයි.",
    action2Title: "ස්ථාවර වියදම් කළමනාකරණය",
    action2Desc: "මාසික කුලිය, වැටුප් හෝ විදුලි බිල වැඩි වන සෑම විටම, ව්‍යාපාරය පළමු ලාභ රුපියල ඉපයීමට පෙර උපයා ගත යුතු අවම ආදායම් සීමාව ඉහළ යයි.",
    action3Title: "සජීවී ලාභ නිරීක්ෂණය",
    action3Desc: "අතින් සකසන පැරණි Excel ශීට් වෙනුවට, සජීවී POS සහ සැපයුම්කරු බිල්පත් සම්බන්ධ කර දිනපතා ලාභ සීමාව නිරීක්ෂණය කරන්න.",
    ctaTitle: "✨ Zynveo Cloud ERP සමඟ ඔබේ ලාභය සහ තොග කළමනාකරණය ස්වයංක්‍රීය කරන්න",
    ctaDesc: "සජීවී අමුද්‍රව්‍ය මිල, සැපයුම්කරුවන්ගේ බිල්පත් සහ POS යන්ත්‍ර සමඟ සෘජුව සම්බන්ධ වී, අතින් ගණනය කිරීමකින් තොරව නිශ්චිත ලාභ සීමා සහ දෛනික අයකැමි ඉලක්ක ස්වයංක්‍රීයව දැනගන්න.",
    models: {
      single: "තනි නිෂ්පාදනයක් / නිෂ්පාදක ක්‍රමය",
      "multi-mix": "සේවා සහ මෙනු එකතු ක්‍රමය (සැලෝන් / අවන්හල්)",
      "retail-margin": "සුපිරි වෙළඳසැල් සහ Retail ලාභ ප්‍රතිශත ක්‍රමය",
    },
    labels: {
      fixed: "මුළු ස්ථාවර වියදම් (මාසික)",
      targetProfit: "මාසික ඉලක්ක ශුද්ධ ලාභය",
      beUnits: "ලාභ සීමාවට අවශ්‍ය මාසික ඒකක ප්‍රමාණය",
      beRevenue: "ලාභ සීමාවට අවශ්‍ය මුළු මාසික ආදායම",
      dailyRegister: "අවශ්‍ය දෛනික Register ආදායම් ඉලක්කය",
      cmPercent: "සාමාන්‍ය දළ ලාභ ප්‍රතිශතය (%)",
      targetRevenue: "ඉලක්ක ලාභය ලබා ගැනීමට අවශ්‍ය මුළු ආදායම",
    },
    execSummary: (fixed: string, revenue: string, unitsOrDaily: string, isRetail: boolean) =>
      isRetail
        ? `ඔබේ මාසික ස්ථාවර වියදම් වන ${fixed} සම්පූර්ණයෙන් ආවරණය කර පාඩුවකින් තොරව ලාභ සීමාවට පැමිණීමට, ඔබේ වෙළඳසැල මෙම මාසයේ මුළු ${revenue} ක ආදායමක් උපයා ගත යුතු අතර, එය දිනකට ${dailyTargetText(unitsOrDaily)} ක සාමාන්‍ය අයකැමි ආදායම් ඉලක්කයක් වේ.`
        : `ඔබේ මාසික ස්ථාවර වියදම් වන ${fixed} සම්පූර්ණයෙන් ආවරණය කර පාඩුවකින් තොරව ලාභ සීමාවට පැමිණීමට, ඔබේ ව්‍යාපාරය මෙම මාසයේ මුළු ${revenue} ක විකුණුම් ආදායමක් ලබා ගත යුතු අතර, ඒ සඳහා ඒකක ${unitsOrDaily} ක් විකිණිය යුතුය.`,
  },
  ta: {
    headerTitle: "இலாப நிலை மற்றும் பங்களிப்பு வரம்பு பகுப்பாய்வு அறிக்கை",
    companySub: "Zynveo ERP மற்றும் விலை நிர்ணய அமைப்பால் உருவாக்கப்பட்டது",
    dateLabel: "அறிக்கை திகதி",
    modelLabel: "வணிக முறை",
    execTitle: "நிர்வாக சுருக்கம் மற்றும் முக்கிய நிதி முடிவு",
    metricsTitle: "முக்கிய நிதி கணக்கீடுகள் சுருக்கம்",
    metricCol: "அளவுரு / விளக்கம்",
    valueCol: "கணக்கிடப்பட்ட மதிப்பு",
    itemTableTitle: "சேவை மற்றும் மெனு பங்களிப்பு பகுப்பாய்வு",
    itemName: "சேவை / பொருளின் பெயர்",
    itemPrice: "விலை",
    itemCost: "மாறுபடும் செலவு",
    itemMargin: "பங்களிப்பு வரம்பு",
    itemVol: "மாதாந்திர அளவு",
    actionTitle: "மூலோபாய பரிந்துரைகள் மற்றும் செயல் திட்டம்",
    action1Title: "துல்லியமான அலகு செலவு கட்டுப்பாடு",
    action1Desc: "ஒரு அலகின் மாறுபடும் செலவு விற்பனை விலையை விட குறைவாக இருப்பதை உறுதி செய்யுங்கள். மூலப்பொருள் விலை 5% அதிகரித்தாலும் இலாப நிலைக்கு தேவையான விற்பனை அளவு பெரிதும் அதிகரிக்கும்.",
    action2Title: "நிலையான செலவு மேலாண்மை",
    action2Desc: "மாதாந்திர வாடகை, சம்பளம் அல்லது மின்சார கட்டணம் அதிகரிக்கும் போது, வணிகம் முதல் இலாப ரூபாயை ஈட்டுவதற்கு முன் ஈட்ட வேண்டிய குறைந்தபட்ச வருவாய் வரம்பு உயர்கிறது.",
    action3Title: "நேரடி இலாப கண்காணிப்பு",
    action3Desc: "பழைய எக்செல் விரிதாள்களுக்கு பதிலாக, நேரடி POS மற்றும் சப்ளையர் பில்களை இணைத்து தினமும் இலாப நிலையை கண்காணிக்கவும்.",
    ctaTitle: "✨ Zynveo Cloud ERP மூலம் உங்கள் இலாபம் மற்றும் இருப்பை தானியங்குபடுத்துங்கள்",
    ctaDesc: "நேரடி மூலப்பொருள் செலவுகள் மற்றும் POS இயந்திரங்களுடன் நேரடியாக இணைத்து, விரிதாள்கள் இல்லாமல் தானாகவே இலாப நிலை மற்றும் தினசரி இலக்குகளை கணக்கிடுங்கள்.",
    models: {
      single: "ஒற்றை தயாரிப்பு / உற்பத்தியாளர் முறை",
      "multi-mix": "சேவை மற்றும் மெனு கலவை முறை (சலூன் / உணவகம்)",
      "retail-margin": "பல்பொருள் அங்காடி மற்றும் சில்லறை வரம்பு முறை",
    },
    labels: {
      fixed: "மொத்த நிலையான செலவுகள் (மாதாந்திர)",
      targetProfit: "இலக்கு மாதாந்திர நிகர இலாபம்",
      beUnits: "இலாப நிலைக்கு தேவையான மாதாந்திர அலகுகள்",
      beRevenue: "இலாப நிலைக்கு தேவையான மொத்த மாதாந்திர வருவாய்",
      dailyRegister: "தேவையான தினசரி Register வருவாய் இலக்கு",
      cmPercent: "சராசரி மொத்த பங்களிப்பு வரம்பு (%)",
      targetRevenue: "இலக்கு இலாபத்தை அடைய தேவையான வருவாய்",
    },
    execSummary: (fixed: string, revenue: string, unitsOrDaily: string, isRetail: boolean) =>
      isRetail
        ? `உங்கள் மாதாந்திர நிலையான செலவுகளான ${fixed} முழுமையாக ஈடுகட்டி இழப்பின்றி இலாப நிலையை அடைய, உங்கள் கடை இந்த மாதத்தில் மொத்தமாக ${revenue} வருவாய் ஈட்ட வேண்டும். இது நாளொன்றுக்கு சராசரியாக ${unitsOrDaily} இலக்காகும்.`
        : `உங்கள் மாதாந்திர நிலையான செலவுகளான ${fixed} முழுமையாக ஈடுகட்டி இழப்பின்றி இலாப நிலையை அடைய, உங்கள் வணிகம் இந்த மாதத்தில் மொத்தமாக ${revenue} வருவாய் ஈட்ட வேண்டும். இதற்கு ${unitsOrDaily} அலகுகள் விற்கப்பட வேண்டும்.`,
  },
};

function dailyTargetText(text: string) {
  return text;
}

const BreakEvenReportPreview = forwardRef<HTMLDivElement, BreakEvenReportPreviewProps>(
  ({ data, lang = "en" }, ref) => {
    const t = DICT[lang] || DICT.en;
    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: data.currencyCode || "USD",
        maximumFractionDigits: 0,
      }).format(val || 0);

    const formatNumber = (val: number) =>
      new Intl.NumberFormat("en-US").format(Math.round(val || 0));

    const isRetail = data.businessModel === "retail-margin";
    const unitsOrDailyStr = isRetail
      ? formatCurrency(data.retailBreakEvenDaily || 0)
      : `${formatNumber(data.activeBreakEvenUnits)} units`;

    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const modelName = t.models[data.businessModel] || data.businessModel;

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
                  {t.modelLabel}: <span className="text-indigo-700">{modelName}</span>
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
                formatCurrency(data.totalFixedCost),
                formatCurrency(data.activeBreakEvenRevenue),
                unitsOrDailyStr,
                isRetail
              )}
            </p>
          </div>

          {/* Key Financial Metrics Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              {t.metricsTitle}
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4 text-left">{t.metricCol}</th>
                    <th className="py-3 px-4 text-right">{t.valueCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 font-medium">
                    <td className="py-3 px-4 text-slate-700">{t.labels.fixed}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[13px]">
                      {formatCurrency(data.totalFixedCost)}
                    </td>
                  </tr>
                  {data.targetProfit > 0 && (
                    <tr className="hover:bg-slate-50/60 font-medium bg-emerald-50/30">
                      <td className="py-3 px-4 text-emerald-800 font-bold">{t.labels.targetProfit}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-[13px]">
                        {formatCurrency(data.targetProfit)}
                      </td>
                    </tr>
                  )}
                  {!isRetail && (
                    <tr className="hover:bg-slate-50/60 font-medium">
                      <td className="py-3 px-4 text-slate-700 font-bold">{t.labels.beUnits}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-indigo-600 text-[13px]">
                        {formatNumber(data.activeBreakEvenUnits)} units/mo
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50/60 font-medium bg-indigo-50/30">
                    <td className="py-3 px-4 text-slate-900 font-black">{t.labels.beRevenue}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                      {formatCurrency(data.activeBreakEvenRevenue)}
                    </td>
                  </tr>
                  {isRetail && (
                    <>
                      <tr className="hover:bg-slate-50/60 font-medium">
                        <td className="py-3 px-4 text-slate-700 font-bold">{t.labels.dailyRegister}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 text-[13px]">
                          {formatCurrency(data.retailBreakEvenDaily || 0)} / day
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60 font-medium">
                        <td className="py-3 px-4 text-slate-700">{t.labels.cmPercent}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[13px]">
                          {((data.retailCMRatio || 0) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    </>
                  )}
                  {data.activeTargetRevenue > data.activeBreakEvenRevenue && (
                    <tr className="hover:bg-slate-50/60 font-medium bg-emerald-50/50">
                      <td className="py-3 px-4 text-emerald-900 font-black">{t.labels.targetRevenue}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatCurrency(data.activeTargetRevenue)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional Multi-Mix Item Table */}
          {data.businessModel === "multi-mix" && data.mixItems && data.mixItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                {t.itemTableTitle}
              </h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3 text-left">{t.itemName}</th>
                      <th className="py-2.5 px-3 text-right">{t.itemPrice}</th>
                      <th className="py-2.5 px-3 text-right">{t.itemCost}</th>
                      <th className="py-2.5 px-3 text-right">{t.itemMargin}</th>
                      <th className="py-2.5 px-3 text-right">{t.itemVol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.mixItems.map((item, idx) => {
                      const p = Number(item.price) || 0;
                      const c = Number(item.cost) || 0;
                      const margin = p - c;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 font-medium">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.name || "Item"}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatCurrency(p)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(c)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">{formatCurrency(margin)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{item.volume || 0} units</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

BreakEvenReportPreview.displayName = "BreakEvenReportPreview";
export default BreakEvenReportPreview;
