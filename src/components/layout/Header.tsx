import { Link, useLocation } from "react-router-dom";
import { Search, Plus, User, Film, LogOut, Bell, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getIncomingRequests } from "@/lib/db";
import { OnboardingButton } from "@/components/onboarding/OnboardingButton";
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

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
        "border-b border-border/50 shadow-sm",
        "bg-background/80 dark:bg-background/70 backdrop-blur-xl",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
      style={{
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to={user ? "/home" : "/"} className="flex items-center gap-2 group">
            <Logo className="h-7 w-7 text-foreground transition-opacity group-hover:opacity-70" />
            <span className="font-serif text-lg font-medium tracking-tight">
              CineLunatic
            </span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-3 py-1.5 text-sm transition-colors",
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <ThemeToggle />
                <OnboardingButton />
                <Link to="/search" data-onboarding="search-button">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Search className="h-4 w-4" />
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
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
