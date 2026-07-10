"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { generateAndDownloadToolPDF } from "@/lib/report-pdf";

const BreakEvenChart = dynamic(() => import("./BreakEvenChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">
      Loading Interactive Chart...
    </div>
  ),
});
import {
  Calculator, TrendingUp, AlertCircle, Plus, Trash2, ArrowRight,
  BarChart3, Sparkles, Globe, Target, DollarSign, HelpCircle,
  Download, X, CheckCircle2, ShoppingBag, Utensils, Scissors,
  Store, Briefcase, Percent, Clock, Layers
} from "lucide-react";
import { CURRENCIES } from "@/lib/invoice-schema";

// ─── Multi-Language Translation Dictionary (English, Sinhala & Tamil) ───
const TRANSLATIONS = {
  en: {
    badge: "FREE BREAK-EVEN POINT CALCULATOR",
    title: "Break-Even Point Calculator",
    subtitle: "Discover exactly how much revenue or how many units your business must generate each month to cover all costs and start making a real profit.",
    
    // Business Models
    modelTitle: "Select Your Business Industry / Model",
    modelSingle: "Single Product / Service",
    modelSingleSub: "Manufacturers, simple products, single service package",
    modelMix: "Service & Menu Mix",
    modelMixSub: "Salons, Restaurants, Cafes, Bakeries, Agencies",
    modelRetail: "Supermarket & Retail Margin",
    modelRetailSub: "Supermarkets, Grocery Stores, Hardware, 1000+ SKUs",

    // Model Helper Descriptions
    singleDesc: "💡 Single Product Mode: Enter your selling price and variable cost for 1 unit. Perfect for brands with a flagship item.",
    mixDesc: "💡 Service & Menu Mix Mode: Salons and restaurants sell different items (e.g. Haircut vs Color, Appetizer vs Main). Enter your top items and expected monthly volume. We calculate the weighted average contribution margin to tell you exact item-by-item sales targets!",
    retailDesc: "💡 Supermarket & Retail Margin Mode: When you have 10,000+ SKUs (milk, soap, rice), counting individual units is impossible. Enter your store's average Gross Profit / Contribution Margin % to instantly find your required daily and monthly store turnover!",

    // Inputs
    simpleMode: "Simple Mode",
    advancedMode: "Advanced Mode (Line Items)",
    priceLabel: "Selling Price (Per Unit)",
    priceSub: "How much you charge the customer for 1 unit",
    targetProfitLabel: "Target Monthly Net Profit",
    targetProfitPlaceholder: "Optional goal",
    fixedCostLabel: "Total Fixed Costs (Monthly)",
    fixedCostSub: "Expenses that don't change based on sales (e.g., Rent, Salaries, Electricity).",
    variableCostLabel: "Variable Cost (Per Unit)",
    variableCostSub: "Cost to produce one single unit (e.g., Raw Materials, Packaging).",
    advFixedLabel: "Fixed Costs (Monthly)",
    advVariableLabel: "Variable Costs (Per Unit)",
    addCost: "Add Expense Row",
    totalLabel: "Total",
    perUnit: "/ unit",
    realtimeActive: "Real-time active",
    inputTitle: "Cost & Pricing Details",

    // Multi-Mix Inputs
    mixTableTitle: "Your Top Services or Menu Items",
    mixItemName: "Service / Item Name",
    mixItemPrice: "Price",
    mixItemCost: "Cost",
    mixItemVolume: "Monthly Sales Vol (Est.)",
    mixAddItem: "Add Service / Item",
    mixContribution: "Margin",

    // Retail Margin Inputs
    retailMarginLabel: "Average Store Gross Profit / Contribution Margin (%)",
    retailMarginSub: "Typical grocery/supermarket margin is 18%–25%. Apparel/Hardware is 30%–45%.",
    retailHoursLabel: "Daily Store Open Hours",
    retailHoursSub: "Used to calculate exact hourly register sales targets",

    // Results
    breakEvenUnitsTitle: "Break-Even Units Required",
    breakEvenUnitsDesc: "Units needed per month to cover all costs.",
    breakEvenRevenueTitle: "Break-Even Monthly Revenue",
    breakEvenRevenueDesc: "Total monthly turnover needed to break even.",
    contributionMarginTitle: "Contribution Margin",
    contributionMarginDesc: "Profit left after deducting direct variable costs.",
    targetProfitBanner: "To hit your {profit} monthly net profit goal:",
    targetProfitUnits: "You must generate {revenue} in sales ({units} units) this month.",
    targetProfitRetail: "You must generate {revenue} in store sales ({daily}/day) this month.",

    // Multi-Mix Breakdown Results
    mixBreakdownTitle: "Required Monthly Sales Breakdown (By Item)",
    mixBreakdownSub: "To cover your monthly bills ({fixed}) and break even, your staff must sell exactly:",
    mixRequiredUnits: "Units / Mo",
    mixRequiredDaily: "Units / Day",
    mixItemShare: "Revenue Share",

    // Retail Breakdown Results
    dailyTargetTitle: "Required Daily Register Sales",
    dailyTargetDesc: "Average turnover needed every single day (30 days/mo).",
    hourlyTargetTitle: "Required Hourly Register Sales",
    hourlyTargetDesc: "Turnover needed per hour during open business hours.",

    // Chart
    chartTitle: "Break-Even Analysis Chart",
    fixedCostsLine: "Fixed Costs",
    totalCostsLine: "Total Costs",
    revenueLine: "Revenue",
    unitsSold: "Units Sold",
    storeTurnover: "Monthly Turnover",

    // Warning
    warningTitle: "Negative Contribution Margin",
    warningText: "Your direct cost per unit or item is higher than your selling price. You lose money on every sale. Please adjust your pricing or reduce supplier costs.",

    // PLG Hook
    plgTitle: "Stop guessing your profit margins.",
    plgText: "Did your raw material supplier just raise prices? Did your store utility bill spike? Manually recalculating break-even points every month is dangerous. Our upcoming Financial & Accounting ERP Module connects directly to your expenses and POS, automatically updating your real-time break-even dashboard across all branches.",
    plgCta: "Join the ERP Waitlist",

    // Lead Capture
    exportBtn: "Download PDF Report",
    modalTitle: "Download Your Break-Even Report",
    modalSub: "Enter your email to receive this comprehensive break-even and sales mix analysis as a ready-to-share PDF report.",
    successMsg: "Report sent to your inbox!",
    workEmail: "Your Email Address",
    sendReport: "Send PDF Report",
    privacyText: "We respect your privacy. No spam.",

    // Guide
    guideTitle: "💡 Quick Guide: How do different industries calculate break-even?",
    guidePrice: "Single Product Mode: Best for manufacturers. Calculates exact unit count needed based on Unit Price minus Unit Variable Cost.",
    guideFixed: "Salons & Restaurants (Service Mix): You sell $40 Haircuts, $120 Colors, or $15 Appetizers. We use your estimated sales mix to compute the weighted contribution margin and give you item-by-item monthly targets.",
    guideVariable: "Supermarkets & Retail: With 10,000 SKUs on shelves, counting unit items is impossible. Use your average store margin % (e.g., 22%) to calculate exact monthly, daily, and hourly cash register revenue targets.",
    guideTarget: "Fixed Costs vs Variable Costs: Fixed costs stay the same every month (Rent, Staff Salaries, Wifi). Variable costs increase every time you sell 1 item (Raw food ingredients, Shampoo used, Product packaging).",

    mobileBreakdown: "Breakdown",
  },
  si: {
    badge: "නොමිලේ ලබා දෙන ලාභ සීමා ගණකය",
    title: "ලාභ සීමා ලක්ෂ්‍ය ගණකය (Break-Even)",
    subtitle: "ඔබේ සියලු වියදම් ආවරණය කර සත්‍ය ලාභයක් ලබා ගැනීමට මසකට උපයා ගත යුතු ආදායම හෝ විකුණිය යුතු ඒකක ගණන සොයාගන්න.",
    
    modelTitle: "ඔබේ ව්‍යාපාර ක්ෂේත්‍රය / ආකෘතිය තෝරන්න",
    modelSingle: "තනි නිෂ්පාදනයක් / සේවාවක්",
    modelSingleSub: "නිෂ්පාදකයින්, සරල භාණ්ඩ, තනි සේවා පැකේජ",
    modelMix: "සේවා සහ මෙනු එකතුව (Mix)",
    modelMixSub: "සැලෝන්, අවන්හල්, කැෆේ, බේකරි, ආයතන",
    modelRetail: "සුපිරි වෙළඳසැල් සහ Retail ලාභ ප්‍රතිශතය",
    modelRetailSub: "සුපිරි වෙළඳසැල්, ග්‍රොසරි, හාඩ්වෙයාර් (භාණ්ඩ 1000+)",

    singleDesc: "💡 තනි නිෂ්පාදන ක්‍රමය: එක් ඒකකයක විකුණුම් මිල සහ විචල්‍ය වියදම ඇතුළත් කරන්න.",
    mixDesc: "💡 සේවා සහ මෙනු එකතු ක්‍රමය: සැලෝන් සහ අවන්හල්වල විවිධ මිල ගණන් සහිත සේවාවන් ඇත (උදා: Haircut vs Color). ඔබේ ප්‍රධාන සේවාවන් සහ මාසික විකුණුම් ප්‍රමාණය ඇතුළත් කරන්න. අප විසින් එක් එක් සේවාවෙන් මසකට කොපමණ ප්‍රමාණයක් කළ යුතුදැයි නිශ්චිතව ගණනය කර දෙයි!",
    retailDesc: "💡 සුපිරි වෙළඳසැල් ක්‍රමය: භාණ්ඩ 10,000+ ක් ඇති විට ඒකක ගණන් කිරීම අපහසුයි. ඔබේ වෙළඳසැලේ සාමාන්‍ය දළ ලාභ ප්‍රතිශතය (%) ඇතුළත් කර මාසික, දෛනික සහ පැයකට අවශ්‍ය මුදල් අයකැමි (Register) ආදායම දැනගන්න!",

    simpleMode: "සරල ක්‍රමය",
    advancedMode: "විස්තරාත්මක ක්‍රමය",
    priceLabel: "විකුණුම් මිල (ඒකකයකට)",
    priceSub: "පාරිභෝගිකයාගෙන් අය කරන ඒකකයක මිල",
    targetProfitLabel: "මාසික ඉලක්ක ශුද්ධ ලාභය",
    targetProfitPlaceholder: "විකල්ප ඉලක්කය",
    fixedCostLabel: "මුළු ස්ථාවර වියදම් (මාසික)",
    fixedCostSub: "විකුණුම් ප්‍රමාණය අනුව වෙනස් නොවන වියදම් (උදා: කුලිය, වැටුප්).",
    variableCostLabel: "විචල්‍ය වියදම (ඒකකයකට)",
    variableCostSub: "එක් ඒකකයක් නිපදවීමට යන වියදම (උදා: අමුද්‍රව්‍ය, ඇසුරුම්).",
    advFixedLabel: "ස්ථාවර වියදම් (මාසික)",
    advVariableLabel: "විචල්‍ය වියදම් (ඒකකයකට)",
    addCost: "වියදම් පේළියක් එක් කරන්න",
    totalLabel: "එකතුව",
    perUnit: "/ ඒකකයකට",
    realtimeActive: "සජීවී ක්‍රියාකාරී",
    inputTitle: "වියදම් සහ මිල විස්තර",

    mixTableTitle: "ඔබේ ප්‍රධාන සේවාවන් හෝ මෙනු අයිතම",
    mixItemName: "සේවාවේ / අයිතමයේ නම",
    mixItemPrice: "මිල",
    mixItemCost: "වියදම",
    mixItemVolume: "මාසික විකුණුම් (අනුමාන)",
    mixAddItem: "සේවාවක් එක් කරන්න",
    mixContribution: "ලාභය",

    retailMarginLabel: "වෙළඳසැලේ සාමාන්‍ය දළ ලාභ ප්‍රතිශතය (%)",
    retailMarginSub: "සාමාන්‍ය ග්‍රොසරි/සුපිරි වෙළඳසැල් ලාභය 18%–25% වේ. ඇඟලුම්/හාඩ්වෙයාර් 30%–45% වේ.",
    retailHoursLabel: "දිනකට වෙළඳසැල විවෘත පැය ගණන",
    retailHoursSub: "පැයකට අවශ්‍ය නිශ්චිත අයකැමි ආදායම ගණනය කිරීමට යොදා ගනී",

    breakEvenUnitsTitle: "ලාභ සීමා ඒකක",
    breakEvenUnitsDesc: "සියලු වියදම් ආවරණය කිරීමට මසකට අවශ්‍ය ඒකක.",
    breakEvenRevenueTitle: "ලාභ සීමා ආදායම",
    breakEvenRevenueDesc: "ලාභ සීමාව ළඟා කර ගැනීමට අවශ්‍ය මුළු මාසික විකුණුම්.",
    contributionMarginTitle: "දායක ලාභය",
    contributionMarginDesc: "විචල්‍ය වියදම් අඩු කළ පසු ඉතිරි ලාභය.",
    targetProfitBanner: "ඔබේ {profit} ලාභ ඉලක්කය සපුරා ගැනීමට:",
    targetProfitUnits: "මෙම මාසයේ මුළු {revenue} ක විකුණුම් ({units} ඒකක) කළ යුතුයි.",
    targetProfitRetail: "මෙම මාසයේ මුළු {revenue} ක ආදායමක් (දිනකට {daily}) ලබා ගත යුතුයි.",

    mixBreakdownTitle: "අවශ්‍ය මාසික විකුණුම් විශ්ලේෂණය (අයිතම අනුව)",
    mixBreakdownSub: "ඔබේ මාසික වියදම් ({fixed}) ආවරණය කර ලාභ සීමාවට පැමිණීමට එක් එක් අයිතමයෙන් විකිණිය යුතු ප්‍රමාණය:",
    mixRequiredUnits: "මාසික ඒකක",
    mixRequiredDaily: "දෛනික ඒකක",
    mixItemShare: "ආදායම් ප්‍රතිශතය",

    dailyTargetTitle: "අවශ්‍ය දෛනික Register ආදායම",
    dailyTargetDesc: "සෑම දිනකම උපයා ගත යුතු සාමාන්‍ය ආදායම (දින 30).",
    hourlyTargetTitle: "අවශ්‍ය පැයක Register ආදායම",
    hourlyTargetDesc: "වෙළඳසැල විවෘතව ඇති එක් පැයකදී උපයා ගත යුතු ආදායම.",

    chartTitle: "ලාභ සීමා විශ්ලේෂණ ප්‍රස්ථාරය",
    fixedCostsLine: "ස්ථාවර වියදම්",
    totalCostsLine: "මුළු වියදම්",
    revenueLine: "ආදායම",
    unitsSold: "විකුණූ ඒකක",
    storeTurnover: "මාසික ආදායම",

    warningTitle: "සෘණ දායක ලාභය",
    warningText: "ඔබේ ඒකකයක විචල්‍ය වියදම විකුණුම් මිලට වඩා වැඩියි. සෑම විකිණීමකදීම ඔබට පාඩු වේ. කරුණාකර මිල ගණන් සකසන්න.",

    plgTitle: "ඔබේ ලාභ ප්‍රතිශත අනුමාන කිරීම නවත්වන්න.",
    plgText: "අමුද්‍රව්‍ය සැපයුම්කරුගේ මිල ඉහළ ගියාද? විදුලි බිල ඉහළ ගියාද? සෑම මාසයකම ලාභ සීමාව අතින් ගණනය කිරීම භයානකයි. අපගේ මූල්‍ය සහ ගිණුම්කරණ ERP මොඩියුලය ඔබේ වියදම් සහ POS සමඟ සෘජුව සම්බන්ධ වී, සජීවී ලාභ සීමා ලක්ෂ්‍ය ස්වයංක්‍රීයව යාවත්කාලීන කරයි.",
    plgCta: "ERP බලා සිටීමේ ලයිස්තුවට එක්වන්න",

    exportBtn: "PDF වාර්තාව බාගත කරන්න",
    modalTitle: "ලාභ සීමා වාර්තාව බාගත කරන්න",
    modalSub: "මෙම ලාභ සීමා විශ්ලේෂණය PDF එකක් ලෙස ලබා ගැනීමට ඔබේ ඊමේල් ලිපිනය ඇතුළත් කරන්න.",
    successMsg: "වාර්තාව ඔබේ ඊමේල් ගිණුමට යවන ලදී!",
    workEmail: "ඔබේ ඊමේල් ලිපිනය",
    sendReport: "PDF වාර්තාව ලබාගන්න",
    privacyText: "ඔබේ පෞද්ගලිකත්වය අපි සුරකිමු. අනවශ්‍ය ඊමේල් එවන්නේ නැත.",

    guideTitle: "💡 කෙටි උපදෙස්: විවිධ ව්‍යාපාර ලාභ සීමාව ගණනය කරන්නේ කෙසේද?",
    guidePrice: "තනි නිෂ්පාදන ක්‍රමය: නිෂ්පාදකයින් සඳහා සුදුසුයි. ඒකක මිල සහ ඒකක විචල්‍ය වියදම මත නිශ්චිත ඒකක ගණන ගණනය කරයි.",
    guideFixed: "සැලෝන් සහ අවන්හල් (Service Mix): ඔබ රු. 1,500 ක Haircut හෝ රු. 4,000 ක Color විකුණයි. අපි ඔබේ විකුණුම් එකතුව අනුව බර තැබූ ලාභය ගණනය කර එක් එක් සේවාවෙන් මසකට කළ යුතු ප්‍රමාණය පෙන්වයි.",
    guideVariable: "සුපිරි වෙළඳසැල් සහ Retail: භාණ්ඩ 10,000+ ක් ඇති විට ඒකක ගණන් කිරීම නොහැක. සාමාන්‍ය ලාභ ප්‍රතිශතය (උදා: 22%) යොදාගෙන මාසික, දෛනික සහ පැයකට අවශ්‍ය Register ආදායම ගණනය කරයි.",
    guideTarget: "ස්ථාවර වියදම් vs විචල්‍ය වියදම්: කුලිය, වැටුප්, විදුලිය මාසිකව ස්ථාවරයි. අමුද්‍රව්‍ය, ඇසුරුම්, කොමිස් විකුණුම් සමඟ වැඩි වේ.",

    mobileBreakdown: "විස්තර",
  },
  ta: {
    badge: "இலவச இலாப நிலை புள்ளி கணிப்பான்",
    title: "இலாப நிலை புள்ளி கணிப்பான் (Break-Even)",
    subtitle: "உங்கள் அனைத்து செலவுகளையும் ஈடுகட்டி உண்மையான இலாபம் ஈட்ட ஒரு மாதத்தில் ஈட்ட வேண்டிய வருவாய் அல்லது விற்க வேண்டிய அலகுகளைக் கண்டறியுங்கள்.",
    
    modelTitle: "உங்கள் வணிகத் துறையை / மாதிரியைத் தேர்ந்தெடுக்கவும்",
    modelSingle: "ஒற்றை தயாரிப்பு / சேவை",
    modelSingleSub: "உற்பத்தியாளர்கள், எளிய தயாரிப்புகள், ஒற்றை சேவை",
    modelMix: "சேவை & மெனு கலவை (Mix)",
    modelMixSub: "சலூன்கள், உணவகங்கள், கஃபேக்கள், பேக்கரிகளுக்கு",
    modelRetail: "பல்பொருள் அங்காடி & சில்லறை இலாப விகிதம்",
    modelRetailSub: "பல்பொருள் அங்காடிகள், மளிகை, ஹார்டுவேர் (1000+ பொருட்கள்)",

    singleDesc: "💡 ஒற்றை தயாரிப்பு முறை: ஒரு அலகின் விற்பனை விலை மற்றும் மாறுபடும் செலவை உள்ளிடவும்.",
    mixDesc: "💡 சேவை & மெனு கலவை முறை: சலூன்கள் மற்றும் உணவகங்களில் வெவ்வேறு விலைகளில் சேவைகள் உள்ளன (எ.கா. Haircut vs Color). உங்கள் முக்கிய சேவைகள் மற்றும் மாதாந்திர விற்பனை அளவை உள்ளிடவும். ஒவ்வொரு சேவையிலும் மாதம் எத்தனை செய்ய வேண்டும் என்பதை நாங்கள் துல்லியமாகக் கணக்கிடுவோம்!",
    retailDesc: "💡 பல்பொருள் அங்காடி முறை: 10,000+ பொருட்கள் இருக்கும் போது அலகுகளை எண்ணுவது சாத்தியமில்லை. உங்கள் கடையில் சராசரி மொத்த இலாப விகிதத்தை (%) உள்ளிட்டு மாதாந்திர, தினசரி மற்றும் மணிநேர பணப் பதிவேடு (Register) இலக்குகளை உடனே பாருங்கள்!",

    simpleMode: "எளிய முறை",
    advancedMode: "விரிவான முறை",
    priceLabel: "விற்பனை விலை (ஒரு அலகுக்கு)",
    priceSub: "ஒரு அலகுக்கு வாடிக்கையாளரிடம் வசூலிக்கும் விலை",
    targetProfitLabel: "மாதாந்திர இலக்கு நிகர இலாபம்",
    targetProfitPlaceholder: "விருப்ப இலக்கு",
    fixedCostLabel: "மொத்த நிலையான செலவுகள் (மாதாந்திர)",
    fixedCostSub: "விற்பனை அளவைப் பொருட்படுத்தாமல் மாறாத செலவுகள் (எ.கா. வாடகை, சம்பளம்).",
    variableCostLabel: "மாறுபடும் செலவு (ஒரு அலகுக்கு)",
    variableCostSub: "ஒரு அலகை உற்பத்தி செய்ய ஆகும் செலவு (எ.கா. மூலப்பொருட்கள், பேக்கிங்).",
    advFixedLabel: "நிலையான செலவுகள் (மாதாந்திர)",
    advVariableLabel: "மாறுபடும் செலவுகள் (ஒரு அலகுக்கு)",
    addCost: "செலவு வரிசை சேர்க்க",
    totalLabel: "மொத்தம்",
    perUnit: "/ அலகு",
    realtimeActive: "நேரலை கணிப்பு",
    inputTitle: "செலவு மற்றும் விலை விவரங்கள்",

    mixTableTitle: "உங்கள் முக்கிய சேவைகள் அல்லது மெனு பொருட்கள்",
    mixItemName: "சேவை / பொருளின் பெயர்",
    mixItemPrice: "விலை",
    mixItemCost: "செலவு",
    mixItemVolume: "மாதாந்திர விற்பனை அளவு (மதிப்பீடு)",
    mixAddItem: "சேவை சேர்க்க",
    mixContribution: "இலாபம்",

    retailMarginLabel: "சராசரி மொத்த இலாப விகிதம் (%)",
    retailMarginSub: "வழக்கமான மளிகை/சூப்பர்மார்க்கெட் இலாபம் 18%–25%. ஆடைகள்/ஹார்டுவேர் 30%–45%.",
    retailHoursLabel: "தினசரி கடை திறந்திருக்கும் மணிநேரம்",
    retailHoursSub: "மணிநேர பணப் பதிவேடு விற்பனை இலக்கைக் கணக்கிட உதவுகிறது",

    breakEvenUnitsTitle: "இலாப நிலை அலகுகள்",
    breakEvenUnitsDesc: "அனைத்து செலவுகளையும் ஈடுகட்ட மாதத்திற்கு தேவையான அலகுகள்.",
    breakEvenRevenueTitle: "இலாப நிலை மாதாந்திர வருவாய்",
    breakEvenRevenueDesc: "இலாப நிலையை அடைய தேவையான மொத்த மாதாந்திர விற்பனை.",
    contributionMarginTitle: "பங்களிப்பு இலாபம்",
    contributionMarginDesc: "மாறுபடும் செலவுகள் கழித்த பின் எஞ்சும் இலாபம்.",
    targetProfitBanner: "உங்கள் {profit} இலாப இலக்கை அடைய:",
    targetProfitUnits: "இந்த மாதம் மொத்தம் {revenue} விற்பனை ({units} அலகுகள்) செய்ய வேண்டும்.",
    targetProfitRetail: "இந்த மாதம் மொத்தம் {revenue} வருவாய் (தினசரி {daily}) ஈட்ட வேண்டும்.",

    mixBreakdownTitle: "தேவையான மாதாந்திர விற்பனை பகுப்பாய்வு (பொருள் வாரியாக)",
    mixBreakdownSub: "உங்கள் மாதாந்திர செலவுகளை ({fixed}) ஈடுகட்டி இலாப நிலையை அடைய ஒவ்வொரு சேவையிலும் விற்க வேண்டிய அளவு:",
    mixRequiredUnits: "மாதாந்திர அலகுகள்",
    mixRequiredDaily: "தினசரி அலகுகள்",
    mixItemShare: "வருவாய் பங்கு",

    dailyTargetTitle: "தேவையான தினசரி Register விற்பனை",
    dailyTargetDesc: "ஒவ்வொரு நாளும் ஈட்ட வேண்டிய சராசரி வருவாய் (30 நாட்கள்).",
    hourlyTargetTitle: "தேவையான மணிநேர Register விற்பனை",
    hourlyTargetDesc: "கடை திறந்திருக்கும் ஒவ்வொரு மணி நேரத்திலும் ஈட்ட வேண்டிய வருவாய்.",

    chartTitle: "இலாப நிலை பகுப்பாய்வு வரைபடம்",
    fixedCostsLine: "நிலையான செலவுகள்",
    totalCostsLine: "மொத்த செலவுகள்",
    revenueLine: "வருவாய்",
    unitsSold: "விற்கப்பட்ட அலகுகள்",
    storeTurnover: "மாதாந்திர வருவாய்",

    warningTitle: "எதிர்மறை பங்களிப்பு இலாபம்",
    warningText: "உங்கள் ஒரு அலகின் மாறுபடும் செலவு விற்பனை விலையை விட அதிகம். ஒவ்வொரு விற்பனையிலும் நஷ்டம் ஏற்படுகிறது. விலையை சரிசெய்யவும்.",

    plgTitle: "உங்கள் இலாப சதவீதங்களை யூகிப்பதை நிறுத்துங்கள்.",
    plgText: "மூலப்பொருள் சப்ளையர் விலையை உயர்த்தினாரா? மின் கட்டணம் அதிகரித்ததா? ஒவ்வொரு மாதமும் இலாப நிலையை கையால் கணக்கிடுவது ஆபத்தானது. எங்கள் நிதி ERP தொகுதி உங்கள் செலவுகளுடன் நேரடியாக இணைந்து, நேரலை இலாப நிலையை தானாகவே புதுப்பிக்கும்.",
    plgCta: "ERP காத்திருப்பு பட்டியலில் சேரவும்",

    exportBtn: "PDF அறிக்கையை பதிவிறக்க",
    modalTitle: "இலாப நிலை அறிக்கையை பதிவிறக்கவும்",
    modalSub: "இந்த இலாப நிலை பகுப்பாய்வை PDF ஆகப் பெற உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
    successMsg: "அறிக்கை உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது!",
    workEmail: "உங்கள் மின்னஞ்சல் முகவரி",
    sendReport: "PDF அறிக்கையைப் பெறுக",
    privacyText: "உங்கள் தனியுரிமையை மதிக்கிறோம். தேவையற்ற மின்னஞ்சல்கள் அனுப்பப்படாது.",

    guideTitle: "💡 வழிகாட்டி: வெவ்வேறு தொழில்கள் இலாப நிலையை எவ்வாறு கணக்கிடுகின்றன?",
    guidePrice: "ஒற்றை தயாரிப்பு முறை: உற்பத்தியாளர்களுக்கு சிறந்தது. அலகு விலை மற்றும் மாறுபடும் செலவு அடிப்படையில் சரியான அலகுகளைக் கணக்கிடுகிறது.",
    guideFixed: "சலூன்கள் & உணவகங்கள் (Service Mix): நீங்கள் $40 Haircut அல்லது $120 Color விற்கிறீர்கள். உங்கள் விற்பனை கலவை அடிப்படையில் சராசரி இலாபத்தைக் கணக்கிட்டு சேவை வாரியான இலக்குகளைத் தருகிறோம்.",
    guideVariable: "பல்பொருள் அங்காடிகள் & சில்லறை: 10,000 பொருட்களுடன் அலகுகளை எண்ண முடியாது. சராசரி இலாப விகிதத்தை (எ.கா. 22%) பயன்படுத்தி மாதாந்திர, தினசரி மற்றும் மணிநேர பணப் பதிவேடு இலக்குகளைக் கணக்கிடலாம்.",
    guideTarget: "நிலையான vs மாறுபடும் செலவுகள்: வாடகை, சம்பளம், மின்சாரம் மாதாந்திரம் மாறாது. மூலப்பொருட்கள், பேக்கிங் விற்பனையுடன் அதிகரிக்கும்.",

    mobileBreakdown: "விவரங்கள்",
  }
};

// ─── Advanced Mode Default Line Items ───
const DEFAULT_FIXED_COSTS = [
  { id: 1, name: "Rent / Lease", amount: 65000 },
  { id: 2, name: "Staff Salaries & Wages", amount: 110000 },
  { id: 3, name: "Utilities (Electric, Water, Wifi)", amount: 25000 },
];

const DEFAULT_VARIABLE_COSTS = [
  { id: 1, name: "Raw Materials / Ingredients", amount: 450 },
  { id: 2, name: "Packaging & Consumables", amount: 100 },
  { id: 3, name: "Shipping / Commission", amount: 50 },
];

// ─── Multi-Service / Salon / Restaurant Default Menu Items ───
const DEFAULT_MIX_ITEMS = [
  { id: 1, name: "Haircut / Styling (Quick Service)", price: 2500, cost: 300, volume: 150 },
  { id: 2, name: "Hair Coloring & Highlights (Premium)", price: 12000, cost: 3200, volume: 60 },
  { id: 3, name: "Facial / Beauty Treatment", price: 6500, cost: 1200, volume: 50 },
];

export function BreakEvenCalculatorClient() {
  // ─── UI State ───
  const [lang, setLang] = useState<"en" | "si" | "ta">("en");
  const [businessModel, setBusinessModel] = useState<"single" | "multi-mix" | "retail-margin">("single");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [currencyCode, setCurrencyCode] = useState<string>("LKR");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currObj = CURRENCIES.find((c) => c.code === currencyCode) || {
    symbol: "Rs.",
    code: "LKR",
    name: "LKR - Sri Lankan Rupee (Rs.)",
  };
  const currency = currObj.symbol;
  const t = TRANSLATIONS[lang];
  const isIndic = lang === "si" || lang === "ta";

  // ─── Core Financial State ───
  const [targetProfit, setTargetProfit] = useState<number>(50000);

  // Single Product State
  const [price, setPrice] = useState<number>(1500);
  const [simpleFixedCost, setSimpleFixedCost] = useState<number>(200000);
  const [simpleVariableCost, setSimpleVariableCost] = useState<number>(600);

  // Advanced Mode (Dynamic Line Items)
  const [advancedFixedCosts, setAdvancedFixedCosts] = useState(DEFAULT_FIXED_COSTS);
  const [advancedVariableCosts, setAdvancedVariableCosts] = useState(DEFAULT_VARIABLE_COSTS);

  // Multi-Mix State
  const [mixItems, setMixItems] = useState(DEFAULT_MIX_ITEMS);

  // Retail Margin State
  const [retailMarginPct, setRetailMarginPct] = useState<number>(22);
  const [retailDailyHours, setRetailDailyHours] = useState<number>(14);

  // ─── Computed Totals ───
  const totalFixedCost = isAdvanced
    ? advancedFixedCosts.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    : simpleFixedCost;

  const totalVariableCostPerUnit = isAdvanced
    ? advancedVariableCosts.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    : simpleVariableCost;

  // ─── Mathematical Engines Across Business Models ───

  // 1. Single Product Math
  const singleContributionMargin = price - totalVariableCostPerUnit;
  const isSingleProfitable = singleContributionMargin > 0;
  const singleBreakEvenUnits = isSingleProfitable ? Math.ceil(totalFixedCost / singleContributionMargin) : 0;
  const singleBreakEvenRevenue = singleBreakEvenUnits * price;
  const singleTargetUnits = isSingleProfitable ? Math.ceil((totalFixedCost + targetProfit) / singleContributionMargin) : 0;
  const singleTargetRevenue = singleTargetUnits * price;

  // 2. Multi-Mix (Salon / Restaurant) Math
  const totalExpectedRevenue = mixItems.reduce((acc, item) => acc + (item.price * item.volume), 0);
  const totalExpectedVariableCost = mixItems.reduce((acc, item) => acc + (item.cost * item.volume), 0);
  const totalExpectedUnits = mixItems.reduce((acc, item) => acc + item.volume, 0);
  
  const mixContributionMarginDollar = totalExpectedUnits > 0 ? (totalExpectedRevenue - totalExpectedVariableCost) / totalExpectedUnits : 0;
  const mixCMRatio = totalExpectedRevenue > 0 ? (totalExpectedRevenue - totalExpectedVariableCost) / totalExpectedRevenue : 0;
  const isMixProfitable = mixCMRatio > 0 && totalExpectedRevenue > 0;
  
  const mixBreakEvenRevenue = isMixProfitable ? totalFixedCost / mixCMRatio : 0;
  const mixBreakEvenTotalUnits = isMixProfitable && mixContributionMarginDollar > 0
    ? Math.ceil(totalFixedCost / mixContributionMarginDollar)
    : 0;
  
  const mixTargetRevenue = isMixProfitable ? (totalFixedCost + targetProfit) / mixCMRatio : 0;
  const mixTargetTotalUnits = isMixProfitable && mixContributionMarginDollar > 0
    ? Math.ceil((totalFixedCost + targetProfit) / mixContributionMarginDollar)
    : 0;

  // Itemized Break-Even Breakdown for Multi-Mix
  const mixBreakdown = useMemo(() => {
    if (!isMixProfitable || totalExpectedRevenue === 0) return [];
    return mixItems.map((item) => {
      const revenueShare = (item.price * item.volume) / totalExpectedRevenue;
      const requiredItemRevenue = mixBreakEvenRevenue * revenueShare;
      const requiredUnitsMonthly = item.price > 0 ? Math.ceil(requiredItemRevenue / item.price) : 0;
      const requiredUnitsDaily = (requiredUnitsMonthly / 30).toFixed(1);
      const marginDollar = item.price - item.cost;
      const marginPct = item.price > 0 ? Math.round((marginDollar / item.price) * 100) : 0;
      return {
        ...item,
        revenueShare: Math.round(revenueShare * 100),
        requiredUnitsMonthly,
        requiredUnitsDaily,
        marginDollar,
        marginPct,
      };
    });
  }, [mixItems, mixBreakEvenRevenue, totalExpectedRevenue, isMixProfitable]);

  // 3. Supermarket & Retail Margin Math
  const retailCMRatio = retailMarginPct / 100;
  const isRetailProfitable = retailCMRatio > 0 && retailCMRatio < 1;
  const retailBreakEvenRevenue = isRetailProfitable ? totalFixedCost / retailCMRatio : 0;
  const retailBreakEvenDaily = retailBreakEvenRevenue / 30;
  const retailBreakEvenHourly = retailDailyHours > 0 ? retailBreakEvenDaily / retailDailyHours : 0;
  
  const retailTargetRevenue = isRetailProfitable ? (totalFixedCost + targetProfit) / retailCMRatio : 0;
  const retailTargetDaily = retailTargetRevenue / 30;

  // ─── Active Model Selection ───
  const isProfitableModel = 
    businessModel === "single" ? isSingleProfitable :
    businessModel === "multi-mix" ? isMixProfitable : isRetailProfitable;

  const activeBreakEvenUnits = 
    businessModel === "single" ? singleBreakEvenUnits :
    businessModel === "multi-mix" ? mixBreakEvenTotalUnits : 0; // retail doesn't use unit counts

  const activeBreakEvenRevenue = 
    businessModel === "single" ? singleBreakEvenRevenue :
    businessModel === "multi-mix" ? mixBreakEvenRevenue : retailBreakEvenRevenue;

  const activeTargetRevenue = 
    businessModel === "single" ? singleTargetRevenue :
    businessModel === "multi-mix" ? mixTargetRevenue : retailTargetRevenue;

  const activeTargetUnits = 
    businessModel === "single" ? singleTargetUnits :
    businessModel === "multi-mix" ? mixTargetTotalUnits : 0;

  // ─── Chart Data Generation Across All Models ───
  const chartData = useMemo(() => {
    if (!isProfitableModel) return [];

    if (businessModel === "single") {
      const maxUnits = Math.max(Math.ceil(singleBreakEvenUnits * 1.5), Math.ceil(singleTargetUnits * 1.2), 100);
      const steps = 12;
      const step = Math.ceil(maxUnits / steps);
      const data = [];
      for (let units = 0; units <= maxUnits; units += step) {
        data.push({
          units,
          FixedCosts: totalFixedCost,
          TotalCosts: totalFixedCost + totalVariableCostPerUnit * units,
          Revenue: price * units,
        });
      }
      return data;
    } 
    else if (businessModel === "multi-mix") {
      const maxUnits = Math.max(Math.ceil(mixBreakEvenTotalUnits * 1.5), Math.ceil(mixTargetTotalUnits * 1.2), 100);
      const steps = 12;
      const step = Math.ceil(maxUnits / steps);
      const avgPrice = totalExpectedUnits > 0 ? totalExpectedRevenue / totalExpectedUnits : 0;
      const avgCost = totalExpectedUnits > 0 ? totalExpectedVariableCost / totalExpectedUnits : 0;
      const data = [];
      for (let units = 0; units <= maxUnits; units += step) {
        data.push({
          units,
          FixedCosts: totalFixedCost,
          TotalCosts: totalFixedCost + avgCost * units,
          Revenue: avgPrice * units,
        });
      }
      return data;
    } 
    else {
      const maxTurnover = Math.max(retailBreakEvenRevenue * 1.6, retailTargetRevenue * 1.2, 500000);
      const steps = 12;
      const step = Math.ceil(maxTurnover / steps);
      const data = [];
      for (let rev = 0; rev <= maxTurnover; rev += step) {
        const cogs = rev * (1 - retailCMRatio);
        data.push({
          units: rev,
          FixedCosts: totalFixedCost,
          TotalCosts: totalFixedCost + cogs,
          Revenue: rev,
        });
      }
      return data;
    }
  }, [businessModel, totalFixedCost, totalVariableCostPerUnit, price, singleBreakEvenUnits, singleTargetUnits, mixBreakEvenTotalUnits, mixTargetTotalUnits, totalExpectedUnits, totalExpectedRevenue, totalExpectedVariableCost, retailBreakEvenRevenue, retailTargetRevenue, retailCMRatio, isProfitableModel]);

  // ─── Formatter Helpers ───
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("en-US").format(val);

  // ─── Row Helpers ───
  const addRow = (
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    items: any[],
    defaultRow: any
  ) => {
    setter([...items, { id: Date.now(), ...defaultRow }]);
  };

  const removeRow = (
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    items: any[],
    id: number
  ) => {
    setter(items.filter((item) => item.id !== id));
  };

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    items: any[],
    id: number,
    field: string,
    value: string | number
  ) => {
    setter(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // ─── Lead Capture & Simultaneous PDF Export ───
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;

    const summaryRows = [
      {
        label: "Business Model",
        value:
          businessModel === "single"
            ? "Single Product / Manufacturer"
            : businessModel === "multi-mix"
            ? "Service & Menu Mix (Salon/Restaurant)"
            : "Supermarket / Retail Margin Mode",
      },
      { label: "Total Fixed Monthly Costs", value: formatCurrency(totalFixedCost) },
      ...(targetProfit > 0 ? [{ label: "Target Monthly Profit Goal", value: formatCurrency(targetProfit) }] : []),
      ...(businessModel !== "retail-margin"
        ? [{ label: "Required Break-Even Units", value: `${formatNumber(activeBreakEvenUnits)} units/mo` }]
        : []),
      {
        label: "Required Break-Even Revenue / Turnover",
        value: `${formatCurrency(activeBreakEvenRevenue)}${businessModel === "retail-margin" ? "/month" : ""}`,
      },
      ...(businessModel === "retail-margin"
        ? [
            { label: "Required Daily Register Target", value: `${formatCurrency(retailBreakEvenDaily)}/day` },
            { label: "Gross Contribution Margin %", value: `${(retailCMRatio * 100).toFixed(1)}%` },
          ]
        : []),
      ...(activeTargetRevenue > activeBreakEvenRevenue
        ? [{ label: "Target Revenue (for Profit Goal)", value: formatCurrency(activeTargetRevenue) }]
        : []),
    ];

    const tableHeaders =
      businessModel === "multi-mix"
        ? ["Service/Item Name", "Price", "Variable Cost", "Contrib. Margin", "Monthly Vol."]
        : undefined;
    const tableRows =
      businessModel === "multi-mix"
        ? mixItems.map((item) => [
            String(item.name || "Item"),
            formatCurrency(Number(item.price) || 0),
            formatCurrency(Number(item.cost) || 0),
            formatCurrency((Number(item.price) || 0) - (Number(item.cost) || 0)),
            `${Number(item.volume) || 0} units`,
          ])
        : undefined;

    // 1. Immediately trigger instant vector PDF download
    try {
      generateAndDownloadToolPDF({
        toolName: "Break-Even Point Calculator",
        title: "Break-Even & Contribution Margin Report",
        summaryRows,
        tableHeaders,
        tableRows,
        fileName: `Zynveo_BreakEven_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      });
    } catch (err) {
      console.error("PDF download exception:", err);
    }

    // 2. Asynchronously save email (without duplicates) & send dual email via API
    try {
      await fetch("/api/tool-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: leadEmail,
          toolName: "Break-Even Point Calculator",
          reportTitle: "Your Break-Even Point & Contribution Margin Report",
          summaryData: summaryRows,
        }),
      });
    } catch (err) {
      console.error("API report exception:", err);
    }

    setIsSubmitted(true);
    setTimeout(() => {
      setIsLeadModalOpen(false);
      setIsSubmitted(false);
      setLeadEmail("");
    }, 2500);
  };

  // ─── Chart Axis Formatter ───
  const chartCurrencyFormat = (val: number) => {
    if (val >= 1_000_000) return `${currency.trim()}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${currency.trim()}${(val / 1_000).toFixed(0)}k`;
    return `${currency.trim()}${val}`;
  };

  return (
    <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8 max-w-6xl relative">

      {/* ─── Header Bar with Language & Currency Switcher ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 pb-6 border-b border-neutral-border/60 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-accent flex items-center justify-center text-white shadow-lg shadow-amber-500/25 shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-neutral-text tracking-tight text-lg sm:text-xl block leading-tight">Zynveo</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent block">Break-Even Intelligence</span>
          </div>
        </div>

        {/* Compact Glassmorphism Flag Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-border/30 p-1 rounded-2xl border border-neutral-border/80 backdrop-blur-md shadow-sm w-full sm:w-auto justify-center">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-neutral-muted px-2 flex items-center gap-1 uppercase tracking-wider">
            <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">Region</span>
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-black/5 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                lang === "en"
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                  : "text-neutral-muted hover:text-neutral-text hover:bg-slate-100/80"
              }`}
            >
              <img src="https://flagcdn.com/w40/gb.png" alt="" className="h-3 w-4.5 object-cover rounded-[2px] shadow-sm shrink-0" />
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => setLang("si")}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                lang === "si"
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                  : "text-neutral-muted hover:text-neutral-text hover:bg-slate-100/80"
              }`}
            >
              <img src="https://flagcdn.com/w40/lk.png" alt="" className="h-3 w-4.5 object-cover rounded-[2px] shadow-sm shrink-0" />
              <span>සිංහල</span>
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                lang === "ta"
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                  : "text-neutral-muted hover:text-neutral-text hover:bg-slate-100/80"
              }`}
            >
              <img src="https://flagcdn.com/w40/in.png" alt="" className="h-3 w-4.5 object-cover rounded-[2px] shadow-sm shrink-0" />
              <span>தமிழ்</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Top Banner ─── */}
      <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 px-1">
        <div className="inline-flex max-w-full items-center justify-center gap-2 px-3.5 py-1.5 rounded-2xl bg-accent/15 text-accent text-xs font-extrabold uppercase tracking-widest animate-bounce text-center leading-normal">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t.badge}</span>
        </div>
        <h1 className={`font-extrabold tracking-tight text-neutral-text ${isIndic ? "text-xl sm:text-3xl lg:text-[42px] leading-snug" : "text-2xl sm:text-4xl lg:text-5xl"}`}>
          {t.title}
        </h1>
        <p className={`max-w-2xl mx-auto leading-relaxed text-neutral-muted font-medium ${isIndic ? "text-xs sm:text-base lg:text-lg max-w-3xl" : "text-sm sm:text-base lg:text-lg"}`}>
          {t.subtitle}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INDUSTRY & BUSINESS MODEL SELECTOR (3-Tab Bar)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-8 sm:mb-10 space-y-2.5">
        <label className={`block text-center font-extrabold text-neutral-text uppercase tracking-wider text-xs sm:text-sm`}>
          {t.modelTitle}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 p-1.5 sm:p-2 bg-neutral-border/50 rounded-2xl sm:rounded-3xl border border-neutral-border/80 shadow-inner">
          
          {/* Tab 1: Single Product */}
          <button
            type="button"
            onClick={() => setBusinessModel("single")}
            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 text-left ${
              businessModel === "single"
                ? "bg-white text-neutral-text shadow-xl border border-primary/40 ring-2 ring-primary/20 scale-[1.01]"
                : "text-neutral-muted hover:text-neutral-text hover:bg-white/60"
            }`}
          >
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${businessModel === "single" ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-slate-200 text-slate-600"}`}>
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm sm:text-[15px] leading-tight truncate">{t.modelSingle}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug line-clamp-2">{t.modelSingleSub}</div>
            </div>
          </button>

          {/* Tab 2: Service & Menu Mix */}
          <button
            type="button"
            onClick={() => setBusinessModel("multi-mix")}
            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 text-left ${
              businessModel === "multi-mix"
                ? "bg-white text-neutral-text shadow-xl border border-amber-500/40 ring-2 ring-amber-500/20 scale-[1.01]"
                : "text-neutral-muted hover:text-neutral-text hover:bg-white/60"
            }`}
          >
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${businessModel === "multi-mix" ? "bg-amber-600 text-white shadow-md shadow-amber-500/30" : "bg-slate-200 text-slate-600"}`}>
              <Scissors className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm sm:text-[15px] leading-tight truncate">{t.modelMix}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug line-clamp-2">{t.modelMixSub}</div>
            </div>
          </button>

          {/* Tab 3: Supermarket / Retail Margin */}
          <button
            type="button"
            onClick={() => setBusinessModel("retail-margin")}
            className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 text-left ${
              businessModel === "retail-margin"
                ? "bg-white text-neutral-text shadow-xl border border-emerald-500/40 ring-2 ring-emerald-500/20 scale-[1.01]"
                : "text-neutral-muted hover:text-neutral-text hover:bg-white/60"
            }`}
          >
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${businessModel === "retail-margin" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30" : "bg-slate-200 text-slate-600"}`}>
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm sm:text-[15px] leading-tight truncate">{t.modelRetail}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug line-clamp-2">{t.modelRetailSub}</div>
            </div>
          </button>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN: The Input Engine
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-5/12 space-y-6">

          {/* Input Form Card */}
          <motion.div
            layout
            className="rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-8 shadow-xl border border-white/80 space-y-6 bg-white/95"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-border pb-4 gap-2 sm:gap-3">
              <h2 className="font-bold text-neutral-text flex items-center gap-2 text-lg sm:text-xl">
                <Calculator className="h-5 w-5 text-primary shrink-0" />
                <span>{t.inputTitle}</span>
              </h2>
              <span className="text-[11px] sm:text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto border border-emerald-200/50">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                {t.realtimeActive}
              </span>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-muted uppercase mb-1.5 tracking-wider">
                {lang === "si" ? "මුදල් වර්ගය (CURRENCY)" : lang === "ta" ? "நாணயம் (CURRENCY)" : "CURRENCY"}
              </label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full text-sm sm:text-[15px] p-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer shadow-2xs"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ─── Fixed Costs Section with Integrated Simple / Advanced Toggle ─── */}
            <div className="space-y-3.5 pt-3 border-t border-neutral-border/60">
              {/* Title and Subtitle taking 100% full width — zero text squeezing across any container size */}
              <div className="space-y-1">
                <span className="text-sm font-bold text-neutral-text block">
                  {t.fixedCostLabel} ({currency.trim()})
                </span>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  {t.fixedCostSub}
                </p>
              </div>

              {/* 100% Full Width / Segmented Mode Switcher right below the description */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full shadow-inner">
                <button
                  type="button"
                  onClick={() => setIsAdvanced(false)}
                  className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    !isAdvanced
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span>{t.simpleMode}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdvanced(true)}
                  className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    isAdvanced
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span>{t.advancedMode}</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {!isAdvanced ? (
                  <motion.div
                    key="simple-fixed"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="relative"
                  >
                    <span className="absolute left-4 top-3.5 text-neutral-muted font-bold text-sm">{currency.trim()}</span>
                    <input
                      type="number"
                      value={simpleFixedCost || ""}
                      onChange={(e) => setSimpleFixedCost(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="advanced-fixed"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.advFixedLabel}</span>
                      <button
                        type="button"
                        onClick={() => addRow(setAdvancedFixedCosts, advancedFixedCosts, { name: "", amount: 0 })}
                        className="text-xs text-primary font-bold flex items-center gap-1 hover:text-primary-hover transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <Plus size={14} /> {t.addCost}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {advancedFixedCosts.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border border-slate-200/60 sm:border-0">
                          <input
                            type="text"
                            value={item.name}
                            placeholder={lang === "si" ? "වියදම් නම" : lang === "ta" ? "செலவு பெயர்" : "Expense Name"}
                            onChange={(e) => updateRow(setAdvancedFixedCosts, advancedFixedCosts, item.id, "name", e.target.value)}
                            className="w-full sm:w-7/12 p-2.5 text-xs sm:text-sm border border-neutral-border rounded-lg outline-none focus:border-primary font-medium bg-white"
                          />
                          <div className="flex items-center gap-1.5 w-full sm:w-5/12">
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-2.5 text-xs text-neutral-muted font-bold">{currency.trim()}</span>
                              <input
                                type="number"
                                value={item.amount || ""}
                                placeholder="Amount"
                                onChange={(e) => updateRow(setAdvancedFixedCosts, advancedFixedCosts, item.id, "amount", Number(e.target.value))}
                                className="w-full pl-9 pr-2.5 py-2 text-xs sm:text-sm border border-neutral-border rounded-lg outline-none focus:border-primary font-bold bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRow(setAdvancedFixedCosts, advancedFixedCosts, item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-right text-xs sm:text-sm font-bold text-neutral-text border-t border-slate-200 pt-2">
                      {t.totalLabel}: <span className="text-primary font-black ml-1">{formatCurrency(totalFixedCost)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Target Profit Input (Common across all models) */}
            <div className="pt-2 border-t border-neutral-border/60">
              <label className="block mb-1.5">
                <span className="text-sm font-semibold text-neutral-text block">{t.targetProfitLabel} ({currency.trim()})</span>
                <span className="text-xs font-medium text-slate-500">{t.targetProfitPlaceholder}</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-neutral-muted font-bold text-sm">{currency.trim()}</span>
                <input
                  type="number"
                  value={targetProfit || ""}
                  onChange={(e) => setTargetProfit(Number(e.target.value))}
                  placeholder={t.targetProfitPlaceholder}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                MODEL-SPECIFIC DYNAMIC INPUTS
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              
              {/* 1. Single Product Mode Inputs */}
              {businessModel === "single" && (
                <motion.div
                  key="model-single"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="space-y-5 pt-4 border-t border-neutral-border/60"
                >
                  <div>
                    <label className="block mb-1.5">
                      <span className="text-sm font-semibold text-neutral-text block">{t.priceLabel} ({currency.trim()})</span>
                      <span className="text-xs font-medium text-slate-500">{t.priceSub}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-neutral-muted font-bold text-sm">{currency.trim()}</span>
                      <input
                        type="number"
                        value={price || ""}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {!isAdvanced ? (
                    <div>
                      <label className="block mb-1.5">
                        <span className="text-sm font-semibold text-neutral-text block">{t.variableCostLabel} ({currency.trim()})</span>
                        <span className="text-xs font-medium text-slate-500">{t.variableCostSub}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-neutral-muted font-bold text-sm">{currency.trim()}</span>
                        <input
                          type="number"
                          value={simpleVariableCost || ""}
                          onChange={(e) => setSimpleVariableCost(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.advVariableLabel}</span>
                        <button
                          type="button"
                          onClick={() => addRow(setAdvancedVariableCosts, advancedVariableCosts, { name: "", amount: 0 })}
                          className="text-xs text-primary font-bold flex items-center gap-1 hover:text-primary-hover transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                        >
                          <Plus size={14} /> {t.addCost}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {advancedVariableCosts.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border border-slate-200/60 sm:border-0">
                            <input
                              type="text"
                              value={item.name}
                              placeholder="Material / Cost Name"
                              onChange={(e) => updateRow(setAdvancedVariableCosts, advancedVariableCosts, item.id, "name", e.target.value)}
                              className="w-full sm:w-7/12 p-2.5 text-xs sm:text-sm border border-neutral-border rounded-lg outline-none focus:border-primary font-medium bg-white"
                            />
                            <div className="flex items-center gap-1.5 w-full sm:w-5/12">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-2.5 text-xs text-neutral-muted font-bold">{currency.trim()}</span>
                                <input
                                  type="number"
                                  value={item.amount || ""}
                                  placeholder="Amount"
                                  onChange={(e) => updateRow(setAdvancedVariableCosts, advancedVariableCosts, item.id, "amount", Number(e.target.value))}
                                  className="w-full pl-9 pr-2.5 py-2 text-xs sm:text-sm border border-neutral-border rounded-lg outline-none focus:border-primary font-bold bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRow(setAdvancedVariableCosts, advancedVariableCosts, item.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-right text-xs sm:text-sm font-bold text-neutral-text border-t border-slate-200 pt-2">
                        {t.totalLabel}: <span className="text-primary font-black ml-1">{formatCurrency(totalVariableCostPerUnit)} {t.perUnit}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 2. Service & Menu Mix Mode Inputs (Salon / Restaurant) */}
              {businessModel === "multi-mix" && (
                <motion.div
                  key="model-mix"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="space-y-4 pt-4 border-t border-neutral-border/60"
                >
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-neutral-text block">{t.mixTableTitle}</span>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Add your top services, prices, costs & monthly volume
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => addRow(setMixItems, mixItems, { name: "New Service", price: 3000, cost: 500, volume: 50 })}
                        className="w-full sm:w-auto text-xs px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        <Plus size={14} /> {t.mixAddItem}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {mixItems.map((item) => (
                      <div key={item.id} className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5 relative group">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={item.name}
                            placeholder="Service Name (e.g. Haircut)"
                            onChange={(e) => updateRow(setMixItems, mixItems, item.id, "name", e.target.value)}
                            className="w-full font-bold text-xs sm:text-sm bg-white p-2 sm:p-2.5 rounded-lg border border-amber-200 outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(setMixItems, mixItems, item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {/* 320px responsive grid: 1 col on ultra-narrow, 3 col on sm */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">{t.mixItemPrice}</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-[11px] text-slate-400 font-bold">{currency.trim()}</span>
                              <input
                                type="number"
                                value={item.price || ""}
                                onChange={(e) => updateRow(setMixItems, mixItems, item.id, "price", Number(e.target.value))}
                                className="w-full pl-8 pr-2 py-1.5 text-xs font-bold bg-white rounded-lg border border-amber-200 outline-none focus:ring-1 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">{t.mixItemCost}</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-[11px] text-slate-400 font-bold">{currency.trim()}</span>
                              <input
                                type="number"
                                value={item.cost || ""}
                                onChange={(e) => updateRow(setMixItems, mixItems, item.id, "cost", Number(e.target.value))}
                                className="w-full pl-8 pr-2 py-1.5 text-xs font-bold bg-white rounded-lg border border-amber-200 outline-none focus:ring-1 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">{t.mixItemVolume}</span>
                            <input
                              type="number"
                              value={item.volume || ""}
                              onChange={(e) => updateRow(setMixItems, mixItems, item.id, "volume", Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs font-extrabold bg-white rounded-lg border border-amber-200 outline-none focus:ring-1 focus:ring-amber-500 text-center sm:text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-100/70 rounded-xl text-xs font-extrabold text-amber-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border border-amber-200">
                    <span>Est. Monthly Turnover: <span className="font-mono text-amber-950 ml-1">{formatCurrency(totalExpectedRevenue)}</span></span>
                    <span>Avg Contribution Margin: <span className="font-mono text-amber-950 ml-1">{Math.round(mixCMRatio * 100)}%</span></span>
                  </div>
                </motion.div>
              )}

              {/* 3. Supermarket & Retail Margin Mode Inputs */}
              {businessModel === "retail-margin" && (
                <motion.div
                  key="model-retail"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="space-y-6 pt-4 border-t border-neutral-border/60"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm font-semibold text-neutral-text">{t.retailMarginLabel}</label>
                      <span className="text-lg sm:text-xl font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 shrink-0">{retailMarginPct}%</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-3">{t.retailMarginSub}</p>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={1}
                      value={retailMarginPct}
                      onChange={(e) => setRetailMarginPct(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1.5">
                      <span>5% (Bulk)</span>
                      <span>22% (Grocery / Supermarket)</span>
                      <span>60% (Specialty)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5">
                      <span className="text-sm font-semibold text-neutral-text block">{t.retailHoursLabel}</span>
                      <span className="text-xs font-medium text-slate-500">{t.retailHoursSub}</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 h-5 w-5 text-neutral-muted" />
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={retailDailyHours || ""}
                        onChange={(e) => setRetailDailyHours(Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode Info Banner */}
            <div className={`p-4 rounded-2xl flex items-start gap-3 font-medium text-xs leading-relaxed ${
              businessModel === "single"
                ? "bg-slate-100 border border-slate-200 text-slate-700"
                : businessModel === "multi-mix"
                ? "bg-amber-50 border border-amber-200 text-amber-950"
                : "bg-emerald-50 border border-emerald-200 text-emerald-950"
            }`}>
              <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                businessModel === "single" ? "text-primary" : businessModel === "multi-mix" ? "text-amber-600" : "text-emerald-600"
              }`} />
              <div>
                {businessModel === "single" && t.singleDesc}
                {businessModel === "multi-mix" && t.mixDesc}
                {businessModel === "retail-margin" && t.retailDesc}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Results Dashboard & Chart
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6" id="mobile-results-anchor">

          {/* Warning: Negative Contribution Margin */}
          {!isProfitableModel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-200 flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-sm">{t.warningTitle}</h3>
                <p className="mt-1 text-sm">{t.warningText}</p>
              </div>
            </motion.div>
          )}

          {/* Hero Result Cards (Responsive fluid fonts & overflow handling) */}
          {isProfitableModel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch"
            >
              {/* Card 1: Break-Even Units or Daily Register Turnover */}
              {businessModel !== "retail-margin" ? (
                <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-neutral-border shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all">
                  <div className="absolute -top-3 -right-3 p-4 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                    <Calculator size={96} />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-muted uppercase tracking-wider mb-2 text-xs">
                      {t.breakEvenUnitsTitle}
                    </p>
                    {/* Fluid break-words font so long unit counts fit 320px screens perfectly */}
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-text tracking-tight break-words sm:break-normal leading-tight">
                      {formatNumber(activeBreakEvenUnits)} <span className="text-sm font-bold text-slate-400">units</span>
                    </p>
                  </div>
                  <p className="text-neutral-muted mt-3 font-medium text-xs sm:text-sm">{t.breakEvenUnitsDesc}</p>
                </div>
              ) : (
                <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-neutral-border shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
                  <div className="absolute -top-3 -right-3 p-4 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                    <Store size={96} />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-700 uppercase tracking-wider mb-2 text-xs">
                      {t.dailyTargetTitle}
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-text tracking-tight break-words sm:break-normal leading-tight">
                      {formatCurrency(retailBreakEvenDaily)}
                    </p>
                  </div>
                  <p className="text-neutral-muted mt-3 font-medium text-xs sm:text-sm">{t.dailyTargetDesc}</p>
                </div>
              )}

              {/* Card 2: Break-Even Monthly Revenue (Fixed LKR right-edge clipping!) */}
              <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col justify-between group ${
                businessModel === "retail-margin" ? "bg-gradient-to-br from-emerald-600 to-teal-800" :
                businessModel === "multi-mix" ? "bg-gradient-to-br from-amber-600 to-orange-700" :
                "bg-gradient-to-br from-primary to-indigo-700"
              }`}>
                <div className="absolute -top-3 -right-3 p-4 opacity-[0.1] text-white group-hover:opacity-[0.15] transition-opacity pointer-events-none">
                  <TrendingUp size={96} />
                </div>
                <div>
                  <p className="font-bold text-white/80 uppercase tracking-wider mb-2 text-xs">
                    {t.breakEvenRevenueTitle}
                  </p>
                  {/* Fluid text-2xl sm:text-3xl lg:text-4xl + break-words guarantees 0 clipping on LKR 909,091 */}
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight break-words sm:break-normal leading-tight text-white">
                    {formatCurrency(activeBreakEvenRevenue)}
                  </p>
                </div>
                <p className="text-white/90 mt-3 font-medium text-xs sm:text-sm">{t.breakEvenRevenueDesc}</p>
              </div>
            </motion.div>
          )}

          {/* Secondary Stats Card (Contribution or Hourly Register Target) */}
          {isProfitableModel && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-neutral-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {businessModel !== "retail-margin" ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner shrink-0">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-muted uppercase tracking-wider text-xs">
                        {t.contributionMarginTitle} {businessModel === "multi-mix" && "(Avg Weighted)"}
                      </p>
                      <p className="text-neutral-muted font-medium text-xs">{t.contributionMarginDesc}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 flex sm:block items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 block">
                      {formatCurrency(businessModel === "single" ? singleContributionMargin : mixContributionMarginDollar)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 sm:block">
                      ({Math.round((businessModel === "single" ? singleContributionMargin / price : mixCMRatio) * 100)}% margin)
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shadow-inner shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-teal-900 uppercase tracking-wider text-xs">
                        {t.hourlyTargetTitle} ({retailDailyHours}h open/day)
                      </p>
                      <p className="text-slate-500 font-medium text-xs">{t.hourlyTargetDesc}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <span className="text-xl sm:text-2xl font-black text-teal-700 block break-words">
                      {formatCurrency(retailBreakEvenHourly)} <span className="text-xs font-normal text-slate-500">/ hr</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── REQUIRED MONTHLY SALES BREAKDOWN (Multi-Mix Table, 320px scrollable) ─── */}
          {isProfitableModel && businessModel === "multi-mix" && mixBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-lg p-4 sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-amber-100 pb-3">
                <Scissors className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{t.mixBreakdownTitle}</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                    {t.mixBreakdownSub.replace("{fixed}", formatCurrency(totalFixedCost))}
                  </p>
                </div>
              </div>

              {/* Responsive horizontal scroll wrapper for 320px displays */}
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-left border-collapse min-w-[440px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2 pr-3">{t.mixItemName}</th>
                      <th className="py-2 px-2 text-center">{t.mixItemShare}</th>
                      <th className="py-2 px-2 text-right">{t.mixRequiredDaily}</th>
                      <th className="py-2 pl-3 text-right text-amber-600 font-black">{t.mixRequiredUnits}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-bold text-slate-800">
                    {mixBreakdown.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="font-extrabold text-slate-900">{item.name}</div>
                          <div className="text-[11px] sm:text-xs font-medium text-slate-400">
                            {formatCurrency(item.price)} (Margin: {item.marginPct}%)
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] sm:text-xs font-black">
                            {item.revenueShare}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-600 text-xs sm:text-sm">
                          {item.requiredUnitsDaily} <span className="text-[10px] font-normal text-slate-400">/day</span>
                        </td>
                        <td className="py-3 pl-3 text-right font-black text-amber-600 text-sm sm:text-base">
                          {formatNumber(item.requiredUnitsMonthly)} <span className="text-xs font-normal">units</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Target Profit Banner */}
          {isProfitableModel && targetProfit > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start sm:items-center gap-3 shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 shrink-0 mt-0.5 sm:mt-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-emerald-900 text-xs sm:text-sm leading-snug">
                  {t.targetProfitBanner.replace("{profit}", formatCurrency(targetProfit))}
                </p>
                <p className="text-emerald-700 mt-1 text-xs font-medium leading-relaxed break-words">
                  {businessModel !== "retail-margin" ? (
                    t.targetProfitUnits
                      .replace("{revenue}", formatCurrency(activeTargetRevenue))
                      .replace("{units}", formatNumber(activeTargetUnits))
                  ) : (
                    t.targetProfitRetail
                      .replace("{revenue}", formatCurrency(retailTargetRevenue))
                      .replace("{daily}", formatCurrency(retailTargetDaily))
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── Interactive Break-Even Chart (Optimized for 320px to 4K) ─── */}
          {isProfitableModel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-neutral-border shadow-lg flex-grow min-h-[380px] sm:min-h-[420px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-bold text-neutral-text text-base sm:text-lg">{t.chartTitle}</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 shrink-0 border border-emerald-200/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex-grow w-full h-full min-h-[320px]">
                <BreakEvenChart
                  chartData={chartData}
                  businessModel={businessModel}
                  t={t}
                  activeBreakEvenRevenue={activeBreakEvenRevenue}
                  activeBreakEvenUnits={activeBreakEvenUnits}
                  chartCurrencyFormat={chartCurrencyFormat}
                  formatCurrency={formatCurrency}
                />
              </div>
            </motion.div>
          )}

          {/* Download PDF Button */}
          {isProfitableModel && (
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-4 sm:px-6 sm:py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-accent/40 hover:bg-accent-hover transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              <Download className="mr-2 h-5 w-5 shrink-0" />
              <span>{t.exportBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PLG (Product-Led Growth) ERP Upsell Hook
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-10 sm:mt-12 bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 border border-slate-800 relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/15 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="max-w-2xl space-y-2.5 sm:space-y-3 relative z-10 text-center md:text-left">
          <h3 className={`font-black text-white ${isIndic ? "text-base sm:text-xl" : "text-lg sm:text-2xl"}`}>{t.plgTitle}</h3>
          <p className={`text-slate-400 leading-relaxed ${isIndic ? "text-xs sm:text-sm font-medium" : "text-xs sm:text-sm"}`}>
            {t.plgText}
          </p>
        </div>
        <a
          href="/contact"
          className="shrink-0 bg-gradient-to-r from-accent to-orange-600 hover:from-accent-hover hover:to-orange-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-accent/30 w-full md:w-auto active:scale-95 relative z-10"
        >
          {t.plgCta} <ArrowRight size={18} />
        </a>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Quick Guide Section
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-10 sm:mt-12 rounded-2xl sm:rounded-3xl glass-panel p-5 sm:p-8 border border-white/80 shadow-xl bg-white/70 text-slate-800 space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
          <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
            {t.guideTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-1">
          <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">01</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.modelSingle}</strong>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px] sm:text-[11px] shrink-0">
                  Unit Basis
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-[13px] font-medium leading-relaxed">{t.guidePrice}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-amber-600 text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-amber-500/20">02</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.modelMix}</strong>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] sm:text-[11px] shrink-0">
                  Salons & Restaurants
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-[13px] font-medium leading-relaxed">{t.guideFixed}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">03</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.modelRetail}</strong>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] sm:text-[11px] shrink-0">
                  Supermarkets & Retail
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-[13px] font-medium leading-relaxed">{t.guideVariable}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">04</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">Fixed vs Variable Costs</strong>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] sm:text-[11px] shrink-0">
                  Accounting Tip
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-[13px] font-medium leading-relaxed">{t.guideTarget}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Sticky Mobile Floating Summary Bar (lg:hidden)
      ═══════════════════════════════════════════════════════════════════ */}
      {isProfitableModel && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-3 px-3 sm:px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] lg:hidden flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                {businessModel !== "retail-margin" ? t.breakEvenUnitsTitle : t.dailyTargetTitle}
              </span>
              {businessModel !== "retail-margin" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-400/20 text-indigo-300 shrink-0">
                  {formatNumber(activeBreakEvenUnits)} units
                </span>
              )}
            </div>
            <div className="text-lg sm:text-2xl font-black text-white tracking-tight truncate font-mono">
              {formatCurrency(businessModel !== "retail-margin" ? activeBreakEvenRevenue : retailBreakEvenDaily)}
              {businessModel === "retail-margin" && <span className="text-[11px] text-slate-400 font-normal"> / day</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const chartEl = document.getElementById("mobile-results-anchor");
              if (chartEl) chartEl.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-extrabold text-xs flex items-center gap-1 shadow-lg shadow-accent/30 shrink-0 transition-all active:scale-95"
          >
            <span>{t.mobileBreakdown}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Lead Capture Modal
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isLeadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-border text-neutral-text"
            >
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="absolute right-5 top-5 p-2 rounded-full text-neutral-muted hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-5 sm:space-y-6 text-center">
                <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-accent-light text-accent">
                  <Download className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-xl sm:text-2xl text-neutral-text">
                    {t.modalTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-muted font-medium">
                    {t.modalSub}
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>{t.successMsg}</span>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-muted">
                        {t.workEmail}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="owner@business.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:ring-2 focus:ring-accent focus:outline-none text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover transition-all"
                    >
                      <span>{t.sendReport}</span>
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </button>
                    <p className="text-xs text-center text-slate-600 font-medium">
                      {t.privacyText}
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
