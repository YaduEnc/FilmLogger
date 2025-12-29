import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2, H3 } from "@/components/ui/typography";
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
  getOnTheAirTV
} from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { getUserLogs, getUserLists, getActiveAnnouncements } from "@/lib/db";
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
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-3">
        <H3 className="text-lg sm:text-xl">{title}</H3>
        {link && (
          <Link to={link} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        )}
      </div>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 sm:p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 sm:p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background active:scale-95"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 sm:mx-0 px-4 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        // Load announcements
        const announcementsData = await getActiveAnnouncements(5);
        setAnnouncements(announcementsData as Announcement[]);

        if (user) {
          const [fetchedLogs] = await Promise.all([
            getUserLogs(user.uid, { limitCount: 50 })
          ]);
          setRecentLogs(fetchedLogs.slice(0, 5));
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
        <div className="hero-section relative w-full h-[400px] sm:h-[500px] mb-6 sm:mb-8 overflow-hidden group">
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
          
          {/* Navigation Arrows - Visible on mobile with touch */}
          <button
            onClick={prevFeatured}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 backdrop-blur-md rounded-full p-2 sm:p-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-black/60 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </button>
          <button
            onClick={nextFeatured}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 backdrop-blur-md rounded-full p-2 sm:p-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-black/60 active:scale-95"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
            {featuredMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeaturedIndex(index)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  index === currentFeaturedIndex 
                    ? "w-6 sm:w-8 bg-foreground" 
                    : "w-1 bg-foreground/30 hover:bg-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative container mx-auto px-4 sm:px-6 h-full flex items-center">
            <div className="max-w-2xl">
              {/* Greeting */}
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 uppercase tracking-widest">
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Cinephile'}
              </p>
              
              {/* Featured Badge */}
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary">Featured</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-serif font-bold mb-2 sm:mb-4 leading-tight">
                {currentFeatured.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">
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
              <p className="text-sm sm:text-base text-foreground/90 mb-4 sm:mb-8 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {currentFeatured.synopsis}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link to={`/${currentFeatured.mediaType || 'movie'}/${currentFeatured.id}`}>
                  <Button size="default" className="gap-2 shadow-lg text-sm sm:text-base h-9 sm:h-10 px-4 sm:px-6">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                    More Info
                  </Button>
                </Link>
                <Link to={`/log?movie=${currentFeatured.id}&type=${currentFeatured.mediaType || 'movie'}`}>
                  <Button size="default" variant="outline" className="gap-2 text-sm sm:text-base h-9 sm:h-10 px-4 sm:px-6">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    Log This
                  </Button>
                </Link>
              </div>
            </div>
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
                  <H2 className="text-xl sm:text-2xl">Recent Activity</H2>
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
