"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
  Calculator, ArrowRight, Download, Share2, Sparkles, AlertCircle, 
  CheckCircle2, DollarSign, PieChart, Layers, HelpCircle, X, Globe
} from "lucide-react";
import { CURRENCIES } from "@/lib/invoice-schema";
import { generateAndDownloadToolPDF } from "@/lib/report-pdf";

// Multi-language translation dictionary (English, Sinhala & Tamil)
const TRANSLATIONS = {
  en: {
    badge: "FREE PRODUCT PRICING & MARGIN CALCULATOR",
    title: "Product MRP & Profit Margin Calculator",
    subtitle: "Avoid the #1 pricing mistake: confusing markup with margin. See your selling price and true profit update in real-time.",
    mode1: "1. Calculate Shelf Price (MRP)",
    mode2: "2. Calculate Profit from Fixed MRP",
    mode3: "3. Calculate Profit from Flat Commission",
    mode1Desc: "💡 Use Mode 1 when you know your manufacturing cost and want to calculate the exact retail price tag (MRP) to put on your box.",
    mode2Desc: "💡 Use Mode 2 when your retail price sticker (MRP) is already fixed by the market and you want to calculate your brand's actual net profit.",
    mode3Desc: "💡 Use Mode 3 when distributors or supermarket chains demand a fixed flat commission percentage taken directly out of the shelf MRP.",
    inputVars: "Pricing Details",
    realtimeActive: "Real-time active",
    costLabel: "Cost per Unit",
    costSub: "Total cost to manufacture or buy 1 unit",
    targetMrpLabel: "Target Selling Price - MRP",
    targetMrpSub: "Final price the customer pays in the store",
    brandMargin: "Your Brand Profit (%)",
    distributorCut: "Distributor Margin (%)",
    retailerCut: "Retailer Margin (%)",
    taxLabel: "Government Tax - VAT / GST (%)",
    taxSub: "Sales tax included in the final price",
    liveOutput: "Live Profit Summary",
    instant: "Instant",
    calcMrpTitle: "Final Retail Price (MRP)",
    trueProfitTitle: "Your Net Profit per Unit",
    trueNetMargin: "Your True Net Margin:",
    waterfallTitle: "Where the Money Goes",
    ptwTitle: "Your Wholesale Selling Price",
    landedCostTitle: "Cost to Make / Buy",
    netBrandProfitTitle: "Your Brand Net Profit",
    wholesalerCutTitle: "Distributor Commission",
    retailerCutTitle: "Retailer Commission",
    govTaxTitle: "Government Tax",
    exportBtn: "Download PDF Report",
    modalTitle: "Download Your Complete Pricing Report",
    modalSub: "Enter your email to receive this exact pricing breakdown as a ready-to-share PDF report.",
    successMsg: "Report sent to your inbox!",
    workEmail: "Your Email Address",
    sendReport: "Send PDF Report",
    privacyText: "We respect your privacy. No spam.",
    chartNames: {
      cost: "Unit Cost",
      profit: "Your Profit",
      distributor: "Distributor",
      retailer: "Retail Shop",
      tax: "Gov Tax"
    },
    rule1Title: "💡 Mode 1 Note: Forward Calculation",
    rule1Text: "You enter manufacturing cost and target profit margins. We automatically calculate forward step-by-step to tell you the exact shelf sticker price (MRP) you must print on the packaging so your business, distributors, and retailers all keep their required profits.",
    rule2Title: "💡 Mode 2 Note: Fixed Price Deduction",
    rule2Text: "When your shelf sticker price (MRP) is already fixed by market competition, we work backward. We take the final MRP, deduct government tax, retailer margin, and distributor commission to reveal the exact net cash profit left for your brand.",
    rule3Title: "💡 Mode 3 Note: Flat Commission %",
    rule3Text: (ptw: string, tax: string, margin: string, curr: string = "$") => `In FMCG and supermarket chains, shop commissions are deducted flat from the sticker price. Out of your shelf MRP, retailers and wholesalers take their % cuts directly. Your wholesale selling price is ${curr} ${ptw}, and after paying ${curr} ${tax} tax, your true brand net profit margin is ${margin}%.`,
    guideTitle: "💡 Quick Guide: What numbers should I enter?",
    costHint: "Include ingredients, packaging box, sticker, and direct labor required to make 1 single item.",
    targetMrpHint: "Enter the exact price sticker/tag printed on the box that the final retail shop customer pays.",
    brandHint: "How much net profit percentage your business wants to keep from each sale (usually 15% - 25%).",
    distHint: "Commission % demanded by the middleman/wholesaler who distributes to shops. Put 0 if direct.",
    retailHint: "Profit % kept by the supermarket or corner shop selling to the general public (usually 20% - 30%).",
    taxHint: "Government sales tax rate in your country (e.g. 18% GST or 15% VAT). Put 0 if exempt.",
    calcOnCost: "Base Cost",
    calcOnWholesale: "On Brand Billing Price",
    calcOnMrp: "On Shelf MRP",
    calcOnCustomer: "Customer Shelf Price",
    calcOnPtr: "On Distributor Selling Price",
    calcOnPreTax: "On Store Price (Pre-Tax)",
    calcOnFinalMrp: "On Final Shelf MRP"
  },
  si: {
    badge: "නොමිලේ ලබා දෙන නිෂ්පාදන මිල සහ ලාභ ගණකය",
    title: "නිෂ්පාදන MRP සහ ලාභ ප්‍රතිශත ගණකය",
    subtitle: "නිෂ්පාදන ව්‍යාපාරවල ප්‍රධානතම වැරදීම නිවැරදි කරගන්න: Markup සහ Margin අතර සත්‍ය වෙනස හඳුනාගන්න. දත්ත වෙනස් කරන විට මිල ගණන් සජීවීව වෙනස් වන ආකාරය බලන්න.",
    mode1: "1. විකුණුම් මිල (MRP) ගණනය",
    mode2: "2. ස්ථාවර MRP මිලෙන් ලාභය ගණනය",
    mode3: "3. ස්ථාවර කොමිස් ප්‍රතිශතයෙන් ලාභය ගණනය",
    mode1Desc: "💡 ඔබේ නිෂ්පාදන වියදම දන්නා විට, භාණ්ඩයේ පෙට්ටියේ මුද්‍රණය කළ යුතු නිවැරදි විකුණුම් මිල (MRP) සොයාගැනීමට මෙය භාවිතා කරන්න.",
    mode2Desc: "💡 විකුණුම් මිල (MRP) දැනටමත් වෙළඳපොළ විසින් ස්ථාවර කර ඇති විට, සියලු කොමිස් අඩු කළ පසු ඔබට ලැබෙන ශුද්ධ ලාභය ගණනය කිරීමට මෙය භාවිතා කරන්න.",
    mode3Desc: "💡 බෙදාහරින්නන් හෝ සුපිරි වෙළඳසැල් ජාල මුද්‍රිත විකුණුම් මිලෙන් (MRP) කෙළින්ම ස්ථාවර කොමිස් ප්‍රතිශතයක් (%) ඉල්ලන විට මෙය භාවිතා කරන්න.",
    inputVars: "මිල ගණන් පිළිබඳ විස්තර",
    realtimeActive: "සජීවී ක්‍රියාකාරී",
    costLabel: "ඒකකයක වියදම",
    costSub: "එක් ඒකකයක් නිපදවීමට යන මුළු වියදම",
    targetMrpLabel: "ඉලක්ක විකුණුම් මිල - MRP",
    targetMrpSub: "පාරිභෝගිකයා මිලදී ගන්නා අවසාන සිල්ලර මිල",
    brandMargin: "ඔබේ සන්නාමයේ ලාභය (%)",
    distributorCut: "බෙදාහරින්නාගේ ලාභය (%)",
    retailerCut: "සිල්ලර කඩයේ ලාභය (%)",
    taxLabel: "රජයේ VAT / GST බදු අනුපාතය (%)",
    taxSub: "විකුණුම් මිලට අදාළ වන බද්ද",
    liveOutput: "සජීවී මූල්‍ය සාරාංශය",
    instant: "ක්ෂණික",
    calcMrpTitle: "අවසාන සිල්ලර මිල (MRP)",
    trueProfitTitle: "ඒකකයකින් ලැබෙන සත්‍ය ශුද්ධ ලාභය",
    trueNetMargin: "ශුද්ධ ලාභ ප්‍රතිශතය:",
    waterfallTitle: "මිල සහ කොමිස් බෙදී යන ආකාරය",
    ptwTitle: "ඔබේ තොග විකුණුම් මිල",
    landedCostTitle: "නිෂ්පාදන වියදම",
    netBrandProfitTitle: "සන්නාමයේ ශුද්ධ ලාභය",
    wholesalerCutTitle: "බෙදාහරින්නාගේ කොමිසම",
    retailerCutTitle: "සිල්ලර කඩයේ කොමිසම",
    govTaxTitle: "රජයේ බදු",
    exportBtn: "PDF වාර්තාව බාගත කරන්න",
    modalTitle: "ඔබේ සම්පූර්ණ මිල වාර්තාව බාගත කරන්න",
    modalSub: "මෙම සවිස්තරාත්මක මිල වාර්තාව PDF එකක් ලෙස ලබා ගැනීමට ඔබේ ඊමේල් ලිපිනය ඇතුළත් කරන්න.",
    successMsg: "වාර්තාව ඔබේ ඊමේල් ගිණුමට යවන ලදී!",
    workEmail: "ඔබේ ඊමේල් ලිපිනය",
    sendReport: "PDF වාර්තාව ලබාගන්න",
    privacyText: "ඔබේ පෞද්ගලිකත්වය අපි සුරකිමු. අනවශ්‍ය ඊමේල් එවන්නේ නැත.",
    chartNames: {
      cost: "නිෂ්පාදන වියදම",
      profit: "සන්නාම ලාභය",
      distributor: "බෙදාහරින්නා",
      retailer: "සිල්ලර කඩය",
      tax: "VAT බදු"
    },
    rule1Title: "💡 ක්‍රමය 1 උපදෙස: ඉදිරි මිල ගණනය",
    rule1Text: "ඔබේ නිෂ්පාදන වියදම සහ අවශ්‍ය ලාභ ප්‍රතිශත මෙහි ඇතුළත් කරන්න. ඔබ, බෙදාහරින්නා සහ සිල්ලර කඩය යන සියලු දෙනාටම අවශ්‍ය ලාභය ලැබෙන පරිදි භාණ්ඩයේ මුද්‍රණය කළ යුතු නිශ්චිත සිල්ලර මිල (MRP) අපි පියවරෙන් පියවර ඉදිරියට ගණනය කර පෙන්වමු.",
    rule2Title: "💡 ක්‍රමය 2 උපදෙස: ස්ථාවර මිලෙන් ලාභය ගණනය",
    rule2Text: "වෙළඳපොළ තරඟකාරීත්වය අනුව ඔබේ සිල්ලර මිල (MRP) කලින්ම ස්ථාවර වී ඇති විට අපි ආපසු පියවර ගණනය කරමු. අවසාන MRP මිලෙන් රජයේ බදු, සිල්ලර කඩයේ සහ බෙදාහරින්නාගේ කොමිස් අඩු කර ඔබේ සන්නාමයට ඉතිරි වන සත්‍ය මුදල් ලාභය මෙහි පෙන්වයි.",
    rule3Title: "💡 ක්‍රමය 3 උපදෙස: සිල්ලර මිලෙන් සෘජු කොමිස්",
    rule3Text: (ptw: string, tax: string, margin: string, curr: string = "$") => `FMCG සහ සුපිරි වෙළඳසැල් ජාල තුළ කොමිස් මුදල් අඩු කරන්නේ අවසාන සිල්ලර මිලෙනි (Flat % from MRP). ඔබේ තොග බිල්පත් මිල ${curr} ${ptw} වන අතර, රජයේ බදු (${curr} ${tax}) ගෙවූ පසු ඔබේ සන්නාමයේ සත්‍ය ශුද්ධ ලාභ ප්‍රතිශතය ${margin}% වේ.`,
    guideTitle: "💡 කෙටි උපදෙස්: එක් එක් කොටසට ඇතුළත් කළ යුත්තේ කුමක්ද?",
    costHint: "අමුද්‍රව්‍ය, පෙට්ටිය, පැකේජිං සහ කුලී ඇතුළුව භාණ්ඩ 1ක් හදන්න යන මුළු වියදම මෙහි දමන්න.",
    targetMrpHint: "කඩෙන් බඩු ගන්නා අවසාන පාරිභෝගිකයා ගෙවන මුද්‍රිත සිල්ලර මිල (MRP) මෙහි දමන්න.",
    brandHint: "එක් විකිණීමකින් ඔබේ ව්‍යාපාරයට අවශ්‍ය ශුද්ධ ලාභ ප්‍රතිශතය (සාමාන්‍යයෙන් 15% - 25%).",
    distHint: "තොග බෙදාහරින්නාගේ කොමිස් ප්‍රතිශතය. ඔබ කෙළින්ම කඩවලට බඩු දෙනවා නම් මෙහි 0 දමන්න.",
    retailHint: "සිල්ලර කඩයේ හෝ සුපිරි වෙළඳසැලේ ලාභ ප්‍රතිශතය (සාමාන්‍යයෙන් 20% - 30%).",
    taxHint: "රජයේ බදු ප්‍රතිශතය (උදා: 15% VAT හෝ 18% GST). ඔබ බදු වලින් නිදහස් නම් 0 දමන්න.",
    calcOnCost: "මූලික වියදම",
    calcOnWholesale: "සන්නාම බිල්පත් මිල මත",
    calcOnMrp: "MRP මිල මත",
    calcOnCustomer: "පාරිභෝගික මිල",
    calcOnPtr: "බෙදාහරින්නාගේ විකුණුම් මිල මත",
    calcOnPreTax: "වෙළඳසැල් මිල මත (Pre-Tax)",
    calcOnFinalMrp: "අවසාන MRP මිල මත"
  },
  ta: {
    badge: "இலவச தயாரிப்பு விலை மற்றும் இலாப கணிப்பு முறைமை",
    title: "தயாரிப்பு MRP & இலாப சதவீத கணிப்பான்",
    subtitle: "தயாரிப்பு வர்த்தகங்களில் ஏற்படும் முக்கிய பிழையைத் தவிர்க்கவும்: Markup மற்றும் Margin இடையேயான உண்மையான வித்தியாசத்தை அறியவும். தரவுகளை மாற்றும்போது விலைகள் நேரலையில் மாறுவதைப் பாருங்கள்.",
    mode1: "1. விற்பனை விலை (MRP) கணிப்பு",
    mode2: "2. நிலையான MRP-ல் இலாப கணிப்பு",
    mode3: "3. நேரடி கமிஷன் முறையில் இலாப கணிப்பு",
    mode1Desc: "💡 உங்கள் உற்பத்தி செலவு தெரிந்திருந்தால், பெட்டியில் அச்சிட வேண்டிய சரியான சில்லறை விற்பனை விலை (MRP) எவ்வளவு எனக் கண்டறிய இதைப் பயன்படுத்தவும்.",
    mode2Desc: "💡 விற்பனை விலை (MRP) ஏற்கனவே சந்தையால் நிர்ணயிக்கப்பட்டிருந்தால், கமிஷன்கள் போக உங்கள் பிராண்டுக்குக் கிடைக்கும் உண்மையான இலாபத்தைக் கணிக்க இதைப் பயன்படுத்தவும்.",
    mode3Desc: "💡 விநியோகஸ்தர்கள் அல்லது பல்பொருள் அங்காடிகள் அச்சிடப்பட்ட MRP விலையிலிருந்து நேரடியாக குறிப்பிட்ட சதவீத கமிஷன் கேட்கும்போது இதைப் பயன்படுத்தவும்.",
    inputVars: "விலை விவரங்கள்",
    realtimeActive: "நேரலை கணிப்பு",
    costLabel: "ஒரு அலகின் செலவு",
    costSub: "ஒரு அலகை உருவாக்க ஆகும் மொத்த செலவு",
    targetMrpLabel: "இலக்கு விற்பனை விலை - MRP",
    targetMrpSub: "வாடிக்கையாளர் வாங்கும் இறுதி சில்லறை விலை",
    brandMargin: "உங்கள் பிராண்ட் இலாபம் (%)",
    distributorCut: "விநியோகஸ்தர் இலாபம் (%)",
    retailerCut: "சில்லறை கடை இலாபம் (%)",
    taxLabel: "அரசு VAT / GST வரி விகிதம் (%)",
    taxSub: "விற்பனை விலைக்குப் பொருந்தும் வரி",
    liveOutput: "நேரலை நிதி சுருக்கம்",
    instant: "உடனடி",
    calcMrpTitle: "இறுதி சில்லறை விலை (MRP)",
    trueProfitTitle: "ஒரு அலகில் கிடைக்கும் உண்மையான இலாபம்",
    trueNetMargin: "தேறிய இலாப சதவீதம்:",
    waterfallTitle: "விலை & கமிஷன் பகிர்வு",
    ptwTitle: "உங்கள் மொத்த விற்பனை விலை",
    landedCostTitle: "உற்பத்தி செலவு",
    netBrandProfitTitle: "பிராண்டின் தேறிய இலாபம்",
    wholesalerCutTitle: "விநியோகஸ்தர் கமிஷன்",
    retailerCutTitle: "சில்லறை கடை கமிஷன்",
    govTaxTitle: "அரசு வரி",
    exportBtn: "PDF அறிக்கையை பதிவிறக்க",
    modalTitle: "உங்கள் முழுமையான விலை அறிக்கையை பதிவிறக்கவும்",
    modalSub: "இந்த விரிவான விலை அறிக்கையை PDF ஆகப் பெற உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
    successMsg: "அறிக்கை உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது!",
    workEmail: "உங்கள் மின்னஞ்சல் முகவரி",
    sendReport: "PDF அறிக்கையைப் பெறுக",
    privacyText: "உங்கள் தனியுரிமையை மதிக்கிறோம். தேவையற்ற மின்னஞ்சல்கள் அனுப்பப்படாது.",
    chartNames: {
      cost: "உற்பத்தி செலவு",
      profit: "பிராண்ட் இலாபம்",
      distributor: "விநியோகஸ்தர்",
      retailer: "சில்லறை கடை",
      tax: "VAT வரி"
    },
    rule1Title: "💡 முறை 1 வழிகாட்டி: சில்லறை விலை கணிப்பு",
    rule1Text: "உங்கள் உற்பத்தி செலவு மற்றும் தேவையான இலாப சதவீதங்களை இங்கு உள்ளிடவும். உங்கள் பிராண்ட், விநியோகஸ்தர் மற்றும் சில்லறை கடை ஆகிய அனைவருக்கும் தேவையான இலாபம் கிடைக்கும் வகையில் அச்சிட வேண்டிய இறுதி சில்லறை விலையை (MRP) நாங்கள் படிப்படியாக கணக்கிட்டு காட்டுவோம்.",
    rule2Title: "💡 முறை 2 வழிகாட்டி: நிலையான விலையில் இலாப கணிப்பு",
    rule2Text: "சந்தை போட்டி காரணமாக உங்கள் இறுதி சில்லறை விலை (MRP) ஏற்கனவே நிர்ணயிக்கப்பட்டிருந்தால், நாங்கள் பின்னோக்கி கணக்கிடுவோம். இறுதி MRP விலையில் இருந்து அரசு வரி, சில்லறை கடை மற்றும் விநியோகஸ்தர் கமிஷன்களை கழித்து உங்கள் பிராண்டிற்கு கிடைக்கும் தேறிய இலாபத்தைக் காட்டுவோம்.",
    rule3Title: "💡 முறை 3 வழிகாட்டி: நேரடி கமிஷன் கணிப்பு",
    rule3Text: (ptw: string, tax: string, margin: string, curr: string = "$") => `FMCG மற்றும் பல்பொருள் அங்காடி வலைப்பின்னல்களில் கமிஷன்கள் இறுதி சில்லறை விலையில் இருந்தே நேரடியாக கழிக்கப்படுகின்றன. உங்கள் மொத்த பில்லிங் விலை ${curr} ${ptw} ஆகும். அரசு வரி (${curr} ${tax}) செலுத்திய பின் உங்கள் பிராண்டின் தேறிய இலாப சதவீதம் ${margin}% ஆகும்.`,
    guideTitle: "💡 வழிகாட்டி: எந்தெந்த மதிப்புகளை உள்ளிட வேண்டும்?",
    costHint: "மூலப்பொருட்கள், பெட்டி, பேக்கிங் மற்றும் கூலி உட்பட 1 பொருள் செய்ய ஆகும் மொத்த செலவு.",
    targetMrpHint: "கடையில் வாடிக்கையாளர் செலுத்தும் அச்சிடப்பட்ட இறுதி சில்லறை விலை (MRP).",
    brandHint: "ஒவ்வொரு விற்பனையிலும் உங்கள் வர்த்தகத்திற்குத் தேவையான தேறிய இலாப சதவீதம் (வழக்கமாக 15% - 25%).",
    distHint: "விநியோகஸ்தர் அல்லது இடைத்தரகர் கமிஷன் சதவீதம். நேரடியாக கடைகளுக்கு விற்றால் 0 போடவும்.",
    retailHint: "சில்லறை கடை அல்லது பல்பொருள் அங்காடி வைக்கும் இலாப சதவீதம் (வழக்கமாக 20% - 30%).",
    taxHint: "அரசு விற்பனை வரி சதவீதம் (எ.கா. 15% VAT அல்லது 18% GST). வரி இல்லையெனில் 0 போடவும்.",
    calcOnCost: "அடிப்படை செலவு",
    calcOnWholesale: "பிராண்ட் பில்லிங் விலையில்",
    calcOnMrp: "MRP விலையில்",
    calcOnCustomer: "வாடிக்கையாளர் விலை",
    calcOnPtr: "விநியோகஸ்தர் விற்பனை விலையில்",
    calcOnPreTax: "கடை விலையில் (Pre-Tax)",
    calcOnFinalMrp: "இறுதி MRP விலையில்"
  }
};

// Zod Schema for strict input validation
const calculatorSchema = z.object({
  cost: z.coerce.number().min(0.01, "Cost must be greater than 0"),
  brandMargin: z.coerce.number().min(0).max(99.9, "Margin cannot exceed 99.9%"),
  wholesalerMargin: z.coerce.number().min(0).max(99.9, "Margin cannot exceed 99.9%"),
  retailerMargin: z.coerce.number().min(0).max(99.9, "Margin cannot exceed 99.9%"),
  taxRate: z.coerce.number().min(0).max(100, "Tax cannot exceed 100%"),
  targetMrp: z.coerce.number().min(0.01, "Target MRP must be greater than 0"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export function MrpCalculatorClient() {
  const [lang, setLang] = useState<"en" | "si" | "ta">("en");
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const currObj = CURRENCIES.find((c) => c.code === currencyCode) || {
    symbol: "$",
    code: "USD",
    name: "USD - US Dollar ($)",
  };
  const currency = currObj.symbol;
  const [mode, setMode] = useState<"cost-plus" | "target-price" | "distributor-mrp">("cost-plus");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = TRANSLATIONS[lang];
  const isIndic = lang === "si" || lang === "ta";

  const {
    register,
    control,
    formState: { errors },
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      cost: 25,
      brandMargin: 20,
      wholesalerMargin: 10,
      retailerMargin: 25,
      taxRate: 15,
      targetMrp: 53.24,
    },
    mode: "onChange",
  });

  // Watch values reactively for real-time instant updates
  const values = useWatch({ control });

  const cost = Number(values.cost) || 0;
  const brandMargin = Number(values.brandMargin) / 100 || 0;
  const wholesalerMargin = Number(values.wholesalerMargin) / 100 || 0;
  const retailerMargin = Number(values.retailerMargin) / 100 || 0;
  const taxRate = Number(values.taxRate) / 100 || 0;
  const targetMrp = Number(values.targetMrp) || 0;

  // Mode 1 Math: Cost-Plus Forward Calculation
  const ptw1 = brandMargin < 1 ? cost / (1 - brandMargin) : 0;
  const brandProfit1 = ptw1 - cost;
  const ptr1 = wholesalerMargin < 1 ? ptw1 / (1 - wholesalerMargin) : 0;
  const wholesalerCut1 = ptr1 - ptw1;
  const baseRetail1 = retailerMargin < 1 ? ptr1 / (1 - retailerMargin) : 0;
  const retailerCut1 = baseRetail1 - ptr1;
  const taxAmount1 = baseRetail1 * taxRate;
  const finalMrp1 = baseRetail1 + taxAmount1;

  // Mode 2 Math: Target Price Backward Calculation
  const baseRetail2 = targetMrp / (1 + taxRate);
  const taxAmount2 = targetMrp - baseRetail2;
  const retailerCut2 = baseRetail2 * retailerMargin;
  const ptr2 = baseRetail2 - retailerCut2;
  const wholesalerCut2 = ptr2 * wholesalerMargin;
  const ptw2 = ptr2 - wholesalerCut2;
  const brandProfit2 = ptw2 - cost;
  const brandMargin2 = ptw2 > 0 ? (brandProfit2 / ptw2) * 100 : 0;

  // Mode 3 Math: Flat % on final MRP (Distributor Request) + VAT inclusion
  const retailerCut3 = targetMrp * retailerMargin;
  const wholesalerCut3 = targetMrp * wholesalerMargin;
  const ptw3 = targetMrp - retailerCut3 - wholesalerCut3;
  const taxAmount3 = targetMrp - (targetMrp / (1 + taxRate));
  const brandProfit3 = ptw3 - taxAmount3 - cost;
  const brandMargin3 = ptw3 > 0 ? (brandProfit3 / ptw3) * 100 : 0;

  // Select active outputs
  const activeMrp = mode === "cost-plus" ? finalMrp1 : targetMrp;
  const activeBrandProfit = 
    mode === "cost-plus" ? brandProfit1 : mode === "target-price" ? brandProfit2 : brandProfit3;
  const activeBrandMargin = 
    mode === "cost-plus" ? brandMargin * 100 : mode === "target-price" ? brandMargin2 : brandMargin3;
  const activeWholesalerCut = 
    mode === "cost-plus" ? wholesalerCut1 : mode === "target-price" ? wholesalerCut2 : wholesalerCut3;
  const activeRetailerCut = 
    mode === "cost-plus" ? retailerCut1 : mode === "target-price" ? retailerCut2 : retailerCut3;
  const activeTaxAmount = 
    mode === "cost-plus" ? taxAmount1 : mode === "target-price" ? taxAmount2 : taxAmount3;
  const activePtw = 
    mode === "cost-plus" ? ptw1 : mode === "target-price" ? ptw2 : ptw3;

  // Chart Waterfall Breakdown Data
  const chartData = [
    { name: t.chartNames.cost, amount: cost, color: "#64748B" },
    { name: t.chartNames.profit, amount: Math.max(0, activeBrandProfit), color: "#4F46E5" },
    { name: t.chartNames.distributor, amount: Math.max(0, activeWholesalerCut), color: "#06B6D4" },
    { name: t.chartNames.retailer, amount: Math.max(0, activeRetailerCut), color: "#10B981" },
    ...(activeTaxAmount > 0 ? [{ name: t.chartNames.tax, amount: activeTaxAmount, color: "#F59E0B" }] : []),
  ];

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;

    const formatCurr = (val: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(val);

    const summaryRows = [
      {
        label: "Pricing Mode",
        value:
          mode === "cost-plus"
            ? "Cost-Plus Pricing (Target Brand Margin)"
            : mode === "target-price"
            ? "Reverse-Engineer Shelf MRP"
            : "Distributor Requested Margin Mode",
      },
      { label: "Production / Landed Unit Cost", value: formatCurr(cost) },
      { label: "Recommended / Target Shelf MRP", value: formatCurr(activeMrp) },
      { label: "Net Brand Profit per Unit", value: formatCurr(activeBrandProfit) },
      { label: "Brand Net Profit Margin %", value: `${activeBrandMargin.toFixed(1)}%` },
      {
        label: "Wholesaler / Distributor Cut",
        value: `${formatCurr(activeWholesalerCut)} (${(wholesalerMargin * 100).toFixed(1)}%)`,
      },
      {
        label: "Retailer / Store Margin Cut",
        value: `${formatCurr(activeRetailerCut)} (${(retailerMargin * 100).toFixed(1)}%)`,
      },
      ...(activeTaxAmount > 0
        ? [{ label: "Tax / VAT Amount Included", value: `${formatCurr(activeTaxAmount)} (${taxRate}%)` }]
        : []),
      { label: "Price to Wholesaler (PTW)", value: formatCurr(activePtw) },
    ];

    // 1. Immediately trigger instant vector PDF download
    try {
      generateAndDownloadToolPDF({
        toolName: "Reverse MRP & Margin Calculator",
        title: "Product Pricing & Margin Intelligence Report",
        summaryRows,
        fileName: `Zynveo_MRP_Margin_Report_${new Date().toISOString().split("T")[0]}.pdf`,
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
          toolName: "Reverse MRP & Margin Calculator",
          reportTitle: "Your Product Pricing & Margin Intelligence Report",
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

  return (
    <div className="container mx-auto px-3 py-8 pb-28 lg:pb-8 sm:px-6 lg:px-8 max-w-6xl relative">
      {/* Sleek SaaS Utility Header & Language Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 pb-6 border-b border-neutral-border/60 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-accent flex items-center justify-center text-white shadow-lg shadow-primary/25">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-neutral-text tracking-tight text-lg sm:text-xl block leading-tight">Zynveo</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent block">Pricing Intelligence</span>
          </div>
        </div>

        {/* Compact Glassmorphism Flag Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-border/30 p-1.5 rounded-2xl border border-neutral-border/80 backdrop-blur-md shadow-sm w-full sm:w-auto justify-center">
          <span className="text-[11px] font-extrabold text-neutral-muted px-2.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">Region</span>
          </span>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-inner border border-black/5">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${
                lang === "en"
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                  : "text-neutral-muted hover:text-neutral-text hover:bg-slate-100/80"
              }`}
            >
              <img src="https://flagcdn.com/w40/gb.png" alt="" className="h-3.5 w-5 object-cover rounded-[2px] shadow-sm shrink-0" />
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => setLang("si")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-extrabold transition-all duration-200 flex items-center gap-2 ${
                lang === "si"
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                  : "text-neutral-muted hover:text-neutral-text hover:bg-slate-100/80"
              }`}
            >
              <img src="https://flagcdn.com/w40/lk.png" alt="" className="h-3.5 w-5 object-cover rounded-[2px] shadow-sm shrink-0" />
              <span>සිංහල</span>
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-extrabold transition-all duration-200 flex items-center gap-2 ${
                lang === "ta"
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                  : "text-neutral-muted hover:text-neutral-text hover:bg-slate-100/80"
              }`}
            >
              <img src="https://flagcdn.com/w40/in.png" alt="" className="h-3.5 w-5 object-cover rounded-[2px] shadow-sm shrink-0" />
              <span>தமிழ்</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="text-center space-y-4 mb-10 sm:mb-12 px-2">
        <div className="inline-flex max-w-full items-center justify-center gap-2 px-4 py-1.5 rounded-2xl bg-accent/15 text-accent text-xs font-extrabold uppercase tracking-widest animate-bounce text-center leading-normal">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{t.badge}</span>
        </div>
        <h1 className={`font-extrabold tracking-tight text-neutral-text ${isIndic ? "text-xl sm:text-3xl lg:text-[42px] leading-snug" : "text-3xl sm:text-5xl"}`}>
          {t.title}
        </h1>
        <p className={`max-w-2xl mx-auto leading-relaxed text-neutral-muted font-medium ${isIndic ? "text-sm sm:text-base lg:text-lg max-w-3xl" : "text-base sm:text-lg"}`}>
          {t.subtitle}
        </p>
      </div>

      {/* Mode Toggle Bar */}
      <div className="flex justify-center mb-8 px-2 sm:px-0">
        <div className="bg-neutral-border/60 p-1.5 sm:p-2 rounded-2xl flex flex-col lg:flex-row justify-center gap-2 shadow-inner w-full lg:w-auto max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => setMode("cost-plus")}
            className={`w-full lg:w-auto px-4 sm:px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center text-center gap-2.5 font-bold ${isIndic ? "text-xs sm:text-sm tracking-tight" : "text-xs sm:text-sm"} ${
              mode === "cost-plus"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-neutral-muted hover:text-neutral-text"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>{t.mode1}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("target-price")}
            className={`w-full lg:w-auto px-4 sm:px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center text-center gap-2.5 font-bold ${isIndic ? "text-xs sm:text-sm tracking-tight" : "text-xs sm:text-sm"} ${
              mode === "target-price"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-neutral-muted hover:text-neutral-text"
            }`}
          >
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>{t.mode2}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("distributor-mrp")}
            className={`w-full lg:w-auto px-4 sm:px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center text-center gap-2.5 font-bold ${isIndic ? "text-xs sm:text-sm tracking-tight" : "text-xs sm:text-sm"} ${
              mode === "distributor-mrp"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-neutral-muted hover:text-neutral-text"
            }`}
          >
            <PieChart className="h-4 w-4 shrink-0 text-accent" />
            <span>{t.mode3}</span>
          </button>
        </div>
      </div>

      {/* Interactive Mode Concierge Helper Banner */}
      <motion.div 
        key={mode}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mb-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-50 to-purple-50 border border-primary/20 shadow-sm flex items-start gap-3.5"
      >
        <div className="p-2 rounded-xl bg-primary text-white shrink-0 shadow-md shadow-primary/20 mt-0.5">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary block mb-1">Mode Guide</span>
          <p className={`font-semibold text-slate-800 leading-relaxed ${isIndic ? "text-xs sm:text-sm lg:text-[15px]" : "text-sm sm:text-[15px]"}`}>
            {mode === "cost-plus" ? (t as any).mode1Desc : mode === "target-price" ? (t as any).mode2Desc : (t as any).mode3Desc}
          </p>
        </div>
      </motion.div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Panel (7 Cols) */}
        <motion.div 
          layout 
          className="lg:col-span-7 rounded-3xl glass-panel p-4 sm:p-8 shadow-xl border border-white/80 space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-border pb-4 gap-3">
            <h2 className="font-bold text-neutral-text flex items-center gap-2 text-xl">
              <Calculator className="h-5 w-5 text-primary shrink-0" />
              <span>{t.inputVars}</span>
            </h2>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              {t.realtimeActive}
            </span>
          </div>

          <form className="space-y-5 pt-1">
            {/* Currency Selector matching Invoice/Payslip generator UI */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-muted uppercase mb-1.5 tracking-wider">
                {lang === "si" ? "මුදල් වර්ගය (CURRENCY)" : lang === "ta" ? "நாணயம் (CURRENCY)" : "CURRENCY"}
              </label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full text-sm sm:text-[15px] p-3.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer shadow-2xs"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Common Field: Production Cost */}
            <div>
              <label className="block mb-1.5 flex flex-wrap justify-between items-center gap-1">
                <span className="text-sm font-semibold text-neutral-text">
                  {t.costLabel} ({currency.trim()})
                </span>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500">
                  {t.costSub}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-neutral-muted font-bold">{currency.trim()}</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("cost")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
              {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost.message}</p>}
            </div>

            {/* Mode 2 & 3 Specific: Target MRP */}
            <AnimatePresence mode="popLayout">
              {mode !== "cost-plus" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100"
                >
                  <label className="block mb-1.5 flex flex-wrap justify-between items-center gap-1">
                    <span className="text-sm font-bold text-primary">
                      {t.targetMrpLabel} ({currency.trim()})
                    </span>
                    <span className="text-xs sm:text-[13px] font-semibold text-primary/80">
                      {t.targetMrpSub}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-primary font-bold">{currency.trim()}</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("targetMrp")}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-primary/30 font-bold text-primary focus:ring-2 focus:ring-primary focus:outline-none shadow-sm"
                    />
                  </div>
                  {errors.targetMrp && <p className="text-xs text-red-500 mt-1">{errors.targetMrp.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Margins Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Brand Target Margin (Mode 1 only) */}
              <AnimatePresence mode="popLayout">
                {mode === "cost-plus" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                      {t.brandMargin}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        {...register("brandMargin")}
                        className="w-full pr-8 pl-3 py-2.5 rounded-xl bg-primary-light border border-primary/30 font-bold text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-primary font-bold">%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wholesaler Margin */}
              <div>
                <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-muted">
                  {t.distributorCut}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    {...register("wholesalerMargin")}
                    className="w-full pr-8 pl-3 py-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-neutral-muted font-bold">%</span>
                </div>
              </div>

              {/* Retailer Margin */}
              <div>
                <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-muted">
                  {t.retailerCut}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    {...register("retailerMargin")}
                    className="w-full pr-8 pl-3 py-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-neutral-muted font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Tax / VAT (Active across all modes) */}
            <div className="pt-2">
              <label className="block mb-1.5 flex flex-wrap justify-between items-center gap-1">
                <span className="text-sm font-semibold text-neutral-text">
                  {t.taxLabel}
                </span>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500">
                  {t.taxSub}
                </span>
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.1"
                  {...register("taxRate")}
                  className="w-full pr-8 pl-4 py-2.5 rounded-xl bg-neutral-bg border border-neutral-border font-bold text-neutral-text focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="absolute right-4 top-2.5 text-neutral-muted font-bold">%</span>
              </div>
            </div>
          </form>

          {/* Math Explainer Banner */}
          {mode === "cost-plus" ? (
            <div className={`p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3 font-medium text-slate-700 ${isIndic ? "text-[11px] sm:text-xs leading-normal" : "text-xs leading-relaxed"}`}>
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-text font-extrabold mr-1">{t.rule1Title}</strong>
                {t.rule1Text}
              </div>
            </div>
          ) : mode === "target-price" ? (
            <div className={`p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 font-medium text-indigo-950 ${isIndic ? "text-[11px] sm:text-xs leading-normal" : "text-xs leading-relaxed"}`}>
              <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-900 font-extrabold mr-1">{(t as any).rule2Title}</strong>
                {(t as any).rule2Text}
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-start gap-3 font-medium text-cyan-950 ${isIndic ? "text-[11px] sm:text-xs leading-normal" : "text-xs leading-relaxed"}`}>
              <AlertCircle className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-900 font-extrabold mr-1">{t.rule3Title}</strong>
                {t.rule3Text(activePtw.toFixed(2), activeTaxAmount.toFixed(2), activeBrandMargin.toFixed(1), currency)}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Outputs & Waterfall Chart (5 Cols) */}
        <motion.div 
          layout 
          id="mobile-results-anchor"
          className="lg:col-span-5 rounded-3xl bg-primary text-white p-4 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="uppercase font-extrabold tracking-widest text-indigo-100 text-xs">
              {t.liveOutput}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-accent text-[11px] font-extrabold text-white uppercase shrink-0">
              {t.instant}
            </span>
          </div>

          {/* Hero Output Metric */}
          <div className="space-y-1">
            <div className="text-indigo-100 text-sm font-semibold">
              {mode === "cost-plus" ? t.calcMrpTitle : t.trueProfitTitle}
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              {currency.trim()} {mode === "cost-plus" ? activeMrp.toFixed(2) : activeBrandProfit.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 pt-1 text-xs text-indigo-200 font-medium">
              <span>{t.trueNetMargin}</span>
              <strong className={`font-extrabold ${activeBrandMargin < 10 ? "text-amber-300" : "text-emerald-400"}`}>
                {activeBrandMargin.toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Visual Waterfall Stacked Chart */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center font-bold text-indigo-100 text-xs uppercase tracking-wider">
              <span>{t.waterfallTitle}</span>
              <PieChart className="h-4 w-4 text-accent shrink-0" />
            </div>

            <div className="h-40 w-full bg-primary-dark/50 rounded-2xl p-4 border border-white/10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={lang === "ta" ? 125 : lang === "si" ? 115 : 85} tick={{ fill: "#E2E8F0", fontSize: lang === "ta" ? 11 : lang === "si" ? 12 : 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(val: number) => [`${currency.trim()} ${val.toFixed(2)}`, lang === "si" ? "මුදල" : lang === "ta" ? "தொகை" : "Amount"]}
                    contentStyle={{ background: "#1E293B", border: "1px solid #475569", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)", padding: "10px 14px" }}
                    labelStyle={{ color: "#F8FAFC", fontWeight: 800, fontSize: "13px", marginBottom: "4px" }}
                    itemStyle={{ color: "#38BDF8", fontWeight: 700, fontSize: "13px" }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Numeric Summary Breakdown (Self-Balancing 2-Tier Commercial Layout) */}
          <div className="space-y-3 text-indigo-100 border-t border-white/10 pt-5 text-xs font-semibold">
            {/* Tier 1: Brand Manufacturing & Billing */}
            <div className="flex justify-between items-baseline gap-3">
              <span className="truncate pr-1">{t.landedCostTitle}</span>
              <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-3 text-emerald-300 font-extrabold">
              <span className="truncate pr-1">{t.netBrandProfitTitle}</span>
              <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {activeBrandProfit.toFixed(2)}</span>
            </div>
            {activeTaxAmount > 0 && (
              <div className="flex justify-between items-baseline gap-3 text-amber-300 font-bold">
                <span className="truncate pr-1">{t.govTaxTitle} ({taxRate * 100}%)</span>
                <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {activeTaxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline gap-3 border-t border-b border-white/10 py-2 my-1 font-bold text-white text-sm bg-white/5 px-2 rounded-lg">
              <span className="truncate pr-1">{t.ptwTitle}</span>
              <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {activePtw.toFixed(2)}</span>
            </div>

            {/* Tier 2: Channel Margins & Final Shelf Price */}
            <div className="flex justify-between items-baseline gap-3 text-cyan-300 pt-1 px-1">
              <span className="truncate pr-1">{t.wholesalerCutTitle}</span>
              <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {activeWholesalerCut.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-3 text-emerald-400 px-1">
              <span className="truncate pr-1">{t.retailerCutTitle}</span>
              <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {activeRetailerCut.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-3 border-t border-white/20 pt-2.5 font-extrabold text-white text-base">
              <span className="truncate pr-1">{t.calcMrpTitle}</span>
              <span className="font-mono font-extrabold shrink-0 text-right">{currency.trim()} {activeMrp.toFixed(2)}</span>
            </div>
          </div>

          {/* 10% Accent CTA Button (Option A: Lead Capture Export) */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="w-full inline-flex items-center justify-center rounded-xl bg-accent px-4 py-3.5 sm:px-6 sm:py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-accent/40 hover:bg-accent-hover transition-all duration-200 active:scale-95 whitespace-nowrap"
            >
              <Download className="mr-2 h-5 w-5 shrink-0" />
              <span>{t.exportBtn}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Separate Explainer Guide Section Below */}
      <div className="mt-12 rounded-3xl glass-panel p-6 sm:p-8 border border-white/80 shadow-xl bg-white/70 text-slate-800 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
          <HelpCircle className="h-6 w-6 text-primary shrink-0" />
          <h3 className="font-extrabold text-slate-900 text-xl">
            {(t as any).guideTitle || "Quick Guide: What numbers should I enter?"}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">01</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.costLabel}</strong>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[11px] shrink-0">
                  {(t as any).calcOnCost}
                </span>
              </div>
              <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed ${isIndic ? "font-bold" : "font-medium"}`}>{(t as any).costHint}</p>
            </div>
          </div>

          {mode !== "cost-plus" && (
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
              <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">02</span>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <strong className="text-sm font-bold text-slate-900">{t.targetMrpLabel}</strong>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0">
                    {(t as any).calcOnCustomer}
                  </span>
                </div>
                <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed ${isIndic ? "font-bold" : "font-medium"}`}>{(t as any).targetMrpHint}</p>
              </div>
            </div>
          )}

          {mode === "cost-plus" && (
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
              <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">02</span>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <strong className="text-sm font-bold text-slate-900">{t.brandMargin}</strong>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0">
                    {(t as any).calcOnWholesale}
                  </span>
                </div>
                <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed ${isIndic ? "font-bold" : "font-medium"}`}>{(t as any).brandHint}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">03</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.distributorCut}</strong>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[11px] shrink-0">
                  {mode === "distributor-mrp" ? (t as any).calcOnFinalMrp : (t as any).calcOnPtr}
                </span>
              </div>
              <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed ${isIndic ? "font-bold" : "font-medium"}`}>{(t as any).distHint}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm">
            <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">04</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.retailerCut}</strong>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] shrink-0">
                  {mode === "distributor-mrp" ? (t as any).calcOnFinalMrp : (t as any).calcOnPreTax}
                </span>
              </div>
              <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed ${isIndic ? "font-bold" : "font-medium"}`}>{(t as any).retailHint}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 shadow-sm md:col-span-2">
            <span className="p-2 rounded-xl bg-primary text-white font-extrabold text-xs shrink-0 mt-0.5 shadow-md shadow-primary/20">05</span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <strong className="text-sm font-bold text-slate-900">{t.taxLabel}</strong>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px] shrink-0">
                  {(t as any).calcOnPreTax}
                </span>
              </div>
              <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed ${isIndic ? "font-bold" : "font-medium"}`}>{(t as any).taxHint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Floating Financial Summary Bar (lg:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-3.5 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] lg:hidden flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
              {mode === "cost-plus" ? t.calcMrpTitle : t.trueProfitTitle}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${activeBrandMargin < 10 ? "bg-amber-400/20 text-amber-300" : "bg-emerald-400/20 text-emerald-300"}`}>
              {activeBrandMargin.toFixed(1)}% {t.trueNetMargin.replace(":", "")}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate font-mono">
            {currency.trim()} {mode === "cost-plus" ? activeMrp.toFixed(2) : activeBrandProfit.toFixed(2)}
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => {
            const chartEl = document.getElementById("mobile-results-anchor");
            if (chartEl) chartEl.scrollIntoView({ behavior: "smooth" });
          }}
          className="px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-accent/30 shrink-0 transition-all active:scale-95"
        >
          <span>{lang === "si" ? "විස්තර" : lang === "ta" ? "விவரங்கள்" : "Breakdown"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Lead Capture Dialog Modal (Option A) */}
      <AnimatePresence>
        {isLeadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-neutral-border text-neutral-text"
            >
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="absolute right-6 top-6 p-2 rounded-full text-neutral-muted hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light text-accent">
                  <Download className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                  <h3 className={`font-bold text-neutral-text ${isIndic ? "text-xl sm:text-2xl leading-snug" : "text-2xl"}`}>
                    {t.modalTitle}
                  </h3>
                  <p className={`text-sm ${isIndic ? "text-slate-700 font-medium" : "text-neutral-muted"}`}>
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
                      <label className={`block mb-1.5 ${isIndic ? "text-[13px] font-bold text-slate-800 normal-case tracking-normal" : "text-xs font-bold uppercase tracking-wider text-neutral-muted"}`}>
                        {t.workEmail}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="founder@brand.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-bg border border-neutral-border font-medium text-neutral-text focus:ring-2 focus:ring-accent focus:outline-none"
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

function smOrBase(lang: string) {
  return lang !== "en" ? "13px" : "11px";
}
