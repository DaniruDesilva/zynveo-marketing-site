import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://zynveo.com";

  // Primary navigation pages (Highest Sitelinks priority)
  const primaryPages = [
    "",
    "/mrp-calculator",
    "/invoice-generator",
    "/barcode-generator",
    "/payslip-generator",
    "/about",
    "/contact",
    "/blog",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1.0 : route === "/about" || route === "/contact" ? 0.9 : 0.85,
  }));

  // Legal and secondary pages
  const secondaryPages = [
    "/privacy",
    "/terms",
    "/legal",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Blog post routes
  const blogSlugs = [
    "confusing-markup-with-margin",
    "migrating-to-supabase",
    "integrated-pos-invoicing",
  ];

  const blogPages = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...primaryPages, ...secondaryPages, ...blogPages];
}
