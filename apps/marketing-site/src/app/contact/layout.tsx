import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Sales & Support | Zynveo Cloud OS",
  description:
    "Reach out to Zynveo technical support, enterprise sales engineers, or wholesale partnership inquiries. 24/7 monitored inbox and fast response times.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Sales & Support | Zynveo Cloud OS",
    description:
      "Get in touch with Zynveo enterprise specialists for custom cloud ERP pricing tiers and POS demo scheduling.",
    url: "https://zynveo.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
