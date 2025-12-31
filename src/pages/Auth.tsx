import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft, Loader2, Quote, ArrowRight, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getTrendingMovies } from "@/lib/tmdb";
import { Movie } from "@/types/movie";
import { Logo } from "@/components/layout/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import gsap from "gsap";

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [backdropMovie, setBackdropMovie] = useState<Movie | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const formRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/home");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchBackdrop() {
      try {
        const { movies } = await getTrendingMovies(1, 'week');
        if (movies.length > 0) {
          const randomMovie = movies[Math.floor(Math.random() * Math.min(movies.length, 10))];
          setBackdropMovie(randomMovie);
        }
      } catch (error) {
        console.error("Failed to fetch auth backdrop:", error);
      }
    }
    fetchBackdrop();
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entry animation for the container
      gsap.fromTo(".auth-panel-left",
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.2, ease: "expo.out" }
      );

      gsap.fromTo(".auth-panel-right",
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 2, ease: "power2.out" }
      );

      // Stagger elements in the form
      gsap.fromTo(".auth-stagger",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate form on mode switch
  useEffect(() => {
    gsap.fromTo(".form-content",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, [authMode]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast({
        title: authMode === 'login' ? "Access Granted" : "Entry Recorded",
        description: `Your identity has been verified via Google.`,
      });
      navigate("/home");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not synchronize with the archive.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (authMode === 'signup' && !displayName)) {
      toast({
        title: "Incomplete Protocol",
        description: "All authentication fields are mandatory.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password, displayName);
        toast({
          title: "Archive Initialized",
          description: "Your cinematic profile has been created.",
        });
      } else {
        await signInWithEmail(email, password);
        toast({
          title: "Session Restored",
          description: "Welcome back to the collection.",
        });
      }
      navigate("/home");
    } catch (error: any) {
      console.error(error);
      toast({
        title: authMode === 'signup' ? "Initialization Failed" : "Access Denied",
        description: error.message || "An unexpected error occurred during verification.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex overflow-hidden selection:bg-primary/30">
      {/* Universal Background Layer */}
      <div className="grid-bg fixed inset-0 opacity-20 pointer-events-none" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />

      {/* Left panel - The Portal */}
      <div className="auth-panel-left flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 z-10 relative bg-background/40 backdrop-blur-sm sm:border-r border-border/10 overflow-y-auto min-h-screen">
        <div className="max-w-md w-full mx-auto py-12">
          {/* Back link */}
          <Link
            to="/"
            className="auth-stagger inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.4em] text-muted-foreground hover:text-primary mb-12 transition-all group"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Return
          </Link>

          {/* Logo Header */}
          <div className="auth-stagger flex items-center gap-4 mb-12">
            <div className="p-3 bg-foreground/5 border border-border/20 rounded-sm">
              <Logo className="h-6 w-6 text-foreground" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tighter uppercase leading-none">CineLunatic</span>
          </div>

          {/* Form Container */}
          <div className="auth-stagger relative">
            {/* Mode Switcher */}
            <div className="flex gap-0 mb-8 border-b border-border/10">
              <button
                onClick={() => setAuthMode('signup')}
                className={cn(
                  "pb-4 px-6 text-[10px] font-mono uppercase tracking-[0.3em] transition-all relative",
                  authMode === 'signup' ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                Sign Up
                {authMode === 'signup' && <div className="absolute bottom-[-1px] left-0 w-full h-px bg-primary" />}
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={cn(
                  "pb-4 px-6 text-[10px] font-mono uppercase tracking-[0.3em] transition-all relative",
                  authMode === 'login' ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                Login
                {authMode === 'login' && <div className="absolute bottom-[-1px] left-0 w-full h-px bg-primary" />}
              </button>
            </div>

            <div className="form-content">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tighter uppercase mb-2">
                {authMode === 'signup' ? "Initiate" : "Restore"} <span className="italic text-primary">Access</span>
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest leading-relaxed mb-10">
                {authMode === 'signup' ? "Begin your archival journey." : "Reconnect with your history."}
              </p>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                {authMode === 'signup' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground ml-1">Identity</Label>
                    <Input
                      required
                      placeholder="NAME"
                      className="h-12 bg-transparent border-border/10 rounded-none focus:border-primary/50 transition-all font-mono text-xs tracking-widest placeholder:text-muted-foreground/20"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground ml-1">Email</Label>
                  <Input
                    required
                    type="email"
                    placeholder="EMAIL@ARCHIVE.COM"
                    className="h-12 bg-transparent border-border/10 rounded-none focus:border-primary/50 transition-all font-mono text-xs tracking-widest placeholder:text-muted-foreground/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground ml-1">Password</Label>
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="h-12 bg-transparent border-border/10 rounded-none focus:border-primary/50 transition-all font-mono text-xs tracking-widest placeholder:text-muted-foreground/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[10px] uppercase tracking-[0.4em] rounded-none group relative overflow-hidden mt-4"
                  disabled={isSigningIn}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSigningIn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {authMode === 'signup' ? "Initialize" : "Authenticate"}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-2" />
                      </>
                    )}
                  </span>
                </Button>
              </form>

              {/* OAuth Section */}
              <div className="mt-12 pt-8 border-t border-border/10">
                <Button
                  variant="outline"
                  className="w-full h-12 flex items-center justify-center gap-4 border-border/10 rounded-none font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-foreground/[0.02] group"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  type="button"
                >
                  <svg className="h-4 w-4 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Sync
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="auth-stagger mt-12 pt-8 border-t border-border/10 flex flex-col items-center gap-6">
            <p className="text-[9px] text-center text-muted-foreground/30 leading-relaxed font-mono uppercase tracking-[0.4em]">
              Agree to <Link to="/terms" className="text-muted-foreground/60 hover:text-primary transition-colors">terms</Link> & <Link to="/privacy" className="text-muted-foreground/60 hover:text-primary transition-colors">privacy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Cinematic Immersion */}
      <div className="auth-panel-right hidden lg:flex lg:flex-1 relative items-center justify-center p-24 overflow-hidden bg-black">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0">
          {backdropMovie?.backdropUrl ? (
            <>
              <img
                src={backdropMovie.backdropUrl}
                alt=""
                className="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay scale-100 animate-in fade-in zoom-in-110 duration-[3000ms]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/20" />
              <div className="absolute inset-0 bg-radial-vignette opacity-80" />
            </>
          ) : (
            <div className="w-full h-full bg-neutral-900 grid-bg opacity-10" />
          )}
        </div>

        {/* Content Overlay */}
        <div className="max-w-xl text-center relative z-10">
          <Quote className="h-12 w-12 text-primary/30 mx-auto mb-12 animate-pulse" />
          <blockquote className="font-serif text-4xl md:text-6xl leading-[1.05] italic font-bold text-white mb-16 tracking-tighter uppercase">
            "{backdropMovie?.title
              ? `Cinema is ${backdropMovie.title} and ${backdropMovie.title} is cinema.`
              : "Realism is a corruption of the true cinema."}"
          </blockquote>

          <div className="inline-flex flex-col items-center gap-6">
            <div className="w-16 h-px bg-primary/40" />
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.6em] text-white/40">
                Source Identification
              </p>
              <p className="font-serif text-xl italic text-white/90 mt-2">
                {backdropMovie?.title || "Jean-Luc Godard"}
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Identifier */}
        <div className="absolute bottom-12 right-12 flex gap-4 opacity-10 transform rotate-90 origin-bottom-right">
          <span className="font-mono text-[9px] font-bold tracking-[1.5em] uppercase text-white whitespace-nowrap">
            VISUAL ARCHIVE UNIT / 001
          </span>
        </div>

        {/* Top Edge Detail */}
        <div className="absolute top-12 left-12 flex items-center gap-4 opacity-10">
          <div className="w-8 h-px bg-white" />
          <span className="font-mono text-[8px] uppercase tracking-[1em] text-white">Live Sync Active</span>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
