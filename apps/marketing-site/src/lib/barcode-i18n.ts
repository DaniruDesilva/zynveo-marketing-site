export type BarcodeLang = "en" | "si" | "ta";

export interface FormatInfo {
  id: string;
  name: string;
  desc: string;
  sample: string;
}

export const BARCODE_DICT = {
  en: {
    badge: "GS1 Certified Standards • Supermarket POS Ready • Thermal Print 4x",
    title: "Global Barcode, SKU & QR Generator",
    subtitle:
      "Create high-precision retail checkout barcodes, warehouse inventory tags, shipping carton labels, and GS1 Digital Link QR codes instantly.",
    productDetails: "1. Code & Inventory Data",
    customizationTitle: "2. Sticker & Printer Settings",
    realtimeActive: "Live preview",
    productNameLabel: "Product Name / Label",
    productNamePlace: "e.g., Organic Aloe Vera Shampoo",
    categoryLabel: "Category",
    categoryPlace: "e.g., Hair Care",
    sizeLabel: "Variant / Size",
    sizePlace: "e.g., 250ml",
    generatedSkuLabel: "Alphanumeric SKU Code",
    manualEditHint: "Custom code for Code 128 / 39",
    gtinLabel: "GTIN / Barcode Number",
    gtinHint: "Standard numeric digits required for retail checkouts",
    batchLabel: "Batch / Lot Number",
    digitalLinkLabel: "Digital Link Target URL",

    barHeightLabel: "Label Height",
    barWidthLabel: "Bar Thickness / Density",
    showTextLabel: "Show Human-Readable Numbers",
    colorThemeLabel: "Ink Color Theme",

    colors: {
      black: "Obsidian Black",
      navy: "Deep Navy",
      indigo: "Royal Indigo",
      emerald: "Forest Emerald",
    },

    categories: {
      retail: "Retail Checkout (1D)",
      internal: "Warehouse SKUs (1D)",
      logistics: "Shipping Cartons (1D)",
      matrix: "2D & Digital Link",
    },

    formats: {
      EAN13: {
        name: "EAN-13 (International Retail)",
        desc: "The mandatory checkout barcode required by supermarkets and retailers worldwide (Europe, Asia, South America, Oceania). Encoding 13 digits.",
      },
      UPCA: {
        name: "UPC-A (North America Retail)",
        desc: "The standard retail checkout barcode required across all stores in the United States and Canada. Encoding 12 digits.",
      },
      EAN8: {
        name: "EAN-8 / UPC-E (Compact Items)",
        desc: "Compressed short barcodes designed specifically for tiny retail packaging like cosmetics, lip balm, chewing gum, and candy packs.",
      },
      CODE128: {
        name: "Code 128 (Industry Standard)",
        desc: "High-density alphanumeric barcode supporting all ASCII characters. The #1 global standard for internal inventory, warehouse bins, and SKUs.",
      },
      CODE39: {
        name: "Code 39 (Automotive & Gov)",
        desc: "Older highly compatible alphanumeric standard widely used in automotive, defense tracking, healthcare, and government sector logistics.",
      },
      GS1_128: {
        name: "GS1-128 (Shipping Pallets)",
        desc: "Used globally on shipping containers and pallets to encode structured Application Identifiers (GTIN, batch number, expiration date).",
      },
      ITF14: {
        name: "ITF-14 (Corrugated Cartons)",
        desc: "Interleaved 2 of 5 barcode designed with thick black bearer bars specifically to print directly on rough corrugated cardboard master cartons.",
      },
      QR: {
        name: "Standard QR Code",
        desc: "The global 2D standard for quick smartphone scanning, product manuals, marketing campaigns, and serial number asset tracking.",
      },
      GS1_DIGITAL_LINK: {
        name: "GS1 Digital Link (Smart QR)",
        desc: "Revolutionary format: scans instantly at retail checkout counters like a regular barcode while linking consumers to a web URL on mobile.",
      },
      DATA_MATRIX: {
        name: "Data Matrix (Industrial 2D)",
        desc: "Ultra high-density 2D matrix preferred for tracking tiny electronic components, PCBs, surgical instruments, and pharmaceutical vials.",
      },
    },

    previewTitle: "Live Printable Sticker Preview",
    previewSub: "Thermal & Laser Printer Optimized (300+ DPI)",
    downloadBtn: "Download High-Res PNG",
    printBtn: "Quick Print Label",
    upsellTitle: "Automate checkout & inventory across all your stores",
    upsellDesc:
      "Printing labels is just step one. Stop counting stock by hand. Synctra Smart POS scans these exact barcodes at checkout and deducts stock across warehouses in real time.",
    joinWaitlistBtn: "Try Synctra Free",
  },
  si: {
    badge: "GS1 ජාත්‍යන්තර ප්‍රමිතීන් • POS මැෂින් සඳහා • 4x ඉහළ ගුණාත්මකභාවය",
    title: "ජාත්‍යන්තර බාර්කෝඩ්, SKU සහ QR ගණකය",
    subtitle:
      "සුපිරි වෙළඳසැල් බාර්කෝඩ්, ගබඩා SKU කේත, ප්‍රවාහන කාටන් ලේබල් සහ නවීන GS1 Digital Link QR කේත ක්ෂණිකව නිර්මාණය කරගන්න.",
    productDetails: "1. කේත හා තොරතුරු",
    customizationTitle: "2. මුද්‍රණ සැකසුම්",
    realtimeActive: "සජීවී සැකසුම",
    productNameLabel: "නිෂ්පාදනයේ නම",
    productNamePlace: "උදා: කෝමාරිකා ෂැම්පු",
    categoryLabel: "වර්ගය",
    categoryPlace: "උදා: කෙස් සත්කාර",
    sizeLabel: "ප්‍රමාණය / බර",
    sizePlace: "උදා: 250ml",
    generatedSkuLabel: "අක්ෂර හා අංක SKU කේතය",
    manualEditHint: "Code 128 / 39 සඳහා",
    gtinLabel: "GTIN / බාර්කෝඩ් අංකය",
    gtinHint: "සිල්ලර කඩවල ස්කෑන් කිරීමට අවශ්‍ය ප්‍රමිතිගත අංක",
    batchLabel: "කාණ්ඩ අංකය (Batch / Lot)",
    digitalLinkLabel: "Digital Link වෙබ් අඩවි ලිපිනය",

    barHeightLabel: "බාර්කෝඩ් උස (Height)",
    barWidthLabel: "තීරුවල ඝනකම (Density)",
    showTextLabel: "කේත අංක ප්‍රදර්ශනය කරන්න",
    colorThemeLabel: "තීන්ත වර්ණය",

    colors: {
      black: "කළු (Black)",
      navy: "තද නිල් (Deep Navy)",
      indigo: "ඉන්ඩිගෝ (Royal Indigo)",
      emerald: "කොළ (Forest Emerald)",
    },

    categories: {
      retail: "සිල්ලර අලෙවි (1D)",
      internal: "ගබඩා SKUs (1D)",
      logistics: "ප්‍රවාහන කාටන් (1D)",
      matrix: "2D හා Digital Link",
    },

    formats: {
      EAN13: {
        name: "EAN-13 (ජාත්‍යන්තර සිල්ලර ප්‍රමිතිය)",
        desc: "ලොව පුරා සුපිරි වෙළඳසැල්වල බිල්පත් කිරීම සඳහා අනිවාර්ය වන ප්‍රධානතම බාර්කෝඩ් වර්ගයයි. අංක 13ක් අඩංගු වේ.",
      },
      UPCA: {
        name: "UPC-A (ඇමරිකානු සිල්ලර ප්‍රමිතිය)",
        desc: "එක්සත් ජනපදයේ සහ කැනඩාවේ වෙළඳසැල්වල බිල්පත් කිරීම සඳහා භාවිතා වන ප්‍රමිතියයි. අංක 12ක් අඩංගු වේ.",
      },
      EAN8: {
        name: "EAN-8 / UPC-E (කුඩා ඇසුරුම් සඳහා)",
        desc: "චුයින්ගම්, ටොෆි හෝ කුඩා විලවුන් පැකට් වැනි ඉතා කුඩා ඇසුරුම්වල මුද්‍රණය කිරීමට සකසන ලද කෙටි බාර්කෝඩ් වර්ගයයි.",
      },
      CODE128: {
        name: "Code 128 (කර්මාන්ත ප්‍රමිතිය)",
        desc: "ඉංග්‍රීසි අකුරු සහ අංක යන දෙකම අඩංගු කළ හැකි ඉහළම ප්‍රමිතියේ බාර්කෝඩ් එකයි. අභ්‍යන්තර ගබඩා පාලනයට වඩාත්ම සුදුසුයි.",
      },
      CODE39: {
        name: "Code 39 (රජයේ හා රථවාහන අංශ)",
        desc: "පැරණි හා විශ්වසනීය ප්‍රමිතියකි. රථවාහන අමතර කොටස්, රාජ්‍ය ආයතන හා සෞඛ්‍ය අංශවල බහුලව භාවිතා වේ.",
      },
      GS1_128: {
        name: "GS1-128 (ප්‍රවාහන පැලට් සඳහා)",
        desc: "භාණ්ඩ කාණ්ඩ අංක, කල් ඉකුත්වන දින හා GTIN අංක එකම කේතයකට ගොනු කර විශාල තොග පෙට්ටිවල අලවන ජාත්‍යන්තර කේතයයි.",
      },
      ITF14: {
        name: "ITF-14 (රළු කාටන් පෙට්ටි සඳහා)",
        desc: "රළු ප්‍රවාහන කාටන් පෙට්ටි මත සෘජුවම මුද්‍රණය කළ හැකි පරිදි ඝන කළු රාමුවක් සහිතව නිපදවා ඇති විශේෂ කේතයයි.",
      },
      QR: {
        name: "සාමාන්‍ය QR කේතය",
        desc: "ජංගම දුරකථන මගින් පහසුවෙන් ස්කෑන් කර වෙබ් අඩවි වෙත යාමට හා තොරතුරු බැලීමට භාවිතා කරන ජනප්‍රිය 2D කේතයයි.",
      },
      GS1_DIGITAL_LINK: {
        name: "GS1 Digital Link (නවීනතම QR)",
        desc: "විප්ලවීය කේතයකි: වෙළඳසැල් බිල්පත් මැෂින් මගින් බාර්කෝඩ් එකක් ලෙස ස්කෑන් වන අතර, පාරිභෝගිකයාගේ ෆෝන් එකෙන් ස්කෑන් කළ විට වෙබ් අඩවියට යයි.",
      },
      DATA_MATRIX: {
        name: "Data Matrix (කාර්මික 2D)",
        desc: "ඉතා කුඩා ඉලෙක්ට්‍රොනික උපාංග, මයික්‍රෝ චිප් හා වෛද්‍ය උපකරණ මත යොදනු ලබන අධි-සාන්ද්‍ර 2D කේතයයි.",
      },
    },

    previewTitle: "මුද්‍රණය සඳහා සජීවී පූර්ව දසුන",
    previewSub: "ස්ටිකර් සහ ලේසර් ප්‍රින්ටර් සඳහා ප්‍රශස්ත කර ඇත",
    downloadBtn: "PNG රූපය බාගත කරන්න",
    printBtn: "මුද්‍රණය කරන්න (Print)",
    upsellTitle: "ඔබේ සියලුම වෙළඳසැල්වල බිල්පත් කිරීම හා තොග ස්වයංක්‍රීය කරන්න",
    upsellDesc:
      "බාර්කෝඩ් මුද්‍රණය පළමු පියවර පමණි. අතින් තොග ගණන් කිරීම නවත්වන්න. Synctra Smart POS මගින් බිල්පත් කිරීමේදී මෙම කේත ස්කෑන් කර තොග ස්වයංක්‍රීයව අඩු කරයි.",
    joinWaitlistBtn: "Synctra නොමිලේ අත්හදා බලන්න",
  },
  ta: {
    badge: "GS1 சான்றளிக்கப்பட்ட தரநிலைகள் • POS தயார் • Thermal Print 4x",
    title: "சர்வதேச பார்கோடு, SKU & QR ஜெனரேட்டர்",
    subtitle:
      "பல்பொருள் அங்காடி பார்கோடுகள், கிடங்கு சரக்கு லேபிள்கள், அட்டைப்பெட்டி குறியீடுகள் மற்றும் GS1 Digital Link QR குறியீடுகளை உடனடியாக உருவாக்குங்கள்.",
    productDetails: "1. பொருள் & குறியீடு",
    customizationTitle: "2. லேபிள் அமைப்புகள்",
    realtimeActive: "நேரலை",
    productNameLabel: "தயாரிப்பு பெயர்",
    productNamePlace: "எ.கா., கற்றாழை ஷாம்பு",
    categoryLabel: "வகை",
    categoryPlace: "எ.கா., முடி பராமரிப்பு",
    sizeLabel: "அளவு / எடை",
    sizePlace: "எ.கா., 250ml",
    generatedSkuLabel: "எழுத்து & எண் SKU",
    manualEditHint: "Code 128 / 39-க்கு",
    gtinLabel: "GTIN / பார்கோடு எண்",
    gtinHint: "சில்லறை செக்அவுட்களுக்குத் தேவையான எண்கள்",
    batchLabel: "தொகுதி எண் (Batch / Lot)",
    digitalLinkLabel: "Digital Link இணைய முகவரி",

    barHeightLabel: "பார்கோடு உயரம்",
    barWidthLabel: "பட்டை அடர்த்தி (Density)",
    showTextLabel: "குறியீடு எண்களைக் காட்டு",
    colorThemeLabel: "மை நிறம்",

    colors: {
      black: "கருப்பு (Black)",
      navy: "அடர் நீலம் (Deep Navy)",
      indigo: "இண்டிகோ (Royal Indigo)",
      emerald: "பச்சை (Forest Emerald)",
    },

    categories: {
      retail: "சில்லறை விற்பனை (1D)",
      internal: "கிடங்கு SKUகள் (1D)",
      logistics: "ஷிப்பிங் பெட்டிகள் (1D)",
      matrix: "2D & Digital Link",
    },

    formats: {
      EAN13: {
        name: "EAN-13 (சர்வதேச சில்லறை தரநிலை)",
        desc: "உலகெங்கிலும் உள்ள பல்பொருள் அங்காடிகளில் செக்அவுட் செய்ய கட்டாயமான பார்கோடு. 13 இலக்கங்களை கொண்டது.",
      },
      UPCA: {
        name: "UPC-A (வட அமெரிக்க தரநிலை)",
        desc: "அமெரிக்கா மற்றும் கனடா முழுவதும் சில்லறை செக்அவுட்களுக்குத் தேவையான பார்கோடு. 12 இலக்கங்கள் கொண்டது.",
      },
      EAN8: {
        name: "EAN-8 / UPC-E (சிறிய பொருட்களுக்கு)",
        desc: "ஒப்பனை பொருட்கள், மிட்டாய் மற்றும் சூயிங்கம் போன்ற மிகச் சிறிய பேக்கிங்கிற்காக வடிவமைக்கப்பட்ட சுருக்கப்பட்ட பார்கோடுகள்.",
      },
      CODE128: {
        name: "Code 128 (தொழில்துறை தரநிலை)",
        desc: "அனைத்து ASCII எழுத்துக்களையும் ஆதரிக்கும் அதிக அடர்த்தி கொண்ட பார்கோடு. உள் கிடங்கு மற்றும் சொத்து கண்காணிப்புக்கான #1 தரநிலை.",
      },
      CODE39: {
        name: "Code 39 (வாகன & அரசு துறை)",
        desc: "வாகன, பாதுகாப்பு, சுகாதாரம் மற்றும் அரசு தளவாடத் துறைகளில் பரவலாகப் பயன்படுத்தப்படும் பழைய நம்பகமான தரநிலை.",
      },
      GS1_128: {
        name: "GS1-128 (ஷிப்பிங் பலகைகள்)",
        desc: "தயாரிப்பு GTIN, தொகுதி எண் மற்றும் காலாவதி தேதி ஆகியவற்றை குறியீடாக்க ஷிப்பிங் கண்டெய்னர்களில் உலகளவில் பயன்படுத்தப்படுகிறது.",
      },
      ITF14: {
        name: "ITF-14 (அட்டைப்பெட்டிகளுக்கு)",
        desc: "சொர சொரப்பான அட்டைப்பெட்டிகள் மீது நேரடியாக அச்சிடும் வகையில் அடர்த்தியான கருப்பு சட்டத்துடன் வடிவமைக்கப்பட்ட சிறப்பு குறியீடு.",
      },
      QR: {
        name: "தரமான QR குறியீடு",
        desc: "ஸ்மார்ட்போன் ஸ்கேனிங், மார்கெட்டிங் பிரச்சாரங்கள் மற்றும் டிஜிட்டல் கையேடுகளுக்கான உலகளாவிய 2D தரநிலை.",
      },
      GS1_DIGITAL_LINK: {
        name: "GS1 Digital Link (ஸ்மார்ட் QR)",
        desc: "புரட்சிகரமான வடிவம்: POS கவுண்டர்களில் வழக்கமான பார்கோடு போல ஸ்கேன் ஆகும், அதே சமயம் போனில் ஸ்கேன் செய்தால் இணையதளத்தை திறக்கும்.",
      },
      DATA_MATRIX: {
        name: "Data Matrix (தொழில்துறை 2D)",
        desc: "சிறிய மின்னணு பாகங்கள், மருத்துவ உபகரணங்கள் மற்றும் மருந்து பாட்டில்களை கண்காணிக்க விரும்பப்படும் அதி-அடர்த்தி 2D குறியீடு.",
      },
    },

    previewTitle: "நேரலை லேபிள் முன்னோட்டம்",
    previewSub: "தெர்மல் மற்றும் லேசர் பிரிண்டர் மேம்படுத்தப்பட்டது",
    downloadBtn: "PNG பதிவிறக்க",
    printBtn: "அச்சிடு (Print)",
    upsellTitle: "உங்கள் கடைகள் முழுவதும் பில்லிங் & கையிருப்பில் தானியங்கு",
    upsellDesc:
      "லேபிள்களை அச்சிடுவது முதல் படி மட்டுமே. கைகளால் கையிருப்பைக் கணக்கிடுவதை நிறுத்துங்கள். Synctra Smart POS செக்அவுட்டின் போது இவற்றை ஸ்கேன் செய்து சரக்கை தானாக கழிக்கிறது.",
    joinWaitlistBtn: "Synctra இலவசமாக முயற்சிக்க",
  },
} as const;
