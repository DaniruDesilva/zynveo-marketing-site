import React from "react";
import { BreakEvenCalculatorClient } from "@/components/breakeven/BreakEvenCalculatorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Break-Even Point Calculator | Zynveo",
  description:
    "Discover exactly how many units you need to sell to cover all costs. Calculate your break-even point with interactive charts, advanced cost breakdowns, and target profit goals — 100% free, no login required.",
  keywords: [
    "break-even calculator",
    "break-even point calculator",
    "break-even analysis tool",
    "contribution margin calculator",
    "fixed cost variable cost calculator",
    "how many units to break even",
    "free business calculator",
    "profit calculator",
  ],
  alternates: {
    canonical: "/break-even-calculator",
  },
  openGraph: {
    title: "Free Break-Even Point Calculator | Zynveo",
    description:
      "Calculate your exact break-even point with interactive charts. Know how many units to sell each month to cover all costs and start profiting.",
    url: "https://zynveo.com/break-even-calculator",
  },
};

export default function BreakEvenCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zynveo Break-Even Point Calculator",
    url: "https://zynveo.com/break-even-calculator",
    description:
      "Free interactive break-even calculator with real-time line charts, advanced cost line-item breakdowns, contribution margin analysis, and target profit goals.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreakEvenCalculatorClient />
    </>
  );
}
