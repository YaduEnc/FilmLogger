import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const TVDetail = lazy(() => import("./pages/TVDetail"));
const Log = lazy(() => import("./pages/Log"));
const Diary = lazy(() => import("./pages/Diary"));
const Lists = lazy(() => import("./pages/Lists"));
const CommunityLists = lazy(() => import("./pages/CommunityLists"));
const Stats = lazy(() => import("./pages/Stats"));
const Community = lazy(() => import("./pages/Community"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const PersonDetail = lazy(() => import("./pages/PersonDetail"));
const NetworkDetail = lazy(() => import("./pages/NetworkDetail"));
const ListDetail = lazy(() => import("./pages/ListDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const Directors = lazy(() => import("./pages/Directors"));
const Actors = lazy(() => import("./pages/Actors"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const Refunds = lazy(() => import("./pages/Refunds"));
const Membership = lazy(() => import("./pages/Membership"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Admin = lazy(() => import("./pages/Admin"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Status = lazy(() => import("./pages/Status"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache time (formerly cacheTime)
      retry: 2, // Retry failed requests 2 times
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch on component mount
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HelmetProvider>
            <OnboardingProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <Suspense
                    fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    }
                  >
                    <ErrorBoundary>
                      <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/movie/:id" element={<MovieDetail />} />
                    <Route path="/tv/:id" element={<TVDetail />} />
                    <Route path="/person/:id" element={<PersonDetail />} />
                    <Route path="/network/:id" element={<NetworkDetail />} />
                    <Route path="/collection/:id" element={<CollectionDetail />} />
                    <Route path="/log" element={<Log />} />
                    <Route path="/diary" element={<Diary />} />
                    <Route path="/profile/:username/diary" element={<Diary />} />
                    <Route path="/u/:username/diary" element={<Diary />} />
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
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/refunds" element={<Refunds />} />
                    <Route path="/membership" element={<Membership />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/checkout/:planId" element={<Checkout />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-cancel" element={<PaymentCancel />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="*" element={<NotFound />} />
                      </Routes>
                    </ErrorBoundary>
                  </Suspense>
                  <OnboardingTour />
                </BrowserRouter>
              </TooltipProvider>
            </OnboardingProvider>
          </HelmetProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
