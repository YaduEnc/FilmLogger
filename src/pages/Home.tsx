import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { Divider } from "@/components/ui/divider";
import { Plus, Search, Clock, Film, Loader2, Tv, Clapperboard, TrendingUp, Star, Calendar, Flame, ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { LogEntry, Movie, UserStats } from "@/types/movie";
import {
  getTrendingMovies,
  getPopularMovies,
  getTrendingTV,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { getUserLogs, getUserStats, getUserLists } from "@/lib/db";
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
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <H3 className="text-xl">{title}</H3>
        {link && (
          <Link to={link} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        )}
      </div>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<Movie[]>([]);
  const [onTheAirTV, setOnTheAirTV] = useState<Movie[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weekStreak, setWeekStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate viewing streak
  const calculateStreak = (logs: LogEntry[]) => {
    if (logs.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const log of sortedLogs) {
      const logDate = new Date(log.watchedDate);
      logDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = new Date(logDate);
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load both movies and TV shows in parallel
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

        // Set featured movies (top 5 trending movies with backdrops)
        const featured = trendingMoviesData.movies
          .filter(m => m.backdropUrl)
          .slice(0, 5);
        setFeaturedMovies(featured);

        setTrendingMovies(trendingMoviesData.movies.slice(0, 12));
        setPopularMovies(popularMoviesData.movies.slice(0, 12));
        setTopRatedMovies(popularMoviesData.movies.slice(12, 24)); // Different set
        setTrendingTV(trendingTVData.movies.slice(0, 12));
        setPopularTV(popularTVData.movies.slice(0, 12));
        setTopRatedTV(topRatedTVData.movies.slice(0, 12));
        setOnTheAirTV(onTheAirTVData.movies.slice(0, 12));

        if (user) {
          const [fetchedLogs, fetchedLists] = await Promise.all([
            getUserLogs(user.uid, { limitCount: 50 }),
            getUserLists(user.uid)
          ]);
          setRecentLogs(fetchedLogs.slice(0, 5));
          const calculatedStats = await getUserStats(fetchedLogs, fetchedLists.length);
          setStats(calculatedStats as any);
          
          // Calculate streak
          const streak = calculateStreak(fetchedLogs);
          setWeekStreak(streak);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
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

  return (
    <Layout>
      {/* Hero Section with Carousel */}
      {currentFeatured && !isLoading && (
        <div className="relative w-full h-[500px] mb-8 overflow-hidden group">
          {/* Backdrop Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ 
              backgroundImage: `url(${currentFeatured.backdropUrl})`,
            }}
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Navigation Arrows */}
          <button
            onClick={prevFeatured}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-border rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextFeatured}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-border rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeaturedIndex(index)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  index === currentFeaturedIndex 
                    ? "w-8 bg-foreground" 
                    : "w-1 bg-foreground/30 hover:bg-foreground/50"
                )}
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="relative container mx-auto px-6 h-full flex items-center">
            <div className="max-w-2xl">
              {/* Greeting */}
              <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-widest">
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Cinephile'}
              </p>
              
              {/* Featured Badge */}
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">
                {currentFeatured.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                <span>{currentFeatured.year}</span>
                {currentFeatured.runtime && <span>{currentFeatured.runtime} min</span>}
                {currentFeatured.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span>{currentFeatured.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Synopsis */}
              <p className="text-base text-foreground/90 mb-8 line-clamp-3 leading-relaxed">
                {currentFeatured.synopsis}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link to={`/${currentFeatured.mediaType || 'movie'}/${currentFeatured.id}`}>
                  <Button size="lg" className="gap-2 shadow-lg">
                    <Info className="h-4 w-4" />
                    More Info
                  </Button>
                </Link>
                <Link to={`/log?movie=${currentFeatured.id}&type=${currentFeatured.mediaType || 'movie'}`}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Log This
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">

        {/* Quick Stats Bar */}
        {user && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="text-2xl font-serif font-bold">{weekStreak}</p>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Day Streak</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <p className="text-2xl font-serif font-bold mb-1">{stats.thisYearWatched}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">This Year</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <p className="text-2xl font-serif font-bold mb-1">{stats.avgRating}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Avg Rating</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-center">
              <p className="text-2xl font-serif font-bold mb-1">{stats.totalWatched}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Films</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/log">
            <Button className="gap-2 h-10 px-5 rounded-full shadow-lg shadow-primary/5">
              <Plus className="h-4 w-4" />
              Log Entry
            </Button>
          </Link>
          <Link to="/search">
            <Button variant="outline" className="gap-2 h-10 px-5 rounded-full">
              <Search className="h-4 w-4" />
              Explore
            </Button>
          </Link>
          <Link to="/diary">
            <Button variant="outline" className="gap-2 h-10 px-5 rounded-full">
              <Clock className="h-4 w-4" />
              Diary
            </Button>
          </Link>
          <Link to="/lists">
            <Button variant="outline" className="gap-2 h-10 px-5 rounded-full">
              <Film className="h-4 w-4" />
              Lists
            </Button>
          </Link>
        </div>

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
            <HorizontalScroll title="Trending Films" link="/search">
              {trendingMovies.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Recent Activity */}
            {recentLogs.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <H2>Recent Activity</H2>
                  <Link to="/diary" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentLogs.map((entry) => (
                    <LogEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            )}

            {/* Popular Films */}
            <HorizontalScroll title="Popular Films" link="/search">
              {popularMovies.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Trending Series */}
            <HorizontalScroll title="Trending Series" link="/search?type=tv">
              {trendingTV.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Top Rated Films */}
            <HorizontalScroll title="Top Rated Films" link="/search">
              {topRatedMovies.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Popular Series */}
            <HorizontalScroll title="Popular Series" link="/search?type=tv">
              {popularTV.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Top Rated Series */}
            <HorizontalScroll title="Top Rated Series" link="/search?type=tv">
              {topRatedTV.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Currently Airing */}
            <HorizontalScroll title="Currently Airing" link="/search?type=tv">
              {onTheAirTV.map((item) => (
                <div key={item.id} className="flex-none w-[160px]">
                  <MovieCard movie={item} size="md" />
                </div>
              ))}
            </HorizontalScroll>

            {/* Empty State */}
            {recentLogs.length === 0 && (
              <div className="py-16 text-center border border-dashed border-border rounded-xl bg-muted/5 mt-12">
                <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <H3 className="mb-2">Start Your Cinematic Journey</H3>
                <p className="text-muted-foreground mb-6">
                  Log your first film to begin tracking your viewing history.
                </p>
                <Link to="/search">
                  <Button className="gap-2">
                    <Search className="h-4 w-4" />
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
