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
import { Plus, Search, Clock, Film, Loader2, Tv, Clapperboard, TrendingUp, Star, Calendar, ChevronLeft, ChevronRight, Play, Info, Megaphone, ArrowRight, Newspaper } from "lucide-react";
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
      const scrollAmount = direction === 'left' ? -400 : 400;
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
    <div className="mb-8 sm:mb-12 group/scroll">
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="flex flex-col gap-1">
          <DisplayH3 className="text-xl sm:text-2xl lg:text-3xl">{title}</DisplayH3>
        </div>
        {link && (
          <Link to={link}>
            <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-white/5 transition-all gap-2">
              Browse All
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 top-[40%] -translate-y-1/2 z-40 h-10 w-10 flex items-center justify-center bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-primary hover:border-primary hover:scale-110 active:scale-90 shadow-2xl"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 top-[40%] -translate-y-1/2 z-40 h-10 w-10 flex items-center justify-center bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-primary hover:border-primary hover:scale-110 active:scale-90 shadow-2xl"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 sm:mx-0 px-4 sm:px-0 pb-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {React.Children.map(children, (child, index) => (
            <div
              className="animate-in fade-in slide-in-from-right-4 duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {child}
            </div>
          ))}
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
    }, 8000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

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
      {/* Hero Section with Cinematic Spotlight Layout */}
      {currentFeatured && !isLoading && (
        <div className="hero-section relative w-full h-[450px] sm:h-[60vh] min-h-[400px] mb-12 overflow-hidden group">
          {/* Backdrop Image with Ken Burns Effect */}
          <div
            key={`backdrop-${currentFeatured.id}`}
            className="absolute inset-0 bg-cover bg-center transition-all duration-[4000ms] ease-out animate-ken-burns transform scale-100"
            style={{
              backgroundImage: `url(${currentFeatured.backdropUrl})`,
            }}
          />

          {/* Multi-layered Gradients for Adaptive Visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/10 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/2 dark:bg-black/15 z-0" />



          {/* Vertical Segmented Indicators */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeaturedIndex(index)}
                className={cn(
                  "w-1 rounded-full transition-all duration-500",
                  index === currentFeaturedIndex
                    ? "h-12 bg-primary"
                    : "h-2 bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>

          {/* Main Content Area */}
          <div className="relative container mx-auto px-6 h-full flex flex-col justify-end pb-10 sm:pb-16 z-20">
            <div className="grid md:grid-cols-[1fr_auto] gap-12 items-end">
              <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {/* Upper Metadata */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full">
                    {currentFeatured.mediaType === 'tv' ? 'Featured Series' : 'Featured Movie'}
                  </Badge>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 backdrop-blur-md rounded-full border border-border shadow-lg">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-[10px] font-bold text-foreground tracking-widest">{currentFeatured.rating?.toFixed(1)}</span>
                  </div>
                </div>

                {/* Cinematic Title */}
                <h1
                  key={`title-${currentFeatured.id}`}
                  className="text-5xl sm:text-7xl md:text-8xl font-serif font-black mb-6 leading-[0.95] tracking-tight text-foreground animate-in fade-in slide-in-from-left-12 duration-1000"
                >
                  {currentFeatured.title}
                </h1>

                {/* Sub-info Row */}
                <div className="flex flex-wrap items-center gap-10 mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-muted-foreground/60">Release</span>
                    <span className="text-lg font-bold tracking-tight text-foreground">{currentFeatured.year}</span>
                  </div>
                  {currentFeatured.runtime && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-muted-foreground/60">Duration</span>
                      <span className="text-lg font-bold tracking-tight text-foreground">{currentFeatured.runtime} min</span>
                    </div>
                  )}

                  {/* Social Badge - More prominent */}
                  {currentMovieFriends.length > 0 && (
                    <div className="flex flex-col gap-2 p-3 bg-muted/50 backdrop-blur-xl border border-border rounded-2xl animate-in zoom-in duration-700">
                      <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-primary/80 px-1">Social Pulse</span>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {currentMovieFriends.slice(0, 3).map((friend: any) => (
                            <img
                              key={friend.uid}
                              src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`}
                              className="h-8 w-8 rounded-full border-2 border-background ring-1 ring-white/10 transition-transform hover:scale-110"
                              alt=""
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-foreground/80 pr-2">
                          {currentMovieFriends.length === 1
                            ? `${currentMovieFriends[0].displayName?.split(' ')[0]} watched this`
                            : `${currentMovieFriends[0].displayName?.split(' ')[0]} & friends watched`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balanced Actions */}
                <div className="flex flex-wrap gap-4">
                  <Link to={`/${currentFeatured.mediaType || 'movie'}/${currentFeatured.id}`}>
                    <Button size="lg" className="h-16 px-10 gap-3 text-base font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.95] rounded-2xl bg-primary text-primary-foreground">
                      Explore Movie
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to={`/log?movie=${currentFeatured.id}&type=${currentFeatured.mediaType || 'movie'}`}>
                    <Button size="lg" variant="outline" className="h-16 px-8 gap-3 text-base font-bold bg-muted/30 backdrop-blur-3xl border-border hover:bg-muted/50 transition-all rounded-2xl">
                      <Plus className="h-5 w-5" />
                      Add to Diary
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Cinematic Profiles (Director & Top Cast) */}
              <div className="hidden lg:flex flex-col gap-8 animate-in fade-in slide-in-from-right-12 duration-1400 delay-500 max-w-[280px]">
                {/* Director Profile */}
                {currentFeatured.director && (
                  <div className="group/profile flex flex-col items-center text-center">
                    {currentFeatured.castMembers?.find(c => c.name === currentFeatured.director)?.profileUrl && (
                      <div className="relative mb-4">
                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary/40 to-transparent rounded-full blur-md opacity-0 group-hover/profile:opacity-100 transition-opacity duration-700" />
                        <div className="relative h-28 w-28 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl transition-transform duration-700 group-hover/profile:scale-110">
                          <img
                            src={currentFeatured.castMembers.find(c => c.name === currentFeatured.director)?.profileUrl}
                            alt={currentFeatured.director}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <span className="text-[9px] uppercase tracking-[0.4em] font-black text-primary/80 mb-1">Director</span>
                    <h3 className="text-xl font-serif font-bold text-foreground leading-tight">{currentFeatured.director}</h3>
                  </div>
                )}

                {/* Top Cast List */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[8px] uppercase tracking-[0.5em] font-bold text-white/30">Top Cast</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>

                  <div className="space-y-4">
                    {currentFeatured.castMembers?.slice(0, 3).map((actor) => (
                      <div key={actor.id} className="group/actor flex items-center gap-4 transition-all hover:translate-x-2">
                        {actor.profileUrl && (
                          <div className="h-14 w-14 rounded-full border border-white/10 overflow-hidden bg-white/5 shrink-0 shadow-lg group-hover/actor:border-primary/50 transition-colors">
                            <img src={actor.profileUrl} alt={actor.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold text-foreground group-hover/actor:text-primary transition-colors">{actor.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate italic">{actor.character}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Decorative Element */}
                <div className="flex flex-col items-center gap-1 opacity-20 pt-4">
                  <div className="h-8 w-px bg-white/20" />
                </div>
              </div>
            </div>
          </div>

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
        </div>
      )}

      {/* Popular on CineLunatic */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <PopularSection />
      </div>

      {/* Announcements Preview - Compact Horizontal Layout */}
      {announcements.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <H3 className="text-base sm:text-lg">Cinema News</H3>
            </div>
            <Link to="/announcements" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
            {announcements.slice(0, 5).map((announcement) => (
              <div key={announcement.id} className="flex-none w-[240px] sm:w-[280px]">
                <AnnouncementCard
                  announcement={announcement}
                  variant="preview"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Discovery Sections */}
        {!isLoading && (
          <>
            {/* Trending Films */}
            <div className="discovery-section">
              <HorizontalScroll title="Trending Films" link="/search">
                {trendingMovies.map((item) => (
                  <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                    <MovieCard movie={item} size="md" />
                  </div>
                ))}
              </HorizontalScroll>
            </div>

            {/* Recent Activity */}
            {recentLogs.length > 0 && (
              <div className="mb-8 sm:mb-12">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex flex-col gap-1">
                    <DisplayH3 className="text-xl sm:text-2xl">Recent Activity</DisplayH3>
                  </div>
                  <Link to="/diary" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {recentLogs.map((entry) => (
                    <LogEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            )}

            {/* Popular Films */}
            <HorizontalScroll title="Popular Films" link="/search">
              {popularMovies.map((item) => (
                <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Trending Series */}
            <HorizontalScroll title="Trending Series" link="/search?type=tv">
              {trendingTV.map((item) => (
                <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Top Rated Films */}
            <HorizontalScroll title="Top Rated Films" link="/search">
              {topRatedMovies.map((item) => (
                <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Popular Series */}
            <HorizontalScroll title="Popular Series" link="/search?type=tv">
              {popularTV.map((item) => (
                <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Top Rated Series */}
            <HorizontalScroll title="Top Rated Series" link="/search?type=tv">
              {topRatedTV.map((item) => (
                <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Currently Airing */}
            <HorizontalScroll title="Currently Airing" link="/search?type=tv">
              {onTheAirTV.map((item) => (
                <div key={item.id} className="flex-none w-[120px] sm:w-[144px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Empty State */}
            {recentLogs.length === 0 && (
              <div className="py-12 sm:py-16 text-center border border-dashed border-border rounded-xl bg-muted/5 mt-8 sm:mt-12 px-4">
                <Film className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                <H3 className="mb-2 text-lg sm:text-xl">Start Your Cinematic Journey</H3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Log your first film to begin tracking your viewing history.
                </p>
                <Link to="/search">
                  <Button className="gap-2 text-sm sm:text-base h-9 sm:h-10">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                    Explore
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
