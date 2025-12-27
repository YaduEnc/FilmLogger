import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { Divider } from "@/components/ui/divider";
import { Settings, Loader2, Bookmark, History, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogEntry, Movie, UserStats } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getUserLogs, getUserStats, getFavoriteMovies, getWatchlist } from "@/lib/db";

export default function Profile() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [fetchedLogs, fetchedFavs, fetchedWatchlist] = await Promise.all([
          getUserLogs(user.uid),
          getFavoriteMovies(user.uid),
          getWatchlist(user.uid)
        ]);

        setLogs(fetchedLogs);
        setFavorites(fetchedFavs);
        setWatchlist(fetchedWatchlist);

        const calculatedStats = await getUserStats(fetchedLogs);
        setStats(calculatedStats);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-24 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const displayName = user?.displayName || "Film Enthusiast";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Profile header */}
        <div className="flex items-start gap-8 mb-12">
          <Avatar className="h-24 w-24 border-2 border-border/50 shadow-sm">
            {user?.photoURL && <AvatarImage src={user.photoURL} />}
            <AvatarFallback className="text-2xl bg-muted font-serif">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <H1 className="mb-2 tracking-tight">{displayName}</H1>
                <p className="text-muted-foreground font-serif italic">Film enthusiast, archiving the cinematic journey.</p>
              </div>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-2 rounded-full">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 bg-muted/5 rounded-xl border border-border/50 shadow-sm">
            <p className="text-3xl font-serif font-medium">{stats?.totalWatched || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">total films</p>
          </div>
          <div className="text-center p-6 bg-muted/5 rounded-xl border border-border/50 shadow-sm">
            <p className="text-3xl font-serif font-medium">{stats?.thisYearWatched || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">this year</p>
          </div>
          <div className="text-center p-6 bg-muted/5 rounded-xl border border-border/50 shadow-sm">
            <p className="text-3xl font-serif font-medium">{stats?.avgRating || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">avg rating</p>
          </div>
          <div className="text-center p-6 bg-muted/5 rounded-xl border border-border/50 shadow-sm">
            <p className="text-3xl font-serif font-medium">{watchlist.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">watchlist</p>
          </div>
        </div>

        {/* Favorites */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-border/50">
            <H3 className="text-xl">Favorites</H3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {favorites.length > 0 ? (
              favorites.slice(0, 6).map((movie) => (
                <MovieCard key={movie.id} movie={movie} size="sm" />
              ))
            ) : (
              <div className="col-span-full py-12 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm">You haven't designated any favorites yet.</p>
                <Link to="/search" className="text-xs underline mt-2">Find your favorite films</Link>
              </div>
            )}
          </div>
        </section>

        <Divider className="my-12 opacity-50" />

        {/* Detailed Tabs */}
        <Tabs defaultValue="diary" className="w-full">
          <TabsList className="mb-8 w-full justify-start bg-transparent border-b border-border h-auto p-0 rounded-none gap-8">
            <TabsTrigger
              value="diary"
              className="px-0 pb-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-all"
            >
              Recent Diary
            </TabsTrigger>
            <TabsTrigger
              value="watchlist"
              className="px-0 pb-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-all"
            >
              Watchlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diary" className="mt-0">
            {logs.length > 0 ? (
              <div className="space-y-4">
                {logs.slice(0, 10).map((entry) => (
                  <LogEntryCard key={entry.id} entry={entry} />
                ))}
                {logs.length > 10 && (
                  <Link to="/diary" className="block py-4 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    View full diary history →
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-muted/10 rounded-xl border border-border/30">
                <History className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground text-sm">Your diary history will appear here as you log films.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="mt-0">
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {watchlist.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} size="sm" />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-muted/10 rounded-xl border border-border/30">
                <Bookmark className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground text-sm">Your watchlist is currently empty.</p>
                <Link to="/search">
                  <Button variant="link" className="text-xs">Explore films to watch</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
