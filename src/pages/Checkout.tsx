import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, Sparkles, Zap, Lock } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const plans = {
    pro: {
        name: "Pro Archivist",
        price: "₹199",
        description: "Advanced tools for the dedicated collector.",
        features: [
            "Golden Profile Badge",
            "Detailed Viewing Analytics",
            "Custom Profile Themes",
            "Ad-free Experience"
        ],
        color: "text-primary border-primary/20 bg-primary/5",
        icon: <Sparkles className="h-5 w-5 text-primary" />
    },
    legend: {
        name: "Cinema Legend",
        price: "₹499",
        description: "Premium perks for the ultimate cinephile.",
        features: [
            "Legendary Diamond Badge",
            "Private Archivist Groups",
            "Unlimited Custom Lists",
            "Personalized Curators"
        ],
        color: "text-amber-500 border-amber-500/20 bg-amber-500/5",
        icon: <Zap className="h-5 w-5 text-amber-500" />
    }
};

export default function Checkout() {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const plan = planId === "pro" ? plans.pro : planId === "legend" ? plans.legend : null;

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    if (authLoading || !plan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const handlePayment = async () => {
        setIsProcessing(true);
        // Placeholder for Razorpay implementation
        setTimeout(() => {
            setIsProcessing(false);
            // In a real app, this would trigger Razorpay
            alert("Razorpay implementation coming soon! This page satisfies verification requirements.");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b bg-background sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/home" className="flex items-center gap-2">
                        <Logo className="h-6 w-6" />
                        <span className="font-bold text-lg tracking-tight uppercase">CineLunatic</span>
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border px-3 py-1 rounded-sm">
                        <Lock className="h-3 w-3" />
                        Secure Checkout
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Summary */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h1 className="text-2xl font-bold mb-2">Review Order</h1>
                            <p className="text-sm text-muted-foreground">Please review your subscription details below.</p>
                        </section>

                        <div className="border border-border p-6 rounded-none bg-card">
                            <div className="flex items-start justify-between mb-8 pb-6 border-b">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 border ${planId === 'pro' ? 'text-primary border-primary/20' : 'text-amber-500 border-amber-500/20'}`}>
                                        {planId === 'pro' ? <Sparkles className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest">{plan.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold">{plan.price}</span>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Per Month</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                        <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Information</h3>
                            <div className="border rounded-none p-5 space-y-4 text-xs font-medium">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Name</span>
                                    <span>{user?.displayName || "Member"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-mono">{user?.email}</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Checkout Card */}
                    <div className="lg:col-span-1">
                        <div className="border border-border p-6 rounded-none shadow-sm bg-card sticky top-24">
                            <h3 className="font-bold mb-6 text-sm uppercase tracking-widest">Pricing Summary</h3>

                            <div className="space-y-4 mb-8 text-xs font-medium">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{plan.name}</span>
                                    <span>{plan.price}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>₹0.00</span>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold uppercase tracking-wider">Total</span>
                                    <span className="text-2xl font-bold">{plan.price}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-none uppercase text-xs tracking-widest transition-all active:scale-[0.98]"
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Complete Order"
                                    )}
                                </Button>

                                <p className="text-[9px] text-center text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                                    Secure payment via Razorpay. By clicking, you agree to our <Link to="/terms" className="underline font-bold">Terms</Link>, <Link to="/refunds" className="underline font-bold">Refunds</Link> & <Link to="/contact" className="underline font-bold">Contact</Link>.
                                </p>

                                <div className="flex justify-center items-center gap-6 pt-6 opacity-40 grayscale border-t mt-4">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-3" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-3" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2 p-4 border border-border/50 text-muted-foreground/40 text-[9px] font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" />
                                Encrypted Data
                            </div>
                            <div className="flex items-center gap-2">
                                <Lock className="h-3 w-3" />
                                PCI DSS Compliant
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
