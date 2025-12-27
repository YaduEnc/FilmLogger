import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { Divider } from "@/components/ui/divider";
import { Plus, Search, Clock, Film, Loader2 } from "lucide-react";
import { LogEntry, Movie, UserStats } from "@/types/movie";
import { getTrendingMovies, getPopularMovies } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { getUserLogs, getUserStats, getUserLists } from "@/lib/db";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { user } = useAuth();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [trendingData, popularData] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies()
        ]);

        setTrendingMovies(trendingData.movies.slice(0, 4));
        setPopularMovies(popularData.movies.slice(0, 4));

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
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Quick actions */}
        <section className="flex flex-wrap gap-3 mb-12">
          <Link to="/log">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log a film
            </Button>
          </Link>
          <Link to="/search">
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Search films
            </Button>
          </Link>
          <Link to="/diary">
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              Diary
            </Button>
          </Link>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Feed Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="network" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger value="network" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all shadow-none border-0">Network</TabsTrigger>
                  <TabsTrigger value="personal" className="text-sm px-4 py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all shadow-none border-0">You</TabsTrigger>
                </TabsList>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground">
                  My Profile →
                </Link>
              </div>

              <TabsContent value="network" className="mt-0 animate-in fade-in-50 duration-300">
                <ActivityFeed />
              </TabsContent>

              <TabsContent value="personal" className="mt-0 animate-in fade-in-50 duration-300">
                <div>
                  {recentLogs.map((entry) => (
                    <LogEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
                {!isLoading && recentLogs.length === 0 && (
                  <div className="py-12 text-center border border-dashed border-border rounded-sm">
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside>
            {/* Trending movies */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <H3>Trending this week</H3>
                <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {trendingMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} size="sm" />
                  ))}
                </div>
              )}
            </div>

            {/* Popular movies */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <H3>Most popular</H3>
                <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {popularMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} size="sm" />
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
