import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2, H3, DisplayH2, DisplayH3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { PopularSection } from "@/components/movies/PopularSection";
import { UpcomingReleases } from "@/components/movies/UpcomingReleases";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { SocialRecommendationsSection } from "@/components/home/SocialRecommendationsSection";
import { Divider } from "@/components/ui/divider";
import { Plus, Search, Clock, Film, Loader2, Tv, Clapperboard, TrendingUp, Star, Calendar, ChevronLeft, ChevronRight, Play, Info, Megaphone, ArrowRight, Newspaper, User } from "lucide-react";
import gsap from "gsap";
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";
import { LogEntry, Movie, Announcement, SocialRecommendations } from "@/types/movie";
import {
  getTrendingMovies,
  getPopularMovies,
  getTrendingAll,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
  getMovieDetails,
  getTVDetails,
  getTrendingBollywood,
  getBollywoodMovies,
  getHollywoodMovies
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserLogs,
  getUserLists,
  getActiveAnnouncements,
  getUserFriends,
  getFriendActivityForMedia,
  getSocialMovieRecommendations
} from "@/lib/db";
import { cn } from "@/lib/utils";

// Horizontal Scroll Component
const HorizontalScroll = ({ children, title, link }: { children: React.ReactNode; title: string; link?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [children]);

  return (
    <div className="mb-20 group/scroll">
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-3xl sm:text-[2.1rem] font-bold tracking-tight uppercase">{title}</h2>
        </div>
        {link && (
          <Link to={link}>
            <Button variant="ghost" size="sm" className="h-8 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/56 hover:text-primary hover:bg-transparent transition-all group/btn">
              Explore Collection
            </Button>
          </Link>
        )}
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {React.Children.map(children, (child, index) => (
            <div className="flex-none transition-all duration-500 hover:scale-[1.02]">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Cache for home page data to prevent refetching on navigation
const HOME_CACHE_STALE_TIME = 1000 * 60 * 5;
const homeDataCache = new Map<string, { data: any; timestamp: number }>();
const getMediaActivityKey = (movie: Movie) => `${movie.mediaType || 'movie'}_${movie.id}`;
const shelfCardWidthClass = "w-[152px] sm:w-[168px] lg:w-[176px]";

export default function Home() {
  const { user } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [friendActivity, setFriendActivity] = useState<Record<string, any[]>>({});
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<Movie[]>([]);
  const [onTheAirTV, setOnTheAirTV] = useState<Movie[]>([]);
  const [trendingAll, setTrendingAll] = useState<Movie[]>([]);
  const [trendingBollywood, setTrendingBollywood] = useState<Movie[]>([]);
  const [popularBollywood, setPopularBollywood] = useState<Movie[]>([]);
  const [popularHollywood, setPopularHollywood] = useState<Movie[]>([]);
  const [trendingTimeWindow, setTrendingTimeWindow] = useState<'day' | 'week'>('day');
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [socialRecommendations, setSocialRecommendations] = useState<SocialRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const castRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const cacheKey = `${user?.uid || 'anonymous'}:home`;
      const cachedEntry = homeDataCache.get(cacheKey);

      // Check cache first - avoid refetch if data is fresh
      const now = Date.now();
      const cacheAge = cachedEntry ? now - cachedEntry.timestamp : Number.POSITIVE_INFINITY;
      const isCacheValid = cachedEntry && cacheAge < HOME_CACHE_STALE_TIME;

      if (isCacheValid) {
        // Use cached data immediately
        const cached = cachedEntry.data;
        setFeaturedMovies(cached.featuredMovies);
        setPopularMovies(cached.popularMovies);
        setTopRatedMovies(cached.topRatedMovies);
        setPopularTV(cached.popularTV);
        setTopRatedTV(cached.topRatedTV);
        setOnTheAirTV(cached.onTheAirTV);
        setTrendingAll(cached.trendingAll);
        setTrendingBollywood(cached.trendingBollywood);
        setPopularBollywood(cached.popularBollywood);
        setPopularHollywood(cached.popularHollywood);
        setAnnouncements(cached.announcements);
        setRecentLogs(cached.recentLogs || []);
        setFriendActivity(cached.friendActivity || {});
        setSocialRecommendations(cached.socialRecommendations || null);
        setIsLoading(false);
        // Background refetch if cache is getting stale (50% of stale time)
        if (cacheAge > HOME_CACHE_STALE_TIME / 2) {
          // Continue to load fresh data in background
        } else {
          return; // Cache is fresh, skip refetch
        }
      }

      setIsLoading(true);
      try {
        const [
          trendingMoviesData,
          popularMoviesData,
          popularTVData,
          topRatedTVData,
          onTheAirTVData,
          trendingAllData,
          trendingBollywoodData,
          popularBollywoodData,
          popularHollywoodData
        ] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies(),
          getPopularTV(),
          getTopRatedTV(),
          getOnTheAirTV(),
          getTrendingAll(1, trendingTimeWindow),
          getTrendingBollywood('week'),
          getBollywoodMovies(),
          getHollywoodMovies()
        ]);

        const featuredBasic = trendingMoviesData.movies
          .filter(m => m.backdropUrl)
          .slice(0, 5);

        // Fetch full details for featured to get credits
        const featuredFull = await Promise.all(
          featuredBasic.map(async (m) => {
            try {
              if (m.mediaType === 'tv') {
                return await getTVDetails(m.id);
              }
              return await getMovieDetails(m.id);
            } catch (e) {
              return m;
            }
          })
        );
        setFeaturedMovies(featuredFull);

        setPopularMovies(popularMoviesData.movies.slice(0, 12));
        setTopRatedMovies(popularMoviesData.movies.slice(12, 24));
        setPopularTV(popularTVData.movies.slice(0, 12));
        setTopRatedTV(topRatedTVData.movies.slice(0, 12));
        setOnTheAirTV(onTheAirTVData.movies.slice(0, 12));
        setTrendingAll(trendingAllData.movies.slice(0, 15));
        setTrendingBollywood(trendingBollywoodData.movies.slice(0, 12));
        setPopularBollywood(popularBollywoodData.movies.slice(0, 12));
        setPopularHollywood(popularHollywoodData.movies.slice(0, 12));

        const announcementsData = await getActiveAnnouncements(5);
        setAnnouncements(announcementsData as Announcement[]);

        let recentLogsData: LogEntry[] = [];
        let activityMapData: Record<string, any[]> = {};
        let recommendationData: SocialRecommendations | null = null;

        if (user) {
          const [fetchedLogs, friends, socialData] = await Promise.all([
            getUserLogs(user.uid, { limitCount: 50 }),
            getUserFriends(user.uid),
            getSocialMovieRecommendations(user.uid, 6)
          ]);
          recentLogsData = fetchedLogs.slice(0, 5);
          setRecentLogs(recentLogsData);
          recommendationData = socialData;
          setSocialRecommendations(socialData);

          const featuredActivity = await getFriendActivityForMedia(
            (friends as any[]).map((friend) => friend.uid),
            featuredFull.map((movie) => ({
              id: movie.id,
              mediaType: movie.mediaType || 'movie'
            })),
            user.uid
          );

          const friendMap = new Map((friends as any[]).map((friend) => [friend.uid, friend]));
          Object.entries(featuredActivity).forEach(([mediaKey, friendIds]) => {
            activityMapData[mediaKey] = friendIds
              .map((friendId) => friendMap.get(friendId))
              .filter(Boolean);
          });

          setFriendActivity(activityMapData);
        }

        // Update cache
        homeDataCache.set(cacheKey, {
          data: {
          featuredMovies: featuredFull,
          popularMovies: popularMoviesData.movies.slice(0, 12),
          topRatedMovies: popularMoviesData.movies.slice(12, 24),
          popularTV: popularTVData.movies.slice(0, 12),
          topRatedTV: topRatedTVData.movies.slice(0, 12),
          onTheAirTV: onTheAirTVData.movies.slice(0, 12),
          trendingAll: trendingAllData.movies.slice(0, 15),
          trendingBollywood: trendingBollywoodData.movies.slice(0, 12),
          popularBollywood: popularBollywoodData.movies.slice(0, 12),
          popularHollywood: popularHollywoodData.movies.slice(0, 12),
          announcements: announcementsData as Announcement[],
          recentLogs: recentLogsData,
          friendActivity: activityMapData,
          socialRecommendations: recommendationData,
          },
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Effect to load trending data on toggle
  useEffect(() => {
    async function loadTrending() {
      setIsTrendingLoading(true);
      try {
        const { movies } = await getTrendingAll(1, trendingTimeWindow);
        setTrendingAll(movies.slice(0, 15));
      } catch (err) {
        console.error("Failed to update trending:", err);
      } finally {
        setIsTrendingLoading(false);
      }
    }

    if (!isLoading) {
      loadTrending();
    }
  }, [trendingTimeWindow]);

  // Content change animation
  useEffect(() => {
    if (!heroContentRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      const elements = heroContentRef.current?.querySelectorAll(".hero-animate");
      if (elements) {
        gsap.fromTo(elements,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: "expo.out",
            overwrite: true
          }
        );
      }

      if (castRef.current) {
        const castItems = castRef.current.querySelectorAll(".cast-animate");
        gsap.fromTo(castItems,
          { x: 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.4,
            overwrite: true
          }
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, [currentFeaturedIndex, isLoading]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const nextFeatured = () => {
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  const prevFeatured = () => {
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const currentFeatured = featuredMovies[currentFeaturedIndex];
  const currentMovieFriends = currentFeatured ? (friendActivity[getMediaActivityKey(currentFeatured)] || []) : [];

  return (
    <Layout>
      <div className="relative min-h-screen">
        <AnimatedNoise opacity={0.02} />
        {/* Hero Section with Cinematic Spotlight Layout */}
        {currentFeatured && !isLoading && (
          <div ref={heroRef} className="hero-section relative w-full h-[550px] sm:h-[75vh] min-h-[500px] mb-20 overflow-hidden group">
            <AnimatedNoise opacity={0.03} />

            {/* Backdrop Image with Ken Burns Effect */}
            <div
              key={`backdrop-${currentFeatured.id}`}
              className="absolute inset-0 bg-cover bg-center transition-all [transition-duration:6000ms] ease-out scale-100"
              style={{
                backgroundImage: `url(${currentFeatured.backdropUrl})`,
              }}
            />

            {/* Multi-layered Gradients for Adaptive Visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 z-0" />

            {/* Grid Overlay to match landing page */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
              style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Vertical Segmented Indicators */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-4">
              {featuredMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeaturedIndex(index)}
                  className={cn(
                    "w-1 transition-all duration-700",
                    index === currentFeaturedIndex
                      ? "h-16 bg-primary"
                      : "h-2 bg-white/10 hover:bg-white/30"
                  )}
                />
              ))}
            </div>

            {/* Main Content Area */}
            <div className="relative container mx-auto px-6 h-full flex flex-col justify-end pb-12 sm:pb-20 z-20">
              <div className="grid md:grid-cols-[1fr_auto] gap-16 items-end">
                <div ref={heroContentRef} className="max-w-4xl">
                  {/* Upper Metadata */}
                  <div className="flex flex-wrap items-center gap-6 mb-8 hero-animate">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold px-4 py-1.5 border border-primary/20 bg-primary/5 rounded-none">
                      {currentFeatured.mediaType === 'tv' ? 'Series' : 'Film'}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em]">{currentFeatured.imdbRating || currentFeatured.rating?.toFixed(1)}</span>
                    </div>
                    {currentFeatured.awards && currentFeatured.awards !== "N/A" && (
                      <div className="hidden sm:flex items-center px-4 py-1.5 border border-[#f5c518]/20 bg-[#f5c518]/5">
                        <span className="font-mono text-[9px] font-bold text-[#f5c518] uppercase tracking-[0.2em] leading-none">
                          {currentFeatured.awards}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cinematic Title */}
                  <h1 className="hero-animate font-serif text-5xl sm:text-6xl md:text-[6rem] font-black mb-10 leading-[0.85] tracking-tighter uppercase">
                    {currentFeatured.title}
                  </h1>

                  {/* Sub-info Row */}
                  <div className="flex flex-wrap items-center gap-12 mb-12 hero-animate">
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/50">Year</span>
                      <span className="font-mono text-xl font-bold tracking-tighter">{currentFeatured.year}</span>
                    </div>
                    {currentFeatured.runtime && (
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/50">Runtime</span>
                        <span className="font-mono text-xl font-bold tracking-tighter">{currentFeatured.runtime} MIN</span>
                      </div>
                    )}

                    {/* Social Badge */}
                    {currentMovieFriends.length > 0 && (
                      <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                        <div className="flex -space-x-3">
                          {currentMovieFriends.slice(0, 3).map((friend: any) => (
                            <img
                              key={friend.uid}
                              src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`}
                              className="h-9 w-9 rounded-none border border-background grayscale hover:grayscale-0 transition-all duration-500"
                              alt=""
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
                          {currentMovieFriends.length === 1
                            ? `Archived by ${currentMovieFriends[0].displayName?.split(' ')[0]}`
                            : `Archived by ${currentMovieFriends[0].displayName?.split(' ')[0]} & others`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-6 hero-animate">
                    <Link to={`/${currentFeatured.mediaType || 'movie'}/${currentFeatured.id}`}>
                      <Button
                        variant="outline"
                        className="h-14 px-10 gap-4 font-mono text-xs uppercase tracking-[0.3em] border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all duration-500 rounded-none"
                      >
                        Explore Movie
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/log?movie=${currentFeatured.id}&type=${currentFeatured.mediaType || 'movie'}`}>
                      <Button
                        variant="outline"
                        className="h-14 px-8 gap-3 font-mono text-xs uppercase tracking-[0.3em] border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all duration-500 rounded-none"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Diary
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Cinematic Profiles */}
                <div ref={castRef} className="hidden lg:flex flex-col gap-12 max-w-[320px] pb-4">
                  {/* Director Profile */}
                  {currentFeatured.director && (
                    <div className="cast-animate group/dir">
                      <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-primary/60 mb-3 block">Director</span>
                      <div className="flex items-center gap-5">
                        <div className="h-20 w-16 bg-muted/20 border border-white/5 overflow-hidden transition-all duration-700 group-hover/dir:border-primary/40">
                          {currentFeatured.castMembers?.find(c => c.name === currentFeatured.director)?.profileUrl ? (
                            <img
                              src={currentFeatured.castMembers.find(c => c.name === currentFeatured.director)?.profileUrl}
                              alt={currentFeatured.director}
                              className={cn(
                                "w-full h-full object-cover transition-all [transition-duration:1500ms] ease-out",
                                "scale-100 grayscale-[0.4] group-hover/dir:scale-110 group-hover/dir:grayscale-0"
                              )}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted/10">
                              <User className="h-8 w-8 text-muted-foreground/20" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-foreground leading-tight tracking-tighter uppercase whitespace-pre-wrap">{currentFeatured.director}</h3>
                      </div>
                    </div>
                  )}

                  {/* Top Cast List */}
                  <div className="cast-animate space-y-8">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground/40 whitespace-nowrap text-center w-full">Top Credits</span>
                    </div>

                    <div className="space-y-6">
                      {currentFeatured.castMembers?.slice(0, 3).map((actor) => (
                        <div key={actor.id} className="group/actor flex items-center gap-5 transition-all hover:translate-x-2">
                          <div className="h-14 w-11 bg-muted/10 border border-white/5 overflow-hidden shrink-0 transition-all duration-500 group-hover/actor:border-primary/40">
                            {actor.profileUrl ? (
                              <img src={actor.profileUrl} alt={actor.name} className="h-full w-full object-cover grayscale group-hover/actor:grayscale-0 transition-all duration-700" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground/20" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-foreground group-hover/actor:text-primary transition-colors">{actor.name}</span>
                            <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest truncate mt-0.5">{actor.character}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Pagination Indicators - Bottom mobile version */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex md:hidden gap-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeaturedIndex(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === currentFeaturedIndex ? "w-8 bg-primary" : "w-1.5 bg-white/20"
              )}
            />
          ))}
        </div>


        <div className="container mx-auto px-6 py-12">
          {/* Unified Trending Section with Filter */}
          {!isLoading && trendingAll.length > 0 && (
            <div className="mb-20">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-4">
                <div className="flex flex-col gap-2">
                  <h2 className="font-serif text-3xl sm:text-[2.1rem] font-bold tracking-tight uppercase">Trending</h2>
                </div>

                {/* Premium Toggle Filter */}
                <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-none scale-90 sm:scale-100 origin-left">
                  <button
                    onClick={() => setTrendingTimeWindow('day')}
                    className={cn(
                      "px-6 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500",
                      trendingTimeWindow === 'day'
                        ? "bg-primary text-black font-black"
                        : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTrendingTimeWindow('week')}
                    className={cn(
                      "px-6 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500",
                      trendingTimeWindow === 'week'
                        ? "bg-primary text-black font-black"
                        : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    This Week
                  </button>
                </div>
              </div>

              {isTrendingLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/20" />
                </div>
              ) : (
                <HorizontalScroll title="" link="/search">
                  {trendingAll.map((item) => (
                    <div key={`${item.id}-${trendingTimeWindow}`} className={shelfCardWidthClass}>
                      <MovieCard movie={item} size="md" />
                    </div>
                  ))}
                </HorizontalScroll>
              )}
            </div>
          )}

          <PopularSection />
        </div>

        {/* Announcements Preview - Compact Horizontal Layout */}
        {announcements.length > 0 && (
          <div className="container mx-auto px-6 pb-20">
            <div className="flex items-end justify-between mb-4">
              <div className="flex flex-col gap-2">
                <h2 className="font-serif text-[1.85rem] font-bold tracking-tight uppercase">Cinema News</h2>
              </div>
              <Link to="/announcements" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/56 hover:text-foreground transition-colors">
                News Archive
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
              {announcements.slice(0, 5).map((announcement) => (
                <div key={announcement.id} className="flex-none w-[320px]">
                  <AnnouncementCard
                    announcement={announcement}
                    variant="preview"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="container mx-auto px-6 py-12">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-40">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 text-center">Reading Archive...</span>
              </div>
            </div>
          )}

          {/* Discovery Sections */}
          {!isLoading && (
            <>
              {/* Recent Activity */}
              {recentLogs.length > 0 && (
                <div className="mb-24">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex flex-col gap-2">
                      <h2 className="font-serif text-3xl sm:text-[2.1rem] font-bold tracking-tight uppercase">Recent Activity</h2>
                    </div>
                    <Link to="/diary" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/56 hover:text-foreground transition-colors">
                      View Diary
                    </Link>
                  </div>
                  <div className="grid gap-4">
                    {recentLogs.map((entry) => (
                      <LogEntryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              )}

              {socialRecommendations && <SocialRecommendationsSection recommendations={socialRecommendations} />}

              {/* Bollywood Expansion */}
              {trendingBollywood.length > 0 && (
                <HorizontalScroll title="Trending Bollywood" link="/search?original_language=hi">
                  {trendingBollywood.map((item) => (
                    <div key={item.id} className={shelfCardWidthClass}>
                      <MovieCard movie={item} size="md" />
                    </div>
                  ))}
                </HorizontalScroll>
              )}

              {popularBollywood.length > 0 && (
                <HorizontalScroll title="Popular Indian Cinema" link="/search?region=IN">
                  {popularBollywood.map((item) => (
                    <div key={item.id} className={shelfCardWidthClass}>
                      <MovieCard movie={item} size="md" />
                    </div>
                  ))}
                </HorizontalScroll>
              )}

              {popularHollywood.length > 0 && (
                <HorizontalScroll title="Hollywood Spotlight" link="/search?original_language=en">
                  {popularHollywood.map((item) => (
                    <div key={item.id} className={shelfCardWidthClass}>
                      <MovieCard movie={item} size="md" />
                    </div>
                  ))}
                </HorizontalScroll>
              )}

              {/* Popular Films */}
              <HorizontalScroll title="Popular Films" link="/search">
                {popularMovies.map((item) => (
                  <div key={item.id} className={shelfCardWidthClass}>
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Top Rated Films */}
              <HorizontalScroll title="Top Rated Films" link="/search">
                {topRatedMovies.map((item) => (
                  <div key={item.id} className={shelfCardWidthClass}>
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Popular Series */}
              <HorizontalScroll title="Popular Series" link="/search?type=tv">
                {popularTV.map((item) => (
                  <div key={item.id} className={shelfCardWidthClass}>
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Top Rated Series */}
              <HorizontalScroll title="Top Rated Series" link="/search?type=tv">
                {topRatedTV.map((item) => (
                  <div key={item.id} className={shelfCardWidthClass}>
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Currently Airing */}
              <HorizontalScroll title="Currently Airing" link="/search?type=tv">
                {onTheAirTV.map((item) => (
                  <div key={item.id} className={shelfCardWidthClass}>
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Empty State */}
              {recentLogs.length === 0 && (
                <div className="py-20 text-center border border-white/10 rounded-none bg-white/[0.02] mt-12 px-6 relative overflow-hidden group">
                  <AnimatedNoise opacity={0.01} />
                  <div className="relative z-10">
                    <Film className="h-12 w-12 mx-auto mb-6 text-primary/20 group-hover:text-primary/40 transition-colors duration-700" />
                    <h3 className="font-serif text-3xl font-bold uppercase tracking-tight mb-4 text-foreground">Initiate Archive</h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 mb-10 max-w-md mx-auto leading-relaxed">
                      Begin your cinematic documentation. Your first entry awaits in the archive.
                    </p>
                    <Link to="/search">
                      <Button className="font-mono text-[10px] uppercase tracking-[0.18em] bg-primary text-black font-black px-10 h-14 rounded-none hover:bg-primary/90 transition-all duration-500 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                        Explore Collection
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </Layout>
  );
}
