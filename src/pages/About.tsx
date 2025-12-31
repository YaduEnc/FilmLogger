import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function About() {
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
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Platform / Purpose</span>
              <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">The Manifesto</h1>
              <p className="mt-6 font-mono text-sm text-muted-foreground uppercase tracking-widest max-w-xl">
                A technical and philosophical foundation for the CineLunatic ecosystem.
              </p>
              <div className="mt-8 w-24 h-px bg-primary/60" />
            </header>

            <div ref={contentRef} className="space-y-24">
              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Our Story</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed pl-8 border-l border-border/40">
                  <p>
                    CineLunatic was born from a simple idea: film lovers deserve a beautiful,
                    private space to document their cinematic journey. No ads, no distractions—just
                    you and your films.
                  </p>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">What We Believe</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed pl-8 border-l border-border/40">
                  <p>
                    We believe that every film you watch is part of your story. Whether it's a
                    masterpiece that changed your perspective or a guilty pleasure that made you
                    smile, each viewing deserves to be remembered.
                  </p>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Our Mission</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed pl-8 border-l border-border/40">
                  <p>
                    To create the most thoughtful, elegant film diary that respects your privacy
                    and celebrates your love for cinema. We're building a community of cinephiles
                    who appreciate both the art of film and the art of reflection.
                  </p>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">The Team</h2>
                <div className="space-y-6 font-mono text-sm text-muted-foreground leading-relaxed">
                  <div className="pl-8 border-l border-border/40">
                    <p>
                      Developed by <span className="font-bold text-foreground">Yaduraj Singh</span>,
                      inspired by the vision of <span className="font-bold text-foreground text-primary italic">Hakla Shahrukh</span>.
                    </p>
                    <p className="mt-4">
                      Explore the creator's space: {' '}
                      <a
                        href="https://yaduraj.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold"
                      >
                        yaduraj.me
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              <section className="group pb-20">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Get In Touch</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed pl-8 border-l border-border/40">
                  <p>
                    Have questions, suggestions, or just want to chat about films?
                    We'd love to hear from you. Reach out through our{' '}
                    <a href="/contact" className="text-primary hover:underline font-bold">contact page</a>.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </SmoothScroll>
    </Layout>
  );
}

