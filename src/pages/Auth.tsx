import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { H2 } from "@/components/ui/typography";
import { Film, ArrowLeft, Loader2, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getTrendingMovies } from "@/lib/tmdb";
import { Movie } from "@/types/movie";
import { Logo } from "@/components/layout/Logo";

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [backdropMovie, setBackdropMovie] = useState<Movie | null>(null);

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
          // Pick a random movie from trending for the backdrop
          const randomMovie = movies[Math.floor(Math.random() * Math.min(movies.length, 10))];
          setBackdropMovie(randomMovie);
        }
      } catch (error) {
        console.error("Failed to fetch auth backdrop:", error);
      }
    }
    fetchBackdrop();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast({
        title: authMode === 'login' ? "Welcome back!" : "Welcome to the Archive!",
        description: `Successfully signed in with Google.`,
      });
      navigate("/home");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Authentication failed",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Left panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 z-10 relative">
        <div className="max-w-sm w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-12 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Return to Archive
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-foreground/5 rounded-xl backdrop-blur-sm border border-foreground/10">
              <Logo className="h-6 w-6 text-foreground" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">CineLunatic</span>
          </div>

          {/* Form Card */}
          <div className="bg-foreground/[0.02] backdrop-blur-3xl rounded-3xl p-8 border border-foreground/10 shadow-2xl shadow-black/5">
            <div className="flex gap-4 mb-8 p-1 bg-foreground/5 rounded-xl overflow-hidden">
              <button
                onClick={() => setAuthMode('signup')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  authMode === 'signup' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign Up
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  authMode === 'login' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Login
              </button>
            </div>

            <h1 className="text-4xl font-serif font-bold mb-3 tracking-tight animate-in fade-in slide-in-from-left-4 duration-500" key={authMode}>
              {authMode === 'signup' ? "Create your diary" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground/80 mb-10 font-medium leading-relaxed h-12">
              {authMode === 'signup'
                ? "Start logging the films you love. Join our community of cinephiles."
                : "The archive is waiting. Sign in to continue your cinema journey."}
            </p>

            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full py-7 flex items-center justify-center gap-4 border-foreground/10 hover:bg-foreground/5 hover:border-foreground/20 transition-all rounded-2xl group active:scale-[0.98]"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    className="opacity-80"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    className="opacity-70"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    className="opacity-90"
                  />
                </svg>
              )}
              <span className="font-bold text-base tracking-tight">Continue with Google</span>
            </Button>

            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40 text-center leading-relaxed max-w-[240px]">
                Secure authentication via Google Cloud Identity
              </p>
            </div>
          </div>

          <p className="mt-12 text-[10px] text-center text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-widest">
            By continuing, you agree to our <br />
            <Link to="/terms" className="text-foreground/80 hover:text-primary transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-foreground/80 hover:text-primary transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Right panel - Dynamic Cinematic Backdrop */}
      <div className="hidden lg:flex lg:flex-1 relative items-center justify-center p-20 overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0">
          {backdropMovie?.backdropUrl ? (
            <>
              <img
                src={backdropMovie.backdropUrl}
                alt=""
                className="w-full h-full object-cover scale-110 blur-sm animate-in fade-in zoom-in-110 duration-[2000ms]"
              />
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>

        <div className="max-w-lg text-center relative z-10 animate-in fade-in slide-in-from-right-12 duration-1000">
          <Quote className="h-10 w-10 text-primary/40 mx-auto mb-8 animate-pulse" />
          <blockquote className="font-serif text-3xl md:text-5xl leading-[1.15] italic font-bold text-foreground mb-10 tracking-tight">
            "{backdropMovie?.title ? `Cinema is ${backdropMovie.title} and ${backdropMovie.title} is cinema.` : "Cinema is the most beautiful fraud in the world."}"
          </blockquote>
          <div className="flex flex-col items-center gap-2">
            <div className="h-px w-12 bg-primary/40" />
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/80">
              {backdropMovie?.title || "Jean-Luc Godard"}
            </p>
          </div>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute bottom-10 right-10 flex gap-4 opacity-20 transform rotate-90 origin-bottom-right">
          <span className="text-[10px] font-bold tracking-[1em] uppercase">Visual Archive</span>
        </div>
      </div>
    </div>
  );
}
