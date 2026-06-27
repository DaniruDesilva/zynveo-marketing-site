import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FMCG Pricing Intelligence & SaaS Growth Blog",
  description:
    "Expert advice, case studies, and guides on consumer product distribution, inventory math, retail margins, and modern ERP software.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Synctra Insights | FMCG Pricing & SaaS Growth Blog",
    description:
      "Expert advice on consumer product distribution, inventory math, and modern business operations.",
    url: "https://synctrahq.com/blog",
  },
};

export default function BlogPage() {
  const posts = [
    {
      title: "The #1 Pricing Mistake FMCG Founders Make: Confusing Markup with Margin",
      category: "Pricing Strategy",
      date: "June 24, 2026",
      author: "Daniru",
      readTime: "5 min read",
      desc: "Why calculating retailer cut based on cost instead of shelf price silently destroys your consumer product profitability.",
      slug: "confusing-markup-with-margin"
    },
    {
      title: "How We Migrated Our Core ERP Backend to Supabase & Saved 400 Hours",
      category: "Engineering",
      date: "June 18, 2026",
      author: "Synctra Team",
      readTime: "8 min read",
      desc: "An architectural deep-dive into Row Level Security (RLS), real-time branch sync, and strict TypeScript types.",
      slug: "migrating-to-supabase"
    },
    {
      title: "Why Sri Lankan Retailers Need Integrated POS + Invoicing in 2026",
      category: "Business Growth",
      date: "June 10, 2026",
      author: "Kamal Siriwardana",
      readTime: "4 min read",
      desc: "Stop paying for 5 disconnected SaaS tools. See how Synctra unifies stock, billing, and customer payments.",
      slug: "integrated-pos-invoicing"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-5xl">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Synctra Insights</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-text">
          Pricing Intelligence & SaaS Growth
        </h1>
        <p className="text-lg text-neutral-muted max-w-2xl mx-auto">
          Expert advice on consumer product distribution, inventory math, and modern business operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, idx) => (
          <article
            key={idx}
            className="rounded-2xl glass-panel p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl"
          >
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent-light px-3 py-1 rounded-full">
                {post.category}
              </span>
              <h2 className="text-xl font-bold text-neutral-text leading-snug hover:text-primary transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-sm text-neutral-muted leading-relaxed">{post.desc}</p>
            </div>

            <div className="pt-8 border-t border-neutral-border/60 flex items-center justify-between text-xs text-neutral-muted">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{post.date}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
