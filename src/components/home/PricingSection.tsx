import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Star, Sparkles, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const tiers = [
    {
        id: "free",
        name: "01 / Free",
        title: "Enthusiast",
        price: "₹0",
        description: "Fundamental tools for casual movie fans starting their journey.",
        features: [
            "Unlimited movie discovery",
            "Personal watchlist",
            "Public profile",
            "Basic diary features"
        ],
        cta: "Current Plan",
        popular: false,
        color: "border-border/30",
    },
    {
        id: "pro",
        name: "02 / Pro",
        title: "Archivist",
        price: "₹199",
        period: "/mo",
        description: "Advanced tools for the dedicated collector and critical viewer.",
        features: [
            "Golden Profile Badge",
            "Detailed Viewing Analytics",
            "Custom Profile Themes",
            "Ad-free Experience",
            "Early Beta Access"
        ],
        cta: "Become a Pro",
        popular: true,
        color: "border-primary/50 bg-primary/5",
    },
    {
        id: "legend",
        name: "03 / Legend",
        title: "Cinephile",
        price: "₹499",
        period: "/mo",
        description: "Premium perks for those who live and breathe cinema.",
        features: [
            "Legendary Diamond Badge",
            "Private Archivist Groups",
            "Unlimited Custom Lists",
            "Personalized Curators",
            "Physical Yearly Print-out",
            "Lifetime Stats Export"
        ],
        cta: "Go Legend",
        popular: false,
        isLegend: true,
        color: "border-amber-500/50 bg-amber-500/5",
    }
];

export function PricingSection() {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Header Animation
            if (headerRef.current) {
                gsap.fromTo(headerRef.current,
                    { y: 60, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 1.2,
                        ease: "expo.out",
                        scrollTrigger: {
                            trigger: headerRef.current,
                            start: "top 90%",
                            toggleActions: "play none none reverse",
                        },
                    }
                );
            }

            // Cards Stagger
            if (cardsRef.current) {
                const cards = cardsRef.current.querySelectorAll(".pricing-card");
                gsap.fromTo(cards,
                    { y: 80, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 1,
                        stagger: 0.1,
                        ease: "power4.out",
                        scrollTrigger: {
                            trigger: cardsRef.current,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="pricing"
            className="relative py-32 overflow-hidden"
        >
            {/* Minimalist Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="container mx-auto px-6">
                <div ref={headerRef} className="mb-24 relative z-10 text-center md:text-left">
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70">Membership / Access</span>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-6">
                        <div>
                            <h2 className="font-serif text-6xl md:text-8xl tracking-tighter uppercase leading-[0.9]">
                                Level <br /><span className="text-primary italic">Up</span>
                            </h2>
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest max-w-sm leading-relaxed mb-2 mx-auto md:mx-0">
                            Support the archive and unlock technical tools for the ultimate cinematic documentation. Exclusive perks for dedicated archivists.
                        </p>
                    </div>
                </div>

                <div ref={cardsRef} className="grid md:grid-cols-3 gap-0 border border-border/20 relative z-10 bg-background/50 backdrop-blur-sm">
                    {tiers.map((tier, idx) => (
                        <div
                            key={tier.id}
                            className={cn(
                                "pricing-card group relative p-12 transition-all duration-700 hover:bg-foreground/[0.02] flex flex-col",
                                idx < 2 && "md:border-r border-b md:border-b-0 border-border/20",
                                tier.isLegend && "bg-amber-500/[0.01]"
                            )}
                        >
                            {/* Status Line */}
                            <div className="flex justify-between items-center mb-16">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                                    Segment {String(idx + 1).padStart(2, "0")}
                                </span>
                                {tier.popular && (
                                    <span className="font-mono text-[9px] uppercase tracking-tighter text-primary font-bold px-2 py-0.5 border border-primary/30 rounded-full">
                                        Recommended
                                    </span>
                                )}
                                {tier.isLegend && (
                                    <Star className="h-4 w-4 text-amber-500/40 fill-amber-500/20" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="mb-12">
                                <h3 className="font-serif text-4xl uppercase tracking-tighter mb-4 group-hover:translate-x-1 transition-transform duration-500">
                                    {tier.title}
                                </h3>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="font-mono text-5xl font-bold tracking-tighter">{tier.price}</span>
                                    {tier.period && (
                                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{tier.period}</span>
                                    )}
                                </div>
                                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed h-12 overflow-hidden">
                                    {tier.description}
                                </p>
                            </div>

                            {/* Features List */}
                            <ul className="space-y-5 mb-16 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-4 group/item">
                                        <div className={cn(
                                            "h-1 w-1 mt-1.5 rounded-full transition-all duration-300 group-hover/item:scale-150",
                                            tier.popular ? "bg-primary" : tier.isLegend ? "bg-amber-500" : "bg-muted-foreground/30"
                                        )} />
                                        <span className="font-mono text-[10px] text-foreground/60 group-hover/item:text-foreground transition-colors uppercase tracking-wider leading-none">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* Action Area */}
                            <div className="relative mt-auto pt-8 border-t border-border/10">
                                <button
                                    onClick={() => navigate(tier.id === "free" ? "/home" : `/checkout/${tier.id}`)}
                                    className={cn(
                                        "group/btn w-full flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] transition-all py-4 px-2",
                                        tier.id === "free" ? "text-muted-foreground hover:text-foreground" : "text-foreground"
                                    )}
                                >
                                    <span>{tier.cta}</span>
                                    <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover/btn:translate-x-2" />
                                </button>

                                {/* Hover underline effect */}
                                <div className={cn(
                                    "absolute bottom-0 left-0 h-px w-0 transition-all duration-700 group-hover:w-full",
                                    tier.popular ? "bg-primary" : tier.isLegend ? "bg-amber-500" : "bg-foreground"
                                )} />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
