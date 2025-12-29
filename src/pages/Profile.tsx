import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { Divider } from "@/components/ui/divider";
import { Settings, Loader2, Bookmark, History, UserPlus, Check, Clock, Globe, Lock, ShieldAlert, Edit2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogEntry, Movie, UserStats, UserProfile, ConnectionStatus } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserLogs,
  getUserStats,
  getFavoriteMovies,
  getWatchlist,
  getUserByUsername,
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  getUserData,
  getUserLists,
  updateUserData,
  getUserActivityData
} from "@/lib/db";
import { toast } from "sonner";
import { Top5MoviesModal } from "@/components/movies/Top5MoviesModal";
import { ActivityHeatmap } from "@/components/diary/ActivityHeatmap";

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [connection, setConnection] = useState<ConnectionStatus>({ status: 'none' });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTop5ModalOpen, setIsTop5ModalOpen] = useState(false);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);

  const isOwnProfile = !username || (targetUser && targetUser.uid === currentUser?.uid);

  useEffect(() => {
    async function loadProfileData() {
      if (!username && !currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let profileUser: any = null;

        if (username) {
          profileUser = await getUserByUsername(username);
          if (!profileUser) {
            setIsLoading(false);
            return;
          }
        } else if (currentUser) {
          const userData = await getUserData(currentUser.uid);
          if (userData) {
            profileUser = userData;
          } else {
            // New user or no Firestore doc yet
            profileUser = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || "Film Enthusiast",
              photoURL: currentUser.photoURL,
              username: "",
              bio: "Film enthusiast, archiving the cinematic journey.",
              isPublic: true
            };
          }
        }

        if (profileUser) {
          // Fetch connection status first if viewing someone else
          const connStatus = currentUser && profileUser.uid !== currentUser.uid
            ? await getConnectionStatus(currentUser.uid, profileUser.uid)
            : { status: 'none' as const };

          const [fetchedLogs, fetchedFavs, fetchedWatchlist, fetchedLists, fetchedActivityData] = await Promise.all([
            getUserLogs(profileUser.uid, {
              currentUserId: currentUser?.uid,
              isConnection: (connStatus as any).status === 'accepted'
            }),
            getFavoriteMovies(profileUser.uid),
            getWatchlist(profileUser.uid),
            getUserLists(profileUser.uid),
            getUserActivityData(profileUser.uid)
          ]);

          setTargetUser(profileUser as UserProfile);
          setLogs(fetchedLogs);
          setFavorites(fetchedFavs);
          setWatchlist(fetchedWatchlist);
          setConnection(connStatus as ConnectionStatus);
          setActivityData(fetchedActivityData);

          const calculatedStats = await getUserStats(fetchedLogs, fetchedLists.length);
          setStats(calculatedStats);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, [username, currentUser]);


  const handleConnectAction = async () => {
    if (!currentUser || !targetUser) return;
    setIsActionLoading(true);
    try {
      if (connection.status === 'none') {
        await sendConnectionRequest(currentUser.uid, targetUser.uid);
        setConnection({ status: 'pending' });
        toast.success("Request sent");
      } else if (connection.status === 'incoming') {
        await acceptConnectionRequest(connection.requestId!, targetUser.uid, currentUser.uid);
        setConnection({ status: 'accepted' });
        toast.success(`You are now connected with ${targetUser.displayName}`);
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveTop5 = async (movies: Movie[]) => {
    if (!currentUser) return;
    try {
      // Clean undefined fields from movies
      const cleanedMovies = movies.map(movie => {
        const cleaned = cleanUndefinedFields(movie);
        return cleaned;
      });

      await updateUserData(currentUser.uid, {
        top5Movies: cleanedMovies
      });

      // Update local state
      if (targetUser) {
        setTargetUser({ ...targetUser, top5Movies: cleanedMovies });
      }

      toast.success("Top 5 movies updated!");
    } catch (error) {
      console.error("Error saving top 5 movies:", error);
      toast.error("Failed to save top 5 movies");
    }
  };

  // Helper function to clean undefined fields
  const cleanUndefinedFields = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefinedFields).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanUndefinedFields(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!targetUser) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-24 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <H1 className="mb-2">Archive not found</H1>
          <p className="text-muted-foreground mb-8">This cinematic identity does not exist in our records.</p>
          <Link to="/community">
            <Button variant="outline">Back to Community</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Privacy check: If private and not connected and not own profile
  const isPrivate = !isOwnProfile && targetUser.isPublic === false && connection.status !== 'accepted';

  const initials = targetUser.displayName?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-16 text-center md:text-left">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-border shadow-2xl">
            <AvatarImage src={targetUser.photoURL} />
            <AvatarFallback className="text-3xl bg-muted font-serif">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 w-full pt-2">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <H1 className="text-3xl md:text-5xl tracking-tight truncate m-0 p-0 leading-tight">
                    {targetUser.displayName}
                  </H1>
                  {targetUser.isPublic === false ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground/30" />}
                </div>
                {targetUser.username && (
                  <p className="text-sm font-mono text-muted-foreground mb-4 opacity-70">@{targetUser.username}</p>
                )}
                <p className="text-muted-foreground font-serif italic text-base md:text-lg max-w-xl line-clamp-3">
                  {targetUser.bio || "This archivist has not yet shared their cinematic manifesto."}
                </p>
              </div>

              <div className="shrink-0 flex gap-3 justify-center">
                {isOwnProfile ? (
                  <Link to="/settings">
                    <Button variant="outline" size="sm" className="gap-2 rounded-full px-6 h-10 border-border/50 hover:bg-muted">
                      <Settings className="h-4 w-4" />
                      Manage Archive
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleConnectAction}
                    disabled={connection.status === 'pending' || connection.status === 'accepted' || isActionLoading}
                    variant={connection.status === 'accepted' ? "secondary" : "default"}
                    className={cn(
                      "rounded-full gap-2 px-8 h-10 transition-all shadow-lg",
                      connection.status === 'accepted' && "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 shadow-none",
                      connection.status === 'pending' && "opacity-50 grayscale"
                    )}
                  >
                    {isActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : connection.status === 'none' ? (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Connect
                      </>
                    ) : connection.status === 'pending' ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Requested
                      </>
                    ) : connection.status === 'incoming' ? (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Accept Connection
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Connected
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isPrivate ? (
          <div className="py-32 text-center bg-muted/5 border-2 border-dashed border-border/40 rounded-3xl">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h4 className="text-xl font-serif mb-2">Restricted Archive</h4>
            <p className="text-muted-foreground max-w-xs mx-auto">
              This archivist has restricted their collection to accepted connections only.
            </p>
          </div>
        ) : (
          <>
            {/* Activity Heatmap */}
            <ActivityHeatmap
              logs={activityData}
              className="mb-12"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
              {[
                { label: "total films", value: stats?.totalWatched || 0 },
                { label: "this year", value: stats?.thisYearWatched || 0 },
                { label: "avg rating", value: stats?.avgRating || 0 },
                { label: "watchlist", value: watchlist.length }
              ].map((item) => (
                <div key={item.label} className="text-center p-6 md:p-10 bg-muted/10 rounded-2xl border border-border/50 shadow-sm transition-all hover:bg-muted/15">
                  <p className="text-3xl md:text-5xl font-serif font-medium tracking-tighter">{item.value}</p>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-3">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Top 5 Movies */}
            <section className="mb-20">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <H3 className="text-2xl tracking-tight">Top 5</H3>
                </div>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTop5ModalOpen(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    {targetUser.top5Movies && targetUser.top5Movies.length > 0 ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-4">
                {targetUser.top5Movies && targetUser.top5Movies.length > 0 ? (
                  targetUser.top5Movies.map((movie, index) => (
                    <div key={movie.id} className="relative group">
                      <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                        #{index + 1}
                      </div>
                      <MovieCard movie={movie} size="md" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center border border-dashed border-border/50 rounded-2xl opacity-50">
                    <Star className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-sm italic font-serif">
                      {isOwnProfile
                        ? "Share your top 5 movies with the community"
                        : "This archivist hasn't shared their top 5 yet."}
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTop5ModalOpen(true)}
                        className="mt-4 gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Add Your Top 5
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Favorites */}
            <section className="mb-20">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/30">
                <H3 className="text-2xl tracking-tight">Curated Favorites</H3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {favorites.length > 0 ? (
                  favorites.slice(0, 8).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} size="sm" />
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center border border-dashed border-border/50 rounded-2xl opacity-50">
                    <p className="text-sm italic font-serif">No favorites have been designated yet.</p>
                  </div>
                )}
              </div>
            </section>

            <Divider className="my-16 opacity-30" />

            {/* Detailed Tabs */}
            <Tabs defaultValue="diary" className="w-full">
              <TabsList className="mb-10 w-full justify-start bg-transparent border-b border-border h-auto p-0 rounded-none gap-10">
                <TabsTrigger
                  value="diary"
                  className="px-0 pb-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium text-base transition-all"
                >
                  Recent Diary
                </TabsTrigger>
                <TabsTrigger
                  value="watchlist"
                  className="px-0 pb-4 bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium text-base transition-all"
                >
                  Watchlist
                </TabsTrigger>
              </TabsList>

              <TabsContent value="diary" className="mt-0">
                {logs.length > 0 ? (
                  <div className="space-y-6">
                    {logs.slice(0, 10).map((entry) => (
                      <LogEntryCard key={entry.id} entry={entry} />
                    ))}
                    {logs.length > 10 && (
                      <Button variant="ghost" className="w-full py-8 text-muted-foreground hover:text-foreground">
                        View complete chronology →
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="py-24 text-center bg-muted/5 rounded-2xl border border-border/30">
                    <History className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground italic font-serif">The diary remains unwritten.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="watchlist" className="mt-0">
                {watchlist.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
                    {watchlist.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} size="md" />
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center bg-muted/5 rounded-2xl border border-border/30">
                    <Bookmark className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground italic font-serif">Your watchlist is a clean slate.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Top 5 Movies Modal */}
      {isOwnProfile && (
        <Top5MoviesModal
          isOpen={isTop5ModalOpen}
          onClose={() => setIsTop5ModalOpen(false)}
          onSave={handleSaveTop5}
          currentTop5={targetUser?.top5Movies || []}
        />
      )}
    </Layout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
