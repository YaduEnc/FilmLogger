import { Link, useLocation } from "react-router-dom";
import { Search, Plus, User, Film, LogOut, Bell, MessageCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getIncomingRequests } from "@/lib/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function Header() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll detection for hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    async function fetchRequests() {
      if (!user) return;
      try {
        const requests = await getIncomingRequests(user.uid);
        setRequestCount(requests.length);
      } catch (error) {
        console.error("Error fetching request count:", error);
      }
    }
    fetchRequests();

    // Check periodically for new requests
    const interval = setInterval(fetchRequests, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/diary", label: "Diary" },
    { href: "/community", label: "Community" },
    { href: "/lists", label: "Lists" },
    { href: "/stats", label: "Stats" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        "border-b border-white/[0.03]",
        "bg-background/80 backdrop-blur-md",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <AnimatedNoise opacity={0.02} />
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            {user && (
              <div className="md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <div className="flex flex-col gap-1.5">
                    <span className={cn("block w-5 h-0.5 bg-current transition-transform origin-center", isMobileMenuOpen && "rotate-45 translate-y-2")} />
                    <span className={cn("block w-5 h-0.5 bg-current transition-opacity", isMobileMenuOpen && "opacity-0")} />
                    <span className={cn("block w-5 h-0.5 bg-current transition-transform origin-center", isMobileMenuOpen && "-rotate-45 -translate-y-2")} />
                  </div>
                </Button>
              </div>
            )}

            {/* Logo */}
            <Link to={user ? "/home" : "/"} className="flex items-center gap-3 group relative z-10">
              <Logo className="h-6 w-6 text-foreground/80 transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
              <span className="font-serif text-xl tracking-tight hidden sm:inline-block uppercase">
                CineLunatic
              </span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          {user && (
            <nav className="hidden md:flex items-center gap-2 relative z-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 relative group",
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute bottom-0 left-4 right-4 h-[1px] bg-primary transition-transform duration-500 origin-left",
                    location.pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )} />
                </Link>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 relative z-10">
            {user ? (
              <>
                <ThemeToggle />
                <Link to="/search" data-onboarding="search-button">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/community" className="md:hidden">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Users className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bell className="h-4 w-4" />
                    {requestCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {requestCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/log" data-onboarding="log-button">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-onboarding="profile-button">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                      {user.displayName || user.email}
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/membership" className="cursor-pointer">
                        Membership
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/directors" className="cursor-pointer">
                        Directors
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/actors" className="cursor-pointer">
                        Actors
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <ThemeToggle />
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-6 font-mono text-[10px] uppercase tracking-[0.2em] border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 transition-all duration-300 rounded-none"
                  >
                    Continue your journey
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
