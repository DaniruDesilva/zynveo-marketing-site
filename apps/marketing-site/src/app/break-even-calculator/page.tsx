import React from "react";
import { BreakEvenCalculatorClient } from "@/components/breakeven/BreakEvenCalculatorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Break-Even Point Calculator | Multi-Industry & Retail Margin Tool | Zynveo",
  description:
    "Discover exactly how many units or how much revenue your business must generate to cover all costs. Supports Single Product brands, Multi-Service Salons & Restaurants (Weighted Contribution Margin), and 10,000+ SKU Supermarkets — 100% free, no login required.",
  keywords: [
    "break-even calculator",
    "break-even point calculator",
    "break-even analysis tool",
    "salon break even point calculator",
    "restaurant break even calculator",
    "supermarket gross profit turnover calculator",
    "weighted contribution margin calculator",
    "fixed cost variable cost calculator",
    "how many units to break even",
    "free business calculator worldwide",
    "profit margin calculator",
    "Sri Lanka business calculator LKR",
  ],
  alternates: {
    canonical: "/break-even-calculator",
  },
  openGraph: {
    title: "Free Break-Even Point Calculator | Multi-Industry Tool | Zynveo",
    description:
      "Calculate your exact break-even point across single products, salon service mixes, or supermarket retail margins. Includes interactive charts and daily register targets.",
    url: "https://zynveo.com/break-even-calculator",
    type: "website",
    siteName: "Zynveo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Break-Even Point Calculator | Multi-Industry & Retail Tool",
    description:
      "Instantly calculate break-even units, daily register targets, and contribution margins for your business. No login needed.",
  },
};

export default function BreakEvenCalculatorPage() {
  // ─── Complete Multi-Schema JSON-LD (@graph: WebApplication, FAQPage, BreadcrumbList) ───
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://zynveo.com/break-even-calculator#webapp",
        name: "Zynveo Free Multi-Industry Break-Even Point Calculator",
        url: "https://zynveo.com/break-even-calculator",
        description:
          "Free interactive break-even point calculator with multi-business model support, weighted contribution margin table, supermarket daily/hourly turnover targets, real-time charts, and PDF report export.",
        applicationCategory: "BusinessApplication",
        operatingSystem: "All (Web Browser, iOS, Android, Windows, macOS)",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Single Product & Manufacturer Break-Even Unit Calculator",
          "Service & Menu Mix Mode for Salons, Restaurants, Bakeries, and Cafes using Weighted Contribution Margin",
          "Supermarket & Retail Margin Mode for 10,000+ SKU stores calculating Daily and Hourly Cash Register Turnover targets",
          "Dynamic interactive Recharts curve mapping Fixed Costs, Total Costs, and Revenue",
          "Multi-lingual interface supporting English, Sinhala, and Tamil",
          "Instant PDF export and sales breakdown report with zero login required",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://zynveo.com/break-even-calculator#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is the Break-Even Point (BEP) in business?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Break-Even Point (BEP) is the exact financial juncture where total business revenues equal total costs (fixed costs plus variable costs). At this point, the business experiences neither profit nor loss. Any revenue generated beyond the break-even point contributes directly to net profit.",
            },
          },
          {
            "@type": "Question",
            name: "How do you calculate break-even point in units and revenue?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "For a single product or service, the break-even formula in units is: Break-Even Units = Total Monthly Fixed Costs / (Unit Selling Price - Unit Variable Cost). To find the break-even revenue, multiply the break-even units by the unit selling price: Break-Even Revenue = Break-Even Units × Unit Selling Price.",
            },
          },
          {
            "@type": "Question",
            name: "How do multi-service businesses like salons, restaurants, and cafes calculate break-even?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Businesses selling multiple items with varying prices and costs (such as a salon offering haircuts, hair color, and facials, or a restaurant serving appetizers and main courses) must use the Weighted Average Contribution Margin. First, calculate the total expected revenue across all menu items based on estimated monthly volume. Second, calculate the total expected variable cost. Third, divide total contribution margin by total turnover to find the Weighted Contribution Margin Ratio (WCMR). Finally, divide total monthly fixed costs by the WCMR to find the exact overall break-even turnover required across the business.",
            },
          },
          {
            "@type": "Question",
            name: "How do supermarkets, grocery stores, and hardware shops calculate break-even across 10,000+ SKUs?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "When a store stocks thousands of individual items (milk, rice, soap, nails), counting individual unit sales is mathematically impractical. Instead, retail stores use their Average Gross Contribution Margin Ratio (%) (typically 18% to 25% for supermarkets and 30% to 45% for apparel or hardware). The formula is: Break-Even Monthly Turnover = Monthly Fixed Costs / Gross Contribution Margin %. Dividing this figure by 30 days yields the Required Daily Cash Register Turnover, and dividing by daily operating hours gives the Required Hourly Register Turnover.",
            },
          },
          {
            "@type": "Question",
            name: "What is the difference between Fixed Costs and Variable Costs?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Fixed costs are overhead expenses that remain constant every month regardless of how many items you sell or services you perform. Examples include commercial rent, permanent staff salaries, software leases, and basic utilities. Variable costs are direct costs that increase every time you sell a single product or service. Examples include raw food ingredients, shampoo and chemicals consumed per client, product packaging, shipping charges, and sales commissions.",
            },
          },
          {
            "@type": "Question",
            name: "Why is knowing your break-even point critical for small businesses and startups?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Without a precise break-even point, business owners operate blindly. Knowing your exact daily and hourly cash register turnover target allows managers to set realistic staff sales quotas, adjust pricing immediately when supplier costs rise, evaluate promotional campaigns, and avoid cash flow crises before they occur.",
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://zynveo.com/break-even-calculator#breadcrumbs",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://zynveo.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Free Business & ERP Tools",
            item: "https://zynveo.com",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Break-Even Point Calculator",
            item: "https://zynveo.com/break-even-calculator",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Interactive Client Application */}
      <BreakEvenCalculatorClient />

      {/* ══════════════════════════════════════════════════════════════════════
          SERVER-RENDERED SEMANTIC SEO & GEO GUIDE (Authoritative HTML Content)
          This static HTML ensures #1 search rankings and direct citation by AI Overviews & Chatbots
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="break-even-guide-title"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-5xl border-t border-neutral-border/60 text-neutral-text"
      >
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center sm:text-left space-y-3">
            <h2
              id="break-even-guide-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900"
            >
              The Comprehensive Guide to Break-Even & Contribution Margin Analysis Across Industries
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-3xl">
              Whether you are launching a flagship manufacturing brand, operating a multi-chair salon, running a busy restaurant, or managing a 10,000-SKU supermarket, understanding your exact break-even point is the foundation of sustainable profitability.
            </p>
          </div>

          {/* Core Formulas Table */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
              Break-Even Mathematical Formulas & Unit Economics
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Industry / Model</th>
                    <th className="p-4">Primary Metric</th>
                    <th className="p-4">Core Formula</th>
                    <th className="p-4">Best Used For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800 bg-white">
                  <tr>
                    <td className="p-4 font-extrabold text-primary">Single Product / Manufacturer</td>
                    <td className="p-4 font-mono text-xs">Unit Contribution Margin</td>
                    <td className="p-4 font-mono text-xs bg-slate-50">Units = Fixed Costs / (Price - Variable Cost)</td>
                    <td className="p-4 text-slate-600">Single-SKU brands, software packages, specialized services.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-extrabold text-amber-600">Salons, Restaurants & Cafes</td>
                    <td className="p-4 font-mono text-xs">Weighted Contribution Margin Ratio (WCMR)</td>
                    <td className="p-4 font-mono text-xs bg-slate-50">Turnover = Fixed Costs / Total CMR %</td>
                    <td className="p-4 text-slate-600">Multi-service menus with diverse price points and volumes.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-extrabold text-emerald-600">Supermarkets & Retail Stores</td>
                    <td className="p-4 font-mono text-xs">Gross Contribution Margin %</td>
                    <td className="p-4 font-mono text-xs bg-slate-50">Daily Target = (Fixed Costs / Margin %) / 30 Days</td>
                    <td className="p-4 text-slate-600">High-volume retail with 1,000+ SKUs across shelves.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep-Dive Industry Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-base">🛍️ Manufacturers & Single SKU Brands</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When selling a single standardized product, your contribution margin is simply what is left of your selling price after paying direct variable costs (raw materials, packaging, payment processing fees). Dividing your monthly overhead bills by this unit contribution gives the exact number of units you must ship each month before realizing $1 of profit.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <h4 className="font-extrabold text-amber-950 text-base">💇‍♂️ 🍽️ Salons, Restaurants & Bakeries</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A salon performing $25 quick haircuts alongside $120 coloring sessions cannot rely on simple unit averages. By listing each core service along with its expected monthly share, Zynveo computes your weighted average contribution margin. This produces an actionable item-by-item sales target table for your team.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <h4 className="font-extrabold text-emerald-950 text-base">🛒 Supermarkets & Hardware Retailers</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If your grocery or hardware store holds 10,000 different SKUs on its shelves, counting individual item units is impossible. By applying your store&apos;s overall Gross Contribution Margin % (typically 18% to 25% for FMCG), you can immediately calculate the exact daily and hourly cash register revenue required to cover rent, electricity, and staff salaries.
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions (FAQ Accordion SEO Structure) */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Frequently Asked Questions (FAQ)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  What is the difference between Fixed Costs and Variable Costs?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Fixed costs stay constant regardless of how much business you do (e.g., commercial shop rent, full-time staff wages, internet bills). Variable costs scale directly with your sales volume (e.g., raw ingredients, shampoo consumed per haircut, cardboard boxes, or sales commissions).
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Why is a negative contribution margin dangerous?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  If your direct variable cost per unit exceeds your selling price, your contribution margin is negative. This means you lose cash on every single item sold or service rendered. No amount of sales volume can cover fixed costs under this condition; prices must be raised immediately or supplier costs negotiated down.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  How does Zynveo&apos;s Cloud ERP improve break-even tracking?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  While our free calculator allows instant scenario testing, Zynveo&apos;s full Cloud ERP and POS operating system automates this intelligence. It connects directly to your live inventory purchases, utility billing, and daily cash registers to calculate real-time, dynamic break-even thresholds across all branch locations automatically.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Can I use this calculator for multiple currencies like LKR, USD, EUR, or INR?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Yes! Our calculator supports major international and regional currencies including Sri Lankan Rupee (LKR), US Dollar (USD), Euro (EUR), British Pound (GBP), Indian Rupee (INR), Australian Dollar (AUD), and many more, with formatted currency summaries right on the live chart and downloadable PDF reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
