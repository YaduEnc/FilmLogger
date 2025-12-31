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
import { Divider } from "@/components/ui/divider";
import { Plus, Search, Clock, Film, Loader2, Tv, Clapperboard, TrendingUp, Star, Calendar, ChevronLeft, ChevronRight, Play, Info, Megaphone, ArrowRight, Newspaper, User } from "lucide-react";
import gsap from "gsap";
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";
import { LogEntry, Movie, Announcement } from "@/types/movie";
import {
  getTrendingMovies,
  getPopularMovies,
  getTrendingTV,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
  getMovieDetails,
  getTVDetails
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserLogs,
  getUserLists,
  getActiveAnnouncements,
  getUserFriends,
  getMovieLogs
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
      <div className="flex items-end justify-between mb-8 px-2 border-l-2 border-primary/20 pl-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-4xl font-bold tracking-tight uppercase">{title}</h2>
        </div>
        {link && (
          <Link to={link}>
            <Button variant="ghost" size="sm" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary hover:bg-transparent transition-all group/btn">
              Explore Collection
            </Button>
          </Link>
        )}
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {React.Children.map(children, (child, index) => (
            <div className="flex-none transition-all duration-500 hover:scale-105">
              {child}
            </div>
          ))}
          {/* Decorative end marker */}
          <div className="flex-none w-20 flex items-center justify-center">
            <div className="w-px h-40 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          </div>
        </div>

        {/* Premium Scroll Controls */}
        <div className="absolute -top-16 right-0 flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "h-10 w-10 flex items-center justify-center border border-white/5 transition-all duration-300",
              canScrollLeft ? "bg-white/[0.02] hover:bg-white/5 text-foreground" : "opacity-20 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "h-10 w-10 flex items-center justify-center border border-white/5 transition-all duration-300",
              canScrollRight ? "bg-white/[0.02] hover:bg-white/5 text-foreground" : "opacity-20 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [friendActivity, setFriendActivity] = useState<Record<number, any[]>>({});
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<Movie[]>([]);
  const [onTheAirTV, setOnTheAirTV] = useState<Movie[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const castRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [
          trendingMoviesData,
          popularMoviesData,
          trendingTVData,
          popularTVData,
          topRatedTVData,
          onTheAirTVData
        ] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies(),
          getTrendingTV(),
          getPopularTV(),
          getTopRatedTV(),
          getOnTheAirTV()
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

        setTrendingMovies(trendingMoviesData.movies.slice(0, 12));
        setPopularMovies(popularMoviesData.movies.slice(0, 12));
        setTopRatedMovies(popularMoviesData.movies.slice(12, 24));
        setTrendingTV(trendingTVData.movies.slice(0, 12));
        setPopularTV(popularTVData.movies.slice(0, 12));
        setTopRatedTV(topRatedTVData.movies.slice(0, 12));
        setOnTheAirTV(onTheAirTVData.movies.slice(0, 12));

        const announcementsData = await getActiveAnnouncements(5);
        setAnnouncements(announcementsData as Announcement[]);

        if (user) {
          const [fetchedLogs, friends] = await Promise.all([
            getUserLogs(user.uid, { limitCount: 50 }),
            getUserFriends(user.uid)
          ]);
          setRecentLogs(fetchedLogs.slice(0, 5));

          // Fetch social context for featured movies
          const activityMap: Record<number, any[]> = {};
          await Promise.all(featuredFull.map(async (movie) => {
            const watcherPromises = (friends as any[]).map(async (friend) => {
              const logs = await getMovieLogs(friend.uid, movie.id, movie.mediaType || 'movie');
              return logs.length > 0 ? friend : null;
            });
            const movieWatchers = (await Promise.all(watcherPromises)).filter(Boolean);
            activityMap[movie.id] = movieWatchers;
          }));
          setFriendActivity(activityMap);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Auto-rotation timer for Hero
    const interval = setInterval(() => {
      setFeaturedMovies(current => {
        if (current.length > 0) {
          setCurrentFeaturedIndex((prev) => (prev + 1) % current.length);
        }
        return current;
      });
    }, 12000); // Slower rotation for premium feel

    return () => {
      clearInterval(interval);
    };
  }, [user]);

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
  const currentMovieFriends = currentFeatured ? (friendActivity[currentFeatured.id] || []) : [];

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
              className="absolute inset-0 bg-cover bg-center transition-all duration-[6000ms] ease-out scale-100"
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
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary font-bold px-4 py-1.5 border border-primary/20 bg-primary/5 rounded-none">
                      {currentFeatured.mediaType === 'tv' ? 'Series' : 'Film'}
                    </span>
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em]">{currentFeatured.rating?.toFixed(1)}</span>
                    </div>
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
                                "w-full h-full object-cover transition-all duration-[1.5s] ease-out",
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


        {/* Popular on CineLunatic */}
        <div className="container mx-auto px-6 py-12">
          <PopularSection />
        </div>

        {/* Announcements Preview - Compact Horizontal Layout */}
        {announcements.length > 0 && (
          <div className="container mx-auto px-6 pb-20">
            <div className="flex items-end justify-between mb-8 border-l-2 border-primary/20 pl-6">
              <div className="flex flex-col gap-2">
                <h2 className="font-serif text-3xl font-bold tracking-tight uppercase">Cinema News</h2>
              </div>
              <Link to="/announcements" className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 hover:text-foreground transition-colors">
                Archive Archive
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
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 text-center">Reading Archive...</span>
              </div>
            </div>
          )}

          {/* Discovery Sections */}
          {!isLoading && (
            <>
              {/* Recent Activity */}
              {recentLogs.length > 0 && (
                <div className="mb-24">
                  <div className="flex items-end justify-between mb-10 border-l-2 border-primary/20 pl-6">
                    <div className="flex flex-col gap-2">
                      <h2 className="font-serif text-4xl font-bold tracking-tight uppercase">Recent Activity</h2>
                    </div>
                    <Link to="/diary" className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 hover:text-foreground transition-colors">
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

              {/* Trending Films */}
              <HorizontalScroll title="Trending Films" link="/search">
                {trendingMovies.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Popular Films */}
              <HorizontalScroll title="Popular Films" link="/search">
                {popularMovies.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Trending Series */}
              <HorizontalScroll title="Trending Series" link="/search?type=tv">
                {trendingTV.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Top Rated Films */}
              <HorizontalScroll title="Top Rated Films" link="/search">
                {topRatedMovies.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Popular Series */}
              <HorizontalScroll title="Popular Series" link="/search?type=tv">
                {popularTV.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Top Rated Series */}
              <HorizontalScroll title="Top Rated Series" link="/search?type=tv">
                {topRatedTV.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>

              {/* Currently Airing */}
              <HorizontalScroll title="Currently Airing" link="/search?type=tv">
                {onTheAirTV.map((item) => (
                  <div key={item.id} className="w-[180px] sm:w-[200px]">
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
                      <Button className="font-mono text-[10px] uppercase tracking-[0.4em] bg-primary text-black font-black px-10 h-14 rounded-none hover:bg-primary/90 transition-all duration-500 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
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

