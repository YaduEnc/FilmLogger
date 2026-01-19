import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@/styles/cinematic.css";

gsap.registerPlugin(ScrollTrigger);

const experiments = [
    {
        title: "Sci-Fi Classics",
        medium: "Collection",
        description: "Essential science fiction films that shaped the genre.",
        span: "col-span-2 row-span-2",
        backdrop: "/scifi_projection.png",
        movies: ["2001: A SPACE ODYSSEY", "BLADE RUNNER", "SOLARIS", "STALKER", "METROPOLIS", "ALIEN", "THE MATRIX"]
    },
    {
        title: "French New Wave",
        medium: "Directors",
        description: "Pioneering cinema that redefined filmmaking.",
        span: "col-span-1 row-span-1",
        backdrop: "/french_new_wave_projection.png",
        movies: ["BREATHLESS", "THE 400 BLOWS", "CLEO FROM 5 TO 7", "CONTEMPT", "MY NIGHT AT MAUD'S"]
    },
    {
        title: "Visual Storytelling",
        medium: "Techniques",
        description: "Films celebrated for stunning cinematography.",
        span: "col-span-1 row-span-2",
        backdrop: "/cinematography_projection.png",
        movies: ["BARRY LYNDON", "THE REVENANT", "IN THE MOOD FOR LOVE", "ROMA", "THE CONFORMIST"]
    },
    {
        title: "Independent Gems",
        medium: "Emerging Voices",
        description: "Bold and innovative films from independent filmmakers.",
        span: "col-span-1 row-span-1",
        backdrop: "/indie_gems_projection.png",
        movies: ["MOONLIGHT", "LADY BIRD", "PARASITE", "WHIPLASH", "THE FLORIDA PROJECT"]
    },
    {
        title: "Narrative Structures",
        medium: "Story Craft",
        description: "Films with innovative approaches to storytelling.",
        span: "col-span-2 row-span-1",
        backdrop: "/narrative_projection.png",
        movies: ["PULP FICTION", "MEMENTO", "RASHOMON", "SYNECDOCHE, NEW YORK", "MULHOLLAND DRIVE"]
    },
    {
        title: "Global Cinema",
        medium: "World Films",
        description: "Cinematic excellence from around the world.",
        span: "col-span-1 row-span-1",
        backdrop: "/global_cinema_projection.png",
        movies: ["SEVEN SAMURAI", "CITY OF GOD", "SPIRITED AWAY", "AMELIE", "BICYCLE THIEVES"]
    },
];

export function WorkSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [activeBackdrop, setActiveBackdrop] = useState<string | null>(null);

    useEffect(() => {
        if (!sectionRef.current || !headerRef.current || !gridRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                headerRef.current,
                { x: -60, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 1.5,
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: headerRef.current,
                        start: "top 90%",
                        toggleActions: "play none none reverse",
                    },
                },
            );

            const cards = gridRef.current?.querySelectorAll("article");
            if (cards && cards.length > 0) {
                gsap.fromTo(cards,
                    { y: 40, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 1.2,
                        stagger: 0.1,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: gridRef.current,
                            start: "top 85%",
                        },
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="work" className="relative py-48 pl-6 md:pl-28 pr-6 md:pr-12 bg-black overflow-hidden selection:bg-primary/30">
            {/* Film Grain */}
            <div className="film-grain opacity-[0.08]" aria-hidden="true" />

            {/* Backdrop Projection Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 overflow-hidden">
                {experiments.map((exp, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                            activeBackdrop === exp.backdrop ? "opacity-30 scale-100" : "opacity-0 scale-105"
                        )}
                        style={{
                            backgroundImage: `url(${exp.backdrop})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'grayscale(1) brightness(0.4) contrast(1.2)'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
                    </div>
                ))}
            </div>

            {/* Section header */}
            <div ref={headerRef} className="relative z-10 mb-24 flex flex-col md:flex-row items-baseline justify-between gap-8">
                <div>
                    <span className="mono-detail uppercase text-primary/60">02 / Projection</span>
                    <h2 className="mt-6 font-serif text-6xl md:text-8xl tracking-tighter uppercase text-white/90">Curated <span className="italic text-primary/40">Lists</span></h2>
                </div>
                <p className="max-w-xs font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] leading-loose">
                    Explore thematic collections, genre deep-dives, and hand-picked films from the archive.
                </p>
            </div>

            {/* Asymmetric grid */}
            <div
                ref={gridRef}
                className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 auto-rows-[200px] md:auto-rows-[240px]"
            >
                {experiments.map((experiment, index) => (
                    <WorkCard
                        key={index}
                        experiment={experiment}
                        index={index}
                        onHover={() => setActiveBackdrop(experiment.backdrop)}
                        onLeave={() => setActiveBackdrop(null)}
                    />
                ))}
            </div>
        </section>
    );
}

function WorkCard({
    experiment,
    index,
    onHover,
    onLeave,
}: {
    experiment: {
        title: string;
        medium: string;
        description: string;
        span: string;
        backdrop: string;
        movies: string[];
    };
    index: number;
    onHover: () => void;
    onLeave: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <article
            className={cn(
                "group relative p-6 flex flex-col justify-between transition-all duration-700 cursor-pointer overflow-hidden border border-white/5",
                experiment.span,
                isHovered && "border-white/20 bg-white/[0.02]"
            )}
            onMouseEnter={() => {
                setIsHovered(true);
                onHover();
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                onLeave();
            }}
        >
            {/* Ticker Layer (Option A) */}
            <div className={cn(
                "absolute top-[45%] left-0 w-full -translate-y-1/2 pointer-events-none transition-opacity duration-1000 ticker-container z-0",
                isHovered ? "opacity-[0.07]" : "opacity-0"
            )}>
                <div className="ticker-track">
                    {[...experiment.movies, ...experiment.movies].map((movie, i) => (
                        <span key={i} className="font-serif text-2xl italic text-white whitespace-nowrap px-8">
                            {movie}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="w-4 h-px bg-white/40" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/60">
                        {experiment.medium}
                    </span>
                </div>
                <h3
                    className={cn(
                        "font-serif text-2xl md:text-5xl tracking-tighter transition-all duration-500 uppercase leading-[0.9]",
                        isHovered ? "text-white" : "text-white/40",
                    )}
                >
                    {experiment.title}
                </h3>
            </div>

            {/* Description - reveals with cinematic grace */}
            <div className="relative z-10 pb-2">
                <p
                    className={cn(
                        "font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] leading-relaxed transition-all duration-700 max-w-[260px]",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                    )}
                >
                    {experiment.description}
                </p>
            </div>

            {/* Index marker - Archival Style */}
            <div className="absolute top-8 right-8 font-mono text-[10px] text-white/10 group-hover:text-primary transition-colors flex flex-col items-end">
                <span>REEL</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
            </div>

            {/* Archival Label Accent */}
            <div className={cn(
                "absolute right-3 top-32 transition-opacity duration-700 archival-label opacity-0",
                isHovered && "opacity-100"
            )}>
                UNIT_001 / {experiment.title.replace(/\s+/g, '_').toUpperCase()}
            </div>

            {/* Border Accents */}
            <div className={cn(
                "absolute bottom-0 left-0 w-full h-[1px] bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"
            )} />
        </article>
    );
}
