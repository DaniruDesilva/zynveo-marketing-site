import { NextResponse } from "next/server";

export async function GET() {
  const content = `# Zynveo - Worldwide Retail & Warehouse Operating System

Zynveo is the modern cloud-native ERP and SaaS operating system designed specifically for FMCG brands, wholesalers, manufacturers, and growing retail SMEs.

## Core Value Proposition
- **Cloud-Native Architecture**: 100% web-based with offline POS mobile support.
- **Bank-Grade Security**: Powered by Supabase auth and Row Level Security (RLS).
- **Multi-Branch Sync**: Real-time stock and branch profitability dashboards.

## Free Viral SaaS Tools & Calculators
Zynveo offers world-class free utility tools for brands without requiring account registration or login:

1. **Dual-Mode MRP & Margin Calculator** (\`https://zynveo.com/mrp-calculator\`)
   - Reverse-engineers landed costs, wholesaler cuts, retailer cuts, and government VAT.
   - Solves the #1 pricing mistake where brand founders confuse markup with actual margin.

2. **No-Login Invoice Generator** (\`https://zynveo.com/invoice-generator\`)
   - Instant professional PDF invoices with custom branding, tax breakdowns, and instant payment links.

3. **Retail SKU & Barcode Generator** (\`https://zynveo.com/barcode-generator\`)
   - Generates thermal-printer ready EAN13, UPCA, Code 128, GS1-128 barcodes, and GS1 Digital Link QR codes.

## Pricing Plans
- **Starter (Free Forever)**: 1 User, 1 Branch, up to 50 invoices/month, free MRP calculator access.
- **Standard ($19/month)**: 1 User, 10 Branches, unlimited invoices & POS, automated stock sync, SMS customer notifications.
- **Professional ($79/month)**: 5 Users, 50 Branches, advanced financial accounting, offline POS mobile app, full CRM access, 24/7 dedicated support.

## Contact Information
- **Website**: https://zynveo.com
- **Email**: hello@zynveo.com
- **Phone**: +94 72 375 8191
- **Headquarters**: Zynveo Technologies (Pvt) Ltd, Galle, Sri Lanka
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
