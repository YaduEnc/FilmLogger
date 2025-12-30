import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import TVDetail from "./pages/TVDetail";
import Log from "./pages/Log";
import Diary from "./pages/Diary";
import Lists from "./pages/Lists";
import CommunityLists from "./pages/CommunityLists";
import Stats from "./pages/Stats";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import PersonDetail from "./pages/PersonDetail";
import NetworkDetail from "./pages/NetworkDetail";
import ListDetail from "./pages/ListDetail";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Directors from "./pages/Directors";
import Actors from "./pages/Actors";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Refunds from "./pages/Refunds";
import Membership from "./pages/Membership";
import Admin from "./pages/Admin";
import Announcements from "./pages/Announcements";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Analytics />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/tv/:id" element={<TVDetail />} />
                <Route path="/person/:id" element={<PersonDetail />} />
                <Route path="/network/:id" element={<NetworkDetail />} />
                <Route path="/log" element={<Log />} />
                <Route path="/diary" element={<Diary />} />
                <Route path="/lists" element={<Lists />} />
                <Route path="/lists/community" element={<CommunityLists />} />
                <Route path="/lists/:userId/:listId" element={<ListDetail />} />
                <Route path="/list/:userId/:listId" element={<ListDetail />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/community" element={<Community />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/directors" element={<Directors />} />
                <Route path="/actors" element={<Actors />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/refunds" element={<Refunds />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/checkout/:planId" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <OnboardingTour />
            </BrowserRouter>
          </TooltipProvider>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
