import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinemaFinder } from "@/components/movies/CinemaFinder";
import { Film, MapPin } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function CinemaFinderSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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

            // Content fade up
            if (contentRef.current) {
                gsap.from(contentRef.current, {
                    y: 40,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: contentRef.current,
                        start: "top 85%",
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
            id="cinema-finder"
            className="relative py-32 pl-6 md:pl-28 pr-6 md:pr-12 border-t border-border/30"
        >
            {/* Section header */}
            <div ref={headerRef} className="mb-16">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">05 / Cinema Finder</span>
                <h2 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase flex items-center gap-4">
                    Find Your Cinema
                    <MapPin className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </h2>
                <p className="mt-6 max-w-2xl font-mono text-sm text-muted-foreground leading-relaxed">
                    Discover cinemas near you or search by city. Find the perfect place to experience your next film.
                </p>
            </div>

            {/* Cinema Finder Component */}
            <div ref={contentRef}>
                <CinemaFinder />
            </div>
        </section>
    );
}
