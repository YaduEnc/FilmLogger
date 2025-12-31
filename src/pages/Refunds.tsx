import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Refunds() {
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

            const sections = contentRef.current?.querySelectorAll("section");
            if (sections) {
                gsap.fromTo(
                    sections,
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
                            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Legal / Governance</span>
                            <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">Cancellations & Refunds</h1>
                            <p className="mt-6 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            <div className="mt-8 w-24 h-px bg-primary/60" />
                        </header>

                        <div ref={contentRef} className="space-y-16">
                            <section className="group">
                                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">1. Subscription Cancellation</h2>
                                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                                    You can cancel your CineLunatic Pro or Legend subscription at any time through
                                    your Account Settings. Upon cancellation, you will continue to have access
                                    to premium features until the end of your current billing period.
                                </p>
                            </section>

                            <section className="group">
                                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">2. Refund Policy</h2>
                                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                                    <p>We offer a "no questions asked" refund policy under the following conditions:</p>
                                    <ul className="space-y-3 border-l border-border/40 pl-6">
                                        <li><span className="text-foreground/80">—</span> Refund requests made within <span className="font-bold text-foreground">7 days</span> of the initial purchase.</li>
                                        <li><span className="text-foreground/80">—</span> Requests made due to technical issues that we are unable to resolve.</li>
                                        <li><span className="text-foreground/80">—</span> Accidental duplicate charges.</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="group">
                                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">3. Non-Refundable Items</h2>
                                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                                    <p>Refunds are not typically provided for:</p>
                                    <ul className="space-y-3 border-l border-border/40 pl-6">
                                        <li><span className="text-foreground/80">—</span> Subscription renewals (unless requested within 48 hours of charge).</li>
                                        <li><span className="text-foreground/80">—</span> Accounts that have been terminated for violating our Terms of Service.</li>
                                        <li><span className="text-foreground/80">—</span> Partial months of service after the initial 7-day period.</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="group">
                                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">4. How to Request a Refund</h2>
                                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                                    To request a refund, please contact us at <span className="font-bold text-foreground">support@cinelunatic.com</span> with
                                    your account email and transaction ID. Refunds are processed back to the
                                    original payment method within 5-10 business hours.
                                </p>
                            </section>

                            <section className="group pb-20">
                                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest italic">
                                    CineLunatic reserves the right to refuse refunds for users who abuse the platform.
                                </p>
                            </section>
                        </div>
                    </div>
                </main>
            </SmoothScroll>
        </Layout>
    );
}
