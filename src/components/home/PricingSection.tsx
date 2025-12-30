import { Check, Star, Sparkles, ShieldCheck, Palette, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function PricingSection() {
    const navigate = useNavigate();
    const tiers = [
        {
            id: "free",
            name: "Free",
            price: "₹0",
            description: "Fundamental tools for casual movie fans.",
            features: [
                "Unlimited movie discovery",
                "Personal watchlist",
                "Public profile",
                "Basic diary features"
            ],
            cta: "Current Plan",
            variant: "outline" as const,
            popular: false,
            color: "border-border/40"
        },
        {
            id: "pro",
            name: "Pro Archivist",
            price: "₹199",
            period: "/month",
            description: "Advanced tools for the dedicated collector.",
            features: [
                "Golden Profile Badge",
                "Detailed Viewing Analytics",
                "Custom Profile Themes",
                "Ad-free Experience",
                "Early Beta Access"
            ],
            cta: "Become a Pro",
            variant: "default" as const,
            popular: true,
            color: "border-primary/50 bg-primary/5 shadow-primary/20"
        },
        {
            id: "legend",
            name: "Cinema Legend",
            price: "₹499",
            period: "/month",
            description: "Premium perks for the ultimate cinephile.",
            features: [
                "Legendary Diamond Badge",
                "Private Archivist Groups",
                "Unlimited Custom Lists",
                "Personalized Curators",
                "Physical Yearly Print-out",
                "Lifetime Stats Export"
            ],
            cta: "Go Legend",
            variant: "default" as const,
            popular: false,
            isLegend: true,
            color: "border-amber-500/50 bg-amber-500/5 shadow-amber-500/20"
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-background">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] -z-10 animate-pulse" />

            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/30 text-primary bg-primary/5 uppercase tracking-widest text-[10px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                        Memberships
                    </Badge>
                    <h2 className="text-4xl sm:text-6xl font-serif font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Elevate Your <span className="text-primary italic">Cinema</span> Life
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        Choose a plan that fits your viewing habits and support the future of archival cinema tracking.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                    {tiers.map((tier, index) => (
                        <Card
                            key={tier.name}
                            className={cn(
                                "relative p-8 border backdrop-blur-md transition-all duration-500 group hover:-translate-y-2 flex flex-col",
                                tier.color,
                                tier.isLegend && "hover:border-amber-500 shadow-xl"
                            )}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <Badge className="bg-primary text-primary-foreground shadow-lg px-4 py-1 gap-1 border-none font-bold uppercase tracking-tighter text-[9px]">
                                        <Sparkles className="h-3 w-3" />
                                        Best Value
                                    </Badge>
                                </div>
                            )}

                            {tier.isLegend && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <Badge className="bg-amber-500 text-white shadow-lg px-4 py-1 gap-1 border-none font-bold uppercase tracking-tighter text-[9px]">
                                        <Zap className="h-3 w-3 fill-current" />
                                        Elite Status
                                    </Badge>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={cn(
                                    "text-xl font-bold mb-2 flex items-center gap-2",
                                    tier.isLegend && "text-amber-500"
                                )}>
                                    {tier.name}
                                    {tier.popular && <Star className="h-4 w-4 fill-primary text-primary" />}
                                    {tier.isLegend && <ShieldCheck className="h-4 w-4 fill-amber-500 text-amber-500" />}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-serif font-bold tracking-tighter">{tier.price}</span>
                                    {tier.period && <span className="text-muted-foreground text-sm font-medium">{tier.period}</span>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{tier.description}</p>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 group/feature">
                                        <div className={cn(
                                            "mt-1 shrink-0 rounded-full p-0.5 transition-colors",
                                            tier.popular ? "bg-primary/20 text-primary" :
                                                tier.isLegend ? "bg-amber-500/20 text-amber-500" :
                                                    "bg-muted text-muted-foreground group-hover/feature:bg-foreground/10 group-hover/feature:text-foreground"
                                        )}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="text-sm text-foreground/80 group-hover/feature:text-foreground transition-colors font-medium">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={tier.variant || "default"}
                                className={cn(
                                    "w-full h-12 text-sm font-bold transition-all active:scale-[0.98] shadow-md",
                                    tier.popular && "bg-primary hover:bg-primary/90 border-none",
                                    tier.isLegend && "bg-amber-500 hover:bg-amber-600 text-white border-none shadow-amber-500/20"
                                )}
                                onClick={() => {
                                    if (tier.id === "free") {
                                        navigate("/home");
                                    } else {
                                        navigate(`/checkout/${tier.id}`);
                                    }
                                }}
                            >
                                {tier.cta}
                            </Button>

                            {/* Decorative Corner Glow */}
                            <div className={cn(
                                "absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -z-10 opacity-0 group-hover:opacity-20 transition-opacity duration-700",
                                tier.popular ? "bg-primary" : tier.isLegend ? "bg-amber-500" : "bg-foreground"
                            )} />
                        </Card>
                    ))}
                </div>

                <div className="mt-16 text-center space-y-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
                        Secure checkout powered by Stripe & Razorpay
                    </p>
                    <div className="flex justify-center items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="h-6 w-12 bg-white/10 rounded" /> {/* Placeholder logos */}
                        <div className="h-6 w-12 bg-white/10 rounded" />
                        <div className="h-6 w-12 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
        </section>
    );
}
