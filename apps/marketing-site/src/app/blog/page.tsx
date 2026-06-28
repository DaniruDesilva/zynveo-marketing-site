import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, User, Clock, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { BLOG_POSTS_LIST } from "@/lib/blogData";

export const metadata: Metadata = {
  title: "FMCG Pricing Intelligence & SaaS Growth Blog",
  description:
    "Expert advice, case studies, and guides on consumer product distribution, inventory math, retail margins, and modern cloud ERP software.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Zynveo Insights | FMCG Pricing & SaaS Growth Blog",
    description:
      "Expert advice on consumer product distribution, inventory math, and modern business operations.",
    url: "https://zynveo.com/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-6xl">
      <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Zynveo Insights Library</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-text leading-tight">
          Pricing Intelligence & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            SaaS Growth Playbooks
          </span>
        </h1>
        <p className="text-lg text-neutral-muted font-medium">
          Explore proven strategies on consumer product distribution, retail shelf margins, inventory turnover, and cloud operating systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BLOG_POSTS_LIST.map((post, idx) => (
          <article
            key={idx}
            className="rounded-3xl glass-panel p-8 flex flex-col justify-between border border-neutral-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl space-y-6 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-neutral-muted font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readTime}</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-neutral-text leading-snug group-hover:text-primary transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-sm font-medium text-neutral-muted leading-relaxed line-clamp-3">
                {post.desc}
              </p>
            </div>

            <div className="pt-6 border-t border-neutral-border/60 flex items-center justify-between text-xs font-bold text-neutral-muted">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                  {post.author.charAt(0)}
                </div>
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
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
