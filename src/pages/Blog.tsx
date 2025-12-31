import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Calendar, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    title: 'Welcome to CineLunatic',
    date: 'December 2024',
    excerpt: 'Introducing a new way to track and share your film journey. Learn about our vision and what makes CineLunatic special.',
    slug: 'welcome-to-cinelunatic'
  },
  {
    title: 'Building Your Film Archive',
    date: 'December 2024',
    excerpt: 'Tips and best practices for logging your films, writing reviews, and organizing your personal cinema archive.',
    slug: 'building-your-film-archive'
  },
  {
    title: 'Community Features Launch',
    date: 'December 2024',
    excerpt: 'Connect with fellow cinephiles through polls, debates, and shared lists. Discover what the community is watching.',
    slug: 'community-features-launch'
  }
];

export default function Blog() {
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current || !headerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );

      const posts = contentRef.current?.querySelectorAll(".blog-post-card");
      if (posts) {
        gsap.fromTo(
          posts,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.3
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <Layout>
      <SmoothScroll>
        <main className="relative min-h-screen selection:bg-primary selection:text-primary-foreground overflow-hidden">
          <div className="grid-bg fixed inset-0 opacity-20 pointer-events-none" aria-hidden="true" />
          <div className="noise-overlay" aria-hidden="true" />

          <div className="relative z-10 container mx-auto px-6 md:px-28 py-32 max-w-5xl">
            <header ref={headerRef} className="mb-20">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Journal / Updates</span>
              <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">Field Notes</h1>
              <p className="mt-6 font-mono text-sm text-muted-foreground uppercase tracking-widest max-w-xl">
                News, updates, and philosophical musings on the art of cinema.
              </p>
              <div className="mt-8 w-24 h-px bg-primary/60" />
            </header>

            <div ref={contentRef} className="space-y-12">
              {blogPosts.map((post) => (
                <article key={post.slug} className="blog-post-card group relative p-10 border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden transition-all hover:bg-card/50">
                  {/* Subtle Grid Accent */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none grid-bg" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 font-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-6">
                      <Calendar className="h-3 w-3" />
                      <span>{post.date}</span>
                    </div>

                    <h2 className="font-serif text-3xl md:text-4xl uppercase tracking-tight mb-6 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>

                    <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                      {post.excerpt}
                    </p>

                    <button className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground flex items-center gap-2 group/btn">
                      Read Full Article
                      <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>

                  <div className="absolute bottom-0 right-0 w-12 h-12 bg-background rotate-45 translate-x-8 translate-y-8 border-t border-l border-border/30" />
                </article>
              ))}

              <div className="mt-24 pt-12 border-t border-border/40 text-center">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em] mb-6">
                  Want to stay updated with the latest news?
                </p>
                <div className="inline-block px-10 py-4 border border-border/40 font-mono text-[10px] uppercase tracking-[0.3em] text-primary hover:bg-primary/5 cursor-pointer transition-colors">
                  Join the Archives
                </div>
              </div>
            </div>
          </div>
        </main>
      </SmoothScroll>
    </Layout>
  );
}

