import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Clock, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { BLOG_POSTS, BLOG_POSTS_LIST } from "@/lib/blogData";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = BLOG_POSTS[params.slug];
  if (!post) {
    return {
      title: "Article Not Found | Zynveo Insights",
    };
  }
  return {
    title: `${post.title} | Zynveo Insights`,
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
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS[params.slug];

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg space-y-6">
        <h1 className="text-4xl font-black text-neutral-text">Article Not Found</h1>
        <p className="text-neutral-muted font-medium">The blog article you are looking for does not exist or has been moved.</p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Articles</span>
        </Link>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.desc,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Zynveo Technologies",
      logo: {
        "@type": "ImageObject",
        url: "https://zynveo.com/favicon.ico",
      },
    },
    datePublished: post.date,
  };

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline mb-10 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Insights Library</span>
      </Link>

      <article className="space-y-12">
        {/* Header */}
        <header className="space-y-6 pb-8 border-b border-neutral-border">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readTime}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-text leading-[1.18]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-bold text-neutral-muted pt-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                {post.author.charAt(0)}
              </div>
              <div>
                <div className="text-neutral-text font-extrabold">{post.author}</div>
                <div className="text-[11px] text-neutral-muted">FMCG & Retail Intelligence</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Published on {post.date}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="prose prose-lg max-w-none text-neutral-text space-y-6 font-medium leading-relaxed">
          {post.content.map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={i} className="text-2xl sm:text-3xl font-black text-slate-900 pt-6 border-t border-slate-100">
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={i} className="text-xl sm:text-2xl font-black text-slate-800 pt-4">
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("- ")) {
              return (
                <div key={i} className="flex items-start gap-3 pl-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                  <span className="text-slate-700">{paragraph.replace("- ", "")}</span>
                </div>
              );
            }
            return (
              <p key={i} className="text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary to-slate-900 text-white shadow-2xl space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Apply These Insights Today</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
            Stop Leaking Margins in Your Daily Operations
          </h3>
          <p className="text-indigo-100 max-w-xl mx-auto font-medium text-sm sm:text-base">
            Use Zynveo's 100% free viral MRP and Invoice calculators right now without creating an account or signing up.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/#free-tools"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-orange-500 text-white font-extrabold text-sm shadow-lg hover:scale-105 transition-all"
            >
              Launch Free Utility Suite
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/20"
            >
              Talk to Enterprise Sales
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
