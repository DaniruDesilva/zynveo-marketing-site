import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://zynveo.com";

  // Core static pages
  const staticPages = [
    "",
    "/mrp-calculator",
    "/invoice-generator",
    "/barcode-generator",
    "/blog",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1.0 : 0.9,
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
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages];
}
