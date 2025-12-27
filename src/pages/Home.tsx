import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { Divider } from "@/components/ui/divider";
import { Plus, Search, Clock, Film, Loader2, Tv, Clapperboard } from "lucide-react";
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

export default function Home() {
  const { user } = useAuth();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [trendingItems, setTrendingItems] = useState<Movie[]>([]);
  const [popularItems, setPopularItems] = useState<Movie[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        let trendingData, popularData;

        if (mediaType === 'movie') {
          [trendingData, popularData] = await Promise.all([
            getTrendingMovies(),
            getPopularMovies()
          ]);
        } else {
          [trendingData, popularData] = await Promise.all([
            getTrendingTV(),
            getPopularTV()
          ]);
        }

        setTrendingItems(trendingData.movies.slice(0, 4));
        setPopularItems(popularData.movies.slice(0, 4));

        if (user) {
          const [fetchedLogs, fetchedLists] = await Promise.all([
            getUserLogs(user.uid, { limitCount: 5 }),
            getUserLists(user.uid)
          ]);
          setRecentLogs(fetchedLogs);
          const calculatedStats = await getUserStats(fetchedLogs, fetchedLists.length);
          setStats(calculatedStats as any);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, mediaType]);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">

        {/* Media Toggle & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">

          {/* Custom Toggle */}
          <div className="bg-muted/10 p-1 rounded-full inline-flex border border-border/50 self-start">
            <button
              onClick={() => setMediaType('movie')}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                mediaType === 'movie'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
            >
              <Clapperboard className="h-4 w-4" />
              Films
            </button>
            <button
              onClick={() => setMediaType('tv')}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                mediaType === 'tv'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
            >
              <Tv className="h-4 w-4" />
              Series
            </button>
          </div>

          {/* Quick actions */}
          <section className="flex flex-wrap gap-3">
            <Link to="/log">
              <Button className="gap-2 h-10 px-5 rounded-full shadow-lg shadow-primary/5">
                <Plus className="h-4 w-4" />
                Log entry
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" className="gap-2 h-10 px-5 rounded-full">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </Link>
            <Link to="/diary">
              <Button variant="outline" className="gap-2 h-10 px-5 rounded-full">
                <Clock className="h-4 w-4" />
                Diary
              </Button>
            </Link>
          </section>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Recent activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <H2>Recent activity</H2>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground">
                View profile →
              </Link>
            </div>
            <div>
              {recentLogs.map((entry) => (
                <LogEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
            {!isLoading && recentLogs.length === 0 && (
              <div className="py-12 text-center border border-dashed border-border rounded-xl bg-muted/5">
                <Film className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Your diary is empty.</p>
                <p className="text-sm mt-1">
                  <Link to="/search" className="text-foreground underline underline-offset-2">
                    Find a film
                  </Link>{" "}
                  to get started.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            {/* Trending Section */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <H3>{mediaType === 'movie' ? 'Trending Films' : 'Trending Series'}</H3>
                <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {trendingItems.map((item) => (
                    <MovieCard key={item.id} movie={item} size="sm" />
                  ))}
                </div>
              )}
            </div>

            {/* Popular Section */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <H3>{mediaType === 'movie' ? 'Popular Films' : 'Popular Series'}</H3>
                <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {popularItems.map((item) => (
                    <MovieCard key={item.id} movie={item} size="sm" />
                  ))}
                </div>
              )}
            </div>

            <Divider className="mb-8" />

            {/* Stats preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <H3>Your totals</H3>
                <Link to="/stats" className="text-sm text-muted-foreground hover:text-foreground">
                  More stats →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-sm border border-border">
                  <p className="text-2xl font-serif font-medium">{stats?.thisYearWatched || 0}</p>
                  <p className="text-sm text-muted-foreground">this year</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-sm border border-border">
                  <p className="text-2xl font-serif font-medium">{stats?.avgRating || "—"}</p>
                  <p className="text-sm text-muted-foreground">avg rating</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
