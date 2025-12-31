import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

export function ColophonSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Header slide in
            if (headerRef.current) {
                gsap.from(headerRef.current, {
                    x: -60,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: headerRef.current,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                });
            }

            // Grid columns fade up with stagger
            if (gridRef.current) {
                const columns = gridRef.current.querySelectorAll(":scope > div");
                gsap.from(columns, {
                    y: 40,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: gridRef.current,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                });
            }

            // Footer fade in
            if (footerRef.current) {
                gsap.from(footerRef.current, {
                    y: 20,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: footerRef.current,
                        start: "top 95%",
                        toggleActions: "play none none reverse",
                    },
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="colophon"
            className="relative py-32 pl-6 md:pl-28 pr-6 md:pr-12 border-t border-border/30"
        >
            {/* Section header */}
            <div ref={headerRef} className="mb-16">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">04 / Footer</span>
                <h2 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">INFORMATION</h2>
            </div>

            {/* Multi-column layout */}
            <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12">
                {/* Platform */}
                <div className="col-span-1">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Platform</h4>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                to="/about"
                                className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors duration-200"
                            >
                                The Manifesto
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/blog"
                                className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors duration-200"
                            >
                                Field Notes
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/search"
                                className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors duration-200"
                            >
                                Catalog Search
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Community */}
                <div className="col-span-1">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Community</h4>
                    <ul className="space-y-2">
                        <li className="font-mono text-xs text-foreground/80">Film Lovers</li>
                        <li className="font-mono text-xs text-foreground/80">Archive Makers</li>
                    </ul>
                </div>

                {/* Resources */}
                <div className="col-span-1">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Features</h4>
                    <ul className="space-y-2">
                        <li className="font-mono text-xs text-foreground/80">Track Films</li>
                        <li className="font-mono text-xs text-foreground/80">Rate & Review</li>
                        <li className="font-mono text-xs text-foreground/80">Share Lists</li>
                    </ul>
                </div>

                {/* Stack */}
                <div className="col-span-1">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Built With</h4>
                    <ul className="space-y-2">
                        <li className="font-mono text-xs text-foreground/80">React</li>
                        <li className="font-mono text-xs text-foreground/80">Tailwind CSS</li>
                        <li className="font-mono text-xs text-foreground/80">Vite</li>
                    </ul>
                </div>

                {/* Legal */}
                <div className="col-span-1">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Legal</h4>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                to="/privacy"
                                className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors duration-200"
                            >
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/terms"
                                className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors duration-200"
                            >
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/contact"
                                className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors duration-200"
                            >
                                Support
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Year */}
                <div className="col-span-1">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Status</h4>
                    <ul className="space-y-2">
                        <li className="font-mono text-xs text-foreground/80">{new Date().getFullYear()}</li>
                        <li className="font-mono text-xs text-foreground/80">Active</li>
                    </ul>
                </div>
            </div>

            {/* Bottom copyright */}
            <div
                ref={footerRef}
                className="mt-24 pt-8 border-t border-border/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    © {new Date().getFullYear()} CineLunatic Archive / v1.2.0
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">Designed with passion. Built for film lovers.</p>
            </div>
        </section>
    );
}
