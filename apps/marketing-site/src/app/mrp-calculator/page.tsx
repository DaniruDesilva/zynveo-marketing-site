import React from "react";
import { MrpCalculatorClient } from "@/components/calculator/MrpCalculatorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free FMCG MRP & Margin Calculator | Zynveo",
  description:
    "Solve the #1 consumer pricing mistake. Calculate true wholesaler cuts, retailer margins, landed cost, and final shelf price instantly in real-time.",
  keywords: ["MRP calculator", "FMCG margin calculator", "retail cut calculator", "wholesaler margin", "price reversal calculator"],
  alternates: {
    canonical: "/mrp-calculator",
  },
  openGraph: {
    title: "Free FMCG MRP & Margin Calculator | Zynveo",
    description:
      "Reverse-engineer shelf prices and uncover hidden margin drains instantly.",
    url: "https://zynveo.com/mrp-calculator",
  },
};

export default function MrpCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zynveo Dual-Mode MRP & Margin Calculator",
    url: "https://zynveo.com/mrp-calculator",
    description:
      "Free interactive calculator to reverse-engineer FMCG product margins, VAT taxes, wholesaler cuts, and retailer cuts.",
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
      <MrpCalculatorClient />
    </>
  );
}
