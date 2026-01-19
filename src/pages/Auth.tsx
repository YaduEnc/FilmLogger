import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "@/styles/cinematic-auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/home");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast({
        title: authMode === 'login' ? "Access Granted" : "Entry Recorded",
      });
      navigate("/home");
    } catch (error: any) {
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
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/home");
    } catch (error: any) {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/10" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black flex relative overflow-hidden selection:bg-white/10">
      {/* Film Grain Layer */}
      <div className="film-grain" aria-hidden="true" />

      {/* Backdrop Layer */}
      <div className="fixed top-0 right-0 w-full h-full lg:w-[75%] z-0 pointer-events-none overflow-hidden">
        <img
          src="/auth_poster.png"
          alt=""
          className={cn(
            "w-full h-full object-cover backdrop-poster",
            isLoaded && "loaded"
          )}
        />
        <div className="absolute inset-0 cinematic-gradient" />
      </div>

      {/* Main UI Layer */}
      <div className="relative z-10 w-full lg:w-[48%] min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20">
        <div className={cn("max-w-sm w-full auth-form-container", isLoaded && "loaded")}>

          {/* Logo / Title */}
          <div className="mb-20">
            <h2 className="serif-title text-3xl text-white/90 mb-2">CineLunatic</h2>
            <div className="flex items-center gap-4">
              <span className="w-8 h-px bg-white/10" />
              <p className="mono-detail uppercase">Archive Unit 001</p>
            </div>
          </div>

          <div className="space-y-16">
            <div className="flex items-end justify-between border-b border-white/5 pb-6">
              <div className="space-y-4">
                <h1 className="serif-title text-5xl text-white leading-[0.8]">
                  {authMode === 'login' ? "Sign In" : "Register"}
                </h1>
                <p className="text-white/30 text-[10px] font-light tracking-[0.25em] uppercase">
                  {authMode === 'login'
                    ? "Identify yourself."
                    : "Initialize identity."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[10px] mono-detail uppercase hover:text-white/80 transition-all border-b border-white/20 pb-0.5"
              >
                {authMode === 'login' ? "Create Account" : "Access Archive"}
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-10">
              {authMode === 'signup' && (
                <div className="space-y-3">
                  <Label className="mono-detail text-[9px] text-white/20 ml-1 uppercase">Identity Name</Label>
                  <Input
                    required
                    placeholder="ENTER NAME"
                    className="minimal-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-3">
                <Label className="mono-detail text-[9px] text-white/20 ml-1 uppercase">Archive Email</Label>
                <Input
                  required
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="minimal-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label className="mono-detail text-[9px] text-white/20 ml-1 uppercase">Secure Cipher</Label>
                <Input
                  required
                  type="password"
                  placeholder="PASSWORD"
                  className="minimal-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-6 flex flex-col gap-10">
                <div className="flex items-center gap-6">
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-fit p-0 h-auto hover:bg-transparent text-white/80 hover:text-white transition-all serif-title text-2xl flex items-center gap-6 group"
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        {authMode === 'login' ? "Enter Archive" : "Begin Journey"}
                        <ArrowRight className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-all transform group-hover:translate-x-3" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-12">
                  <div className="flex items-center gap-3 group cursor-pointer" onClick={handleGoogleSignIn}>
                    <div className="w-5 h-5 flex items-center justify-center border border-white/10 rounded-full group-hover:border-white/30 transition-colors">
                      <svg className="h-2.5 w-2.5 text-white/40 group-hover:text-white/80 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <span className="text-[10px] mono-detail uppercase group-hover:text-white/80 transition-colors">Cloud Sync</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-32 pt-10 border-t border-white/5">
            <Link to="/" className="text-[10px] items-center gap-3 mono-detail uppercase hover:text-white/80 transition-colors inline-flex group">
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-2" />
              Return to Void
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
