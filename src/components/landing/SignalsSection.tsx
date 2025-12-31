import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getGlobalRecentReviews } from "@/lib/db";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb";
import { Review } from "@/types/movie";
import { format } from "date-fns";

gsap.registerPlugin(ScrollTrigger);

const fallbackSignals = [
    {
        date: "2025.06.10",
        title: "The Landscape Evolution",
        note: "Cinema landscapes: how filmmakers use geography to tell stories.",
    },
    {
        date: "2025.05.28",
        title: "Color Grading Secrets",
        note: "Exploring the visual language of color in contemporary cinema.",
    },
    {
        date: "2025.05.15",
        title: "Cinematography Innovations",
        note: "Breaking down techniques that define modern film aesthetics.",
    },
    {
        date: "2025.04.30",
        title: "Director's Vision",
        note: "How unique perspectives shape unforgettable films.",
    },
    {
        date: "2025.04.12",
        title: "Narrative Experiments",
        note: "Films that challenge traditional storytelling structures.",
    },
];

export function SignalsSection() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadReviews() {
            try {
                const fetched = await getGlobalRecentReviews(30);
                if (fetched.length > 0) {
                    // Deduplicate by movieId to ensure only one review per movie
                    const uniqueMovies = new Set();
                    const filtered = fetched.filter(r => {
                        if (uniqueMovies.has(r.movieId)) return false;
                        uniqueMovies.add(r.movieId);
                        return true;
                    }).slice(0, 5);

                    // Enrich reviews that might be missing title/poster
                    const enriched = await Promise.all(filtered.map(async (r) => {
                        let title = r.movieTitle;
                        let poster = r.moviePoster;

                        if (!title || !poster) {
                            try {
                                const details = r.mediaType === 'tv'
                                    ? await getTVDetails(r.movieId)
                                    : await getMovieDetails(r.movieId);
                                title = title || details.title;
                                poster = poster || details.posterUrl;
                            } catch (e) {
                                console.error(`Failed to enrich review for movie ${r.movieId}:`, e);
                            }
                        }

                        return {
                            date: format(new Date(r.createdAt), "yyyy.MM.dd"),
                            title: title || "Untitled Movie",
                            note: r.text,
                            moviePoster: poster
                        };
                    }));
                    setReviews(enriched);
                } else {
                    setReviews(fallbackSignals.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch landing reviews:", error);
                setReviews(fallbackSignals.slice(0, 5));
            } finally {
                setIsLoading(false);
            }
        }
        loadReviews();
    }, []);

    useEffect(() => {
        if (!sectionRef.current || !cursorRef.current) return;

        const section = sectionRef.current;
        const cursor = cursorRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = section.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            gsap.to(cursor, {
                x: x,
                y: y,
                duration: 0.5,
                ease: "power3.out",
            });
        };

        const handleMouseEnter = () => setIsHovering(true);
        const handleMouseLeave = () => setIsHovering(false);

        section.addEventListener("mousemove", handleMouseMove);
        section.addEventListener("mouseenter", handleMouseEnter);
        section.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            section.removeEventListener("mousemove", handleMouseMove);
            section.removeEventListener("mouseenter", handleMouseEnter);
            section.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    useEffect(() => {
        if (!sectionRef.current || !headerRef.current || !cardsRef.current || isLoading) return;

        const ctx = gsap.context(() => {
            // Header slide in from left
            gsap.fromTo(
                headerRef.current,
                { x: -60, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: headerRef.current,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                },
            );

            const cards = cardsRef.current?.querySelectorAll("article");
            if (cards) {
                gsap.fromTo(
                    cards,
                    { x: -100, opacity: 0 },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.2,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: cardsRef.current,
                            start: "top 90%",
                            toggleActions: "play none none reverse",
                        },
                    },
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, [isLoading]);

    return (
        <section id="signals" ref={sectionRef} className="relative py-32 pl-6 md:pl-28 overflow-hidden">
            <div
                ref={cursorRef}
                className={cn(
                    "pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-50",
                    "w-12 h-12 rounded-full border-2 border-primary bg-primary/20",
                    "transition-opacity duration-300",
                    isHovering ? "opacity-100" : "opacity-0",
                )}
            />

            {/* Section header */}
            <div ref={headerRef} className="mb-16 pr-6 md:pr-12">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">01 / Entries</span>
                <h2 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">RECENT REVIEWS</h2>
            </div>

            {/* Horizontal scroll container */}
            <div
                ref={(el) => {
                    scrollRef.current = el;
                    cardsRef.current = el;
                }}
                className="flex gap-8 overflow-x-auto pb-8 pr-12 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {reviews.map((signal, index) => (
                    <SignalCard key={index} signal={signal} index={index} />
                ))}
            </div>
        </section>
    );
}

function SignalCard({
    signal,
    index,
}: {
    signal: { date: string; title: string; note: string; moviePoster?: string };
    index: number;
}) {
    return (
        <article
            className={cn(
                "group relative flex-shrink-0 w-80",
                "transition-transform duration-500 ease-out",
                "hover:-translate-y-2",
            )}
        >
            {/* Card with paper texture effect */}
            <div className="relative bg-card border border-border/50 md:border-t md:border-l md:border-r-0 md:border-b-0 p-8 overflow-hidden h-full flex flex-col min-h-[420px]">
                {/* Movie Poster Background (Subtle) */}
                {signal.moviePoster && (
                    <div
                        className="absolute inset-0 opacity-[0.04] grayscale transition-opacity duration-700 group-hover:opacity-[0.08] pointer-events-none"
                        style={{
                            backgroundImage: `url(${signal.moviePoster})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                )}

                {/* Top torn edge effect */}
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                {/* Issue number - editorial style */}
                <div className="flex items-baseline justify-between mb-8 relative z-10 flex-shrink-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        No. {String(index + 1).padStart(2, "0")}
                    </span>
                    <time className="font-mono text-[10px] text-muted-foreground/60">{signal.date}</time>
                </div>

                {/* Title */}
                <h3 className="font-serif text-3xl sm:text-4xl tracking-tight mb-4 group-hover:text-primary transition-colors duration-300 uppercase relative z-10 line-clamp-3 min-h-[3.5em] flex items-end">
                    {signal.title}
                </h3>

                {/* Divider line */}
                <div className="w-12 h-px bg-primary/60 mb-6 group-hover:w-full transition-all duration-500 relative z-10 flex-shrink-0" />

                {/* Description */}
                <p className="font-mono text-xs text-muted-foreground leading-relaxed line-clamp-5 relative z-10 flex-grow">
                    {signal.note}
                </p>

                {/* Bottom right corner fold effect */}
                <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden flex-shrink-0">
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-background rotate-45 translate-x-4 translate-y-4 border-t border-l border-border/30" />
                </div>
            </div>

            {/* Shadow/depth layer */}
            <div className="absolute inset-0 -z-10 translate-x-1 translate-y-1 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </article>
    );
}
