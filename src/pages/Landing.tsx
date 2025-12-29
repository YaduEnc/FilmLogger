import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { H1, Lead, H3 } from "@/components/ui/typography";
import { Divider } from "@/components/ui/divider";
import { Film, ArrowRight, Star } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { PricingSection } from "@/components/home/PricingSection";
import { getTrendingMovies } from "@/lib/tmdb";
import { getRecentActivities } from "@/lib/db";
import { Movie, UserActivity } from "@/types/movie";
import { formatDistanceToNow } from "date-fns";



export default function Landing() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ movies }, recentActivities] = await Promise.all([
          getTrendingMovies(1, 'week'),
          getRecentActivities(20)
        ]);
        setTrendingMovies(movies.slice(0, 15));
        // Filter for high quality activities with reviews/titles
        const filtered = (recentActivities as UserActivity[]).filter(a => (a.type === 'log' || a.type === 'review') && (a.reviewText || a.movieTitle));
        setActivities(filtered.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch landing data:", error);
      }
    }
    fetchData();
  }, []);

  // Auto-rotate reviews every 2 seconds
  useEffect(() => {
    if (activities.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % activities.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [activities.length]);

  const heroMovies = trendingMovies.slice(0, 12);
  const diaryMovies = trendingMovies.slice(0, 3);
  const featuredReview = activities[currentReviewIndex];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative container mx-auto px-6 py-24 md:py-40 overflow-hidden min-h-[80vh] flex items-center">
        {/* Hero Background Grid - Moved inside for relative positioning */}
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 opacity-[0.15] scale-110 rotate-6 -translate-y-20">
            {heroMovies.length > 0 ? heroMovies.map((movie, i) => (
              <div key={movie.id} className={cn(
                "aspect-[2/3] relative rounded-xl overflow-hidden bg-muted/20 animate-in fade-in duration-1000 border border-foreground/5 shadow-2xl",
                i % 2 === 0 ? "translate-y-24" : "translate-y-0"
              )}>
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )) : (
              // Skeletal placeholders if loading
              Array(12).fill(0).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-muted/10 animate-pulse" />
              ))
            )}
          </div>
          {/* Gradients to fade edges */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] -z-10" />

        {/* Grain Overlay Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 text-muted-foreground/60 mb-8">
            <div className="p-2 bg-foreground/5 rounded-lg backdrop-blur-sm border border-foreground/10">
              <Logo className="h-5 w-5 text-foreground/80" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">The Premier Cinema Archive</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-serif font-bold mb-8 leading-[1.1] tracking-tight">
            A quiet place to <br />
            <span className="text-primary italic">keep</span> your films.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-xl leading-relaxed font-medium">
            Log what you watch. Write about what moves you. <br className="hidden md:block" />
            Build a personal archive that grows with your cinema journey.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/auth">
              <Button size="lg" className="h-16 px-10 gap-3 text-base font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-[0.98] group rounded-2xl bg-primary hover:bg-primary/90">
                Continue your journey
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Divider className="container mx-auto opacity-50" />

      {/* Preview - Visual Diary */}
      <section className="container mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <Badge variant="outline" className="mb-6 border-foreground/10 text-muted-foreground tracking-[0.2em] font-bold uppercase text-[9px]">
              The Visual Diary
            </Badge>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 tracking-tight">
              Keep a journal that <br />
              <span className="text-primary italic">actually</span> looks good.
            </h2>
            <div className="space-y-6">
              {(diaryMovies.length > 0 ? diaryMovies : [
                { id: 1, title: "Persona", year: 1966, director: "Ingmar Bergman", posterUrl: "https://image.tmdb.org/t/p/w500/8tSOTBvunr8R4fO74vny876pX6I.jpg" },
                { id: 2, title: "In the Mood for Love", year: 2000, director: "Wong Kar-wai", posterUrl: "https://image.tmdb.org/t/p/w500/i96Uq9P9SBr49vIbpOFvtCisD6V.jpg" },
                { id: 3, title: "Stalker", year: 1979, director: "Andrei Tarkovsky", posterUrl: "https://image.tmdb.org/t/p/w500/7I9mK52gEre2KInIbaV6c659K3V.jpg" },
              ]).map((movie, i) => (
                <div
                  key={movie.id || movie.title}
                  className={cn(
                    "group flex items-center gap-6 p-4 rounded-xl hover:bg-foreground/[0.02] transition-colors border border-transparent hover:border-border/40",
                    i === 0 ? "opacity-100" : i === 1 ? "opacity-80" : "opacity-60"
                  )}
                >
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  <div>
                    <h4 className="text-lg font-bold flex items-baseline gap-2">
                      {movie.title}
                      <span className="text-sm font-medium text-muted-foreground/50">{movie.year}</span>
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">
                      {movie.director ? `Dir. ${movie.director}` : "Trending Now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-3xl -z-10" />
            <div
              key={featuredReview?.id || currentReviewIndex}
              className="bg-background/40 backdrop-blur-2xl rounded-2xl p-10 border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-right-4 duration-700 h-full flex flex-col"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/20 border border-primary/20">
                  {featuredReview?.userPhoto ? (
                    <img src={featuredReview.userPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.1em]">{featuredReview?.userName || "Anonymous"}'s Entry</p>
                  <p className="text-xs text-muted-foreground">
                    {featuredReview?.createdAt ? formatDistanceToNow(new Date(featuredReview.createdAt), { addSuffix: true }) : "Recent activity"}
                  </p>
                </div>
              </div>
              <blockquote className="font-serif text-2xl md:text-3xl leading-relaxed italic text-foreground/90 mb-10 line-clamp-4">
                "{featuredReview?.reviewText || featuredReview?.movieTitle || "Exploring the depths of world cinema, one archive at a time."}"
              </blockquote>
              <div className="flex items-center justify-between pt-8 border-t border-border/40">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-4 w-4",
                        s <= (featuredReview?.rating || 5) ? "fill-primary text-primary" : "text-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
                <div className="text-[10px] items-center gap-2 flex font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="h-1 w-1 rounded-full bg-primary/40" />
                  {featuredReview?.movieTitle || "Cinema Corner"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer CTA */}
      <section className="relative container mx-auto px-6 py-32 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <H3 className="text-3xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
            The archive is <br className="md:hidden" /> <span className="text-primary italic">waiting</span> for you.
          </H3>
          <p className="text-muted-foreground/80 mb-10 text-lg font-medium">
            Free to use. No ads. Just you and your collection. <br className="hidden md:block" />
            Join our community of cinephiles today.
          </p>
          <Link to="/home">
            <Button size="lg" className="h-14 px-12 text-base font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
              Join the Archive
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-foreground/5 rounded-md border border-foreground/10">
                  <Logo className="h-5 w-5" />
                </div>
                <span className="font-serif text-lg font-bold tracking-tight">CineLunatic</span>
              </div>
              <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-sm font-medium">
                A quiet corner for film lovers to document their journey through cinema.
                Built with respect for the art of film and those who archive it.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><Link to="/about" className="hover:text-primary transition-colors">The Manifesto</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Field Notes</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Catalog Search</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
              © {new Date().getFullYear()} CineLunatic Archive / v1.2.0
            </p>
            <div className="flex items-center gap-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
                Curated by <span className="text-foreground/80">Yaduraj Singh</span>
              </p>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
                Inspired by <span className="text-foreground/80">Hakla Shahrukh</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
