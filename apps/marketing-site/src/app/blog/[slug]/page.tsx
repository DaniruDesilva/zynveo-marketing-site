import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock, Share2, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

interface BlogPostData {
  title: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  desc: string;
  slug: string;
  content: string[];
}

const BLOG_POSTS: Record<string, BlogPostData> = {
  "confusing-markup-with-margin": {
    title: "The #1 Pricing Mistake FMCG Founders Make: Confusing Markup with Margin",
    category: "Pricing Strategy",
    date: "June 24, 2026",
    author: "Daniru",
    readTime: "5 min read",
    desc: "Why calculating retailer cut based on cost instead of shelf price silently destroys your consumer product profitability.",
    slug: "confusing-markup-with-margin",
    content: [
      "When launching a new fast-moving consumer good (FMCG), founders often focus entirely on production costs and shelf pricing. However, the most insidious financial drain happens during trade margin structuring. Specifically, confusing **markup** (percentage over cost) with **margin** (percentage of final retail selling price).",
      "### The Retailer Cut Math Trap",
      "Imagine your landed production cost for a shampoo bottle is Rs. 500. You want to give supermarkets a 25% margin. If you calculate 25% on top of Rs. 500 (Rs. 125), your selling price becomes Rs. 625. But when the supermarket calculates their 25% margin backward from the Rs. 625 shelf price, their expected cut is Rs. 156.25!",
      "Suddenly, your own net brand retention drops by Rs. 31.25 per bottle. Multiplied across 50,000 units monthly, you leak over Rs. 1.5 Million in unaccounted profits purely due to improper margin math.",
      "### How Synctra Solves This",
      "We built the viral **Synctra Dual-Mode MRP Calculator** specifically to prevent this error. By letting you toggle between backward margin derivation and forward markup calculations, our tools enforce strict financial accuracy across your wholesale and distributor network."
    ],
  },
  "migrating-to-supabase": {
    title: "How We Migrated Our Core ERP Backend to Supabase & Saved 400 Hours",
    category: "Engineering",
    date: "June 18, 2026",
    author: "Synctra Team",
    readTime: "8 min read",
    desc: "An architectural deep-dive into Row Level Security (RLS), real-time branch sync, and strict TypeScript types.",
    slug: "migrating-to-supabase",
    content: [
      "Scaling an ERP platform handling thousands of real-time point-of-sale (POS) transactions across distributed branches requires bulletproof database reliability and instant data propagation.",
      "### Why We Choose Supabase & Postgres",
      "Traditional REST APIs with polling overhead caused latency during peak retail checkout hours. By migrating our data layer to Supabase, we tapped directly into Postgres Realtime webhooks and Row Level Security (RLS).",
      "### Zero-Compromise Branch Isolation",
      "With custom JWT claims in Supabase Auth, our RLS policies guarantee that warehouse managers in Branch A cannot read or modify inventory records in Branch B, all enforced at the Postgres kernel level without bloating our application layer code.",
      "This migration saved our engineering team over 400 hours of custom authentication and websocket server maintenance."
    ],
  },
  "integrated-pos-invoicing": {
    title: "Why Sri Lankan Retailers Need Integrated POS + Invoicing in 2026",
    category: "Business Growth",
    date: "June 10, 2026",
    author: "Kamal Siriwardana",
    readTime: "4 min read",
    desc: "Stop paying for 5 disconnected SaaS tools. See how Synctra unifies stock, billing, and customer payments.",
    slug: "integrated-pos-invoicing",
    content: [
      "For years, growing retail businesses and wholesalers have suffered from 'SaaS fatigue'. They pay one vendor for barcode generation, another for retail counter POS scanning, a third for accounting invoices, and a fourth for SMS tracking.",
      "### The Hidden Cost of Data Silos",
      "When your billing software doesn't instantly communicate with your central warehouse inventory, stockouts happen. Customers get invoiced for items out of stock, leading to disputes and damaged brand reputation.",
      "### Unified Operating System",
      "Synctra unifies these touchpoints. When a barcode is scanned at the retail POS counter, stock levels decrement across all branch dashboards instantly, and automated digital invoices are dispatched via WhatsApp and SMS."
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = BLOG_POSTS[params.slug];
  if (!post) {
    return { title: "Article Not Found | Synctra Blog" };
  }
  return {
    title: post.title,
    description: post.desc,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.desc,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      url: `https://synctrahq.com/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS[params.slug];
  if (!post) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.desc,
    author: {
      "@type": "Person",
      name: post.author,
    },
    datePublished: new Date(post.date).toISOString(),
    publisher: {
      "@type": "Organization",
      name: "Synctra Technologies",
      logo: {
        "@type": "ImageObject",
        url: "https://synctrahq.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://synctrahq.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to all insights</span>
        </Link>
      </div>

      <article className="glass-panel p-6 sm:p-12 rounded-3xl space-y-8">
        <div className="space-y-4 border-b border-neutral-border pb-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent-light px-3 py-1 rounded-full">
              {post.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-muted font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-text leading-[1.15]">
            {post.title}
          </h1>

          <div className="flex items-center justify-between pt-4 text-sm font-semibold text-neutral-muted">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-neutral-text">{post.author}</div>
                <div className="text-xs font-normal text-neutral-muted flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none text-neutral-text space-y-6 leading-relaxed">
          {post.content.map((paragraph, idx) => {
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={idx} className="text-2xl font-bold pt-4 text-neutral-text">
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            return (
              <p key={idx} className="text-base sm:text-lg text-neutral-muted leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        <div className="pt-12 border-t border-neutral-border flex flex-col sm:flex-row items-center justify-between gap-6 bg-primary-light/50 p-8 rounded-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-neutral-text">Ready to automate your FMCG margins?</h4>
            <p className="text-sm text-neutral-muted">Try the viral MRP calculator or generate an invoice instantly.</p>
          </div>
          <Link
            href="/mrp-calculator"
            className="px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:bg-accent-hover transition-all shrink-0"
          >
            Launch Free Calculator
          </Link>
        </div>
      </article>
    </div>
  );
}
