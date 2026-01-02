import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react';
import { blogPosts } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const post = blogPosts.find(p => p.slug === slug);
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!post) {
            navigate('/blog');
            return;
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(
                headerRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
            );

            gsap.fromTo(
                contentRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power3.out" }
            );
        });

        return () => ctx.revert();
    }, [post, navigate]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
    };

    if (!post) return null;

    return (
        <Layout>
            <SmoothScroll>
                <main className="relative min-h-screen selection:bg-primary selection:text-primary-foreground">
                    <div className="grid-bg fixed inset-0 opacity-20 pointer-events-none" aria-hidden="true" />
                    <div className="noise-overlay" aria-hidden="true" />

                    <article className="relative z-10 container mx-auto px-6 md:px-28 py-32 max-w-4xl">
                        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-12 group">
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span className="font-mono uppercase tracking-widest text-xs">Back to Journal</span>
                        </Link>

                        <header ref={headerRef} className="mb-16">
                            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-primary uppercase tracking-widest mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{post.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{post.readTime}</span>
                                </div>
                            </div>

                            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.9] mb-8">
                                {post.title}
                            </h1>

                            <div className="flex items-center justify-between border-y border-border/40 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{post.author}</p>
                                        <p className="text-xs text-muted-foreground">Editor</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleShare}>
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </header>

                        <div ref={contentRef} className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:uppercase prose-p:leading-relaxed prose-a:text-primary max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>

                        <div className="mt-24 pt-12 border-t border-border/40">
                            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">Share this article</p>
                            <div className="flex gap-4">
                                <Button variant="outline" className="gap-2" onClick={handleShare}>
                                    <Share2 className="h-4 w-4" />
                                    Copy Link
                                </Button>
                            </div>
                        </div>
                    </article>
                </main>
            </SmoothScroll>
        </Layout>
    );
}
