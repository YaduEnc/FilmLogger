import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { MovieCard } from "@/components/movies/MovieCard";
import { Settings, Loader2, Bookmark, History, UserPlus, Check, Clock, Globe, Lock, ShieldAlert, Edit2, Star, Plus } from "lucide-react";
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
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";
import { cn } from "@/lib/utils";

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
      const cleanedMovies = movies.map(movie => {
        const cleaned = cleanUndefinedFields(movie);
        return cleaned;
      });

      await updateUserData(currentUser.uid, {
        top5Movies: cleanedMovies
      });

      if (targetUser) {
        setTargetUser({ ...targetUser, top5Movies: cleanedMovies });
      }

      toast.success("Top 5 movies updated!");
    } catch (error) {
      console.error("Error saving top 5 movies:", error);
      toast.error("Failed to save top 5 movies");
    }
  };

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
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </Layout>
    );
  }

  if (!targetUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
          <ShieldAlert className="h-12 w-12 mb-4 text-white/20" />
          <h1 className="text-2xl font-serif text-white mb-2">Archive not found</h1>
          <p className="text-white/40 mb-8 font-mono text-sm max-w-sm">This cinematic identity does not exist in our records.</p>
          <Link to="/community">
            <Button variant="outline" className="font-mono text-xs uppercase tracking-widest">Back to Community</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isPrivate = !isOwnProfile && targetUser.isPublic === false && connection.status !== 'accepted';
  const initials = targetUser.displayName?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <Layout>
      <div className="relative min-h-screen pb-20">
        <AnimatedNoise opacity={0.03} />

        <div className="container mx-auto px-6 pt-12 md:pt-20 max-w-5xl relative z-10">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12 mb-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-black ring-1 ring-white/10 shadow-2xl">
              <AvatarImage src={targetUser.photoURL} className="object-cover" />
              <AvatarFallback className="text-4xl bg-white/5 font-serif text-white/50">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-2 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                <div>
                  <div className="flex items-baseline justify-center md:justify-start gap-3">
                    <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight text-white m-0 leading-none">
                      {targetUser.displayName}
                    </h1>
                    {targetUser.isPublic === false && <Lock className="h-4 w-4 text-white/30" />}
                  </div>

                  {targetUser.username && (
                    <p className="font-mono text-sm text-white/40 mt-2">@{targetUser.username}</p>
                  )}

                  <p className="mt-6 font-serif italic text-lg text-white/60 max-w-xl leading-relaxed">
                    {targetUser.bio || "No manifesto written."}
                  </p>
                </div>

                <div>
                  {isOwnProfile ? (
                    <Link to="/settings">
                      <Button variant="outline" className="rounded-full border-white/20 hover:bg-white/5 hover:text-white px-6 font-mono text-xs uppercase tracking-widest gap-2">
                        <Settings className="h-3 w-3" />
                        Manage Archive
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={handleConnectAction}
                      disabled={connection.status === 'pending' || connection.status === 'accepted' || isActionLoading}
                      variant="outline"
                      className={cn(
                        "rounded-full px-8 font-mono text-xs uppercase tracking-widest gap-2 transition-all",
                        connection.status === 'accepted' ? "bg-green-500/10 text-green-500 border-green-500/20" : "border-white/20 hover:bg-white/5"
                      )}
                    >
                      {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> :
                        connection.status === 'accepted' ? 'Connected' :
                          connection.status === 'pending' ? 'Requested' : 'Connect'
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isPrivate ? (
            <div className="py-32 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <Lock className="h-8 w-8 mx-auto mb-4 text-white/20" />
              <h3 className="font-serif text-xl text-white/80 mb-2">Private Archive</h3>
              <p className="text-white/40 font-mono text-xs max-w-xs mx-auto">This collection is visible to connected cinephiles only.</p>
            </div>
          ) : (
            <div className="space-y-16">

              {/* ACTIVITY HEATMAP */}
              <ActivityHeatmap logs={activityData} />

              {/* STATS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: "Total Films", value: stats?.totalWatched || 0 },
                  { label: "This Year", value: stats?.thisYearWatched || 0 },
                  { label: "Avg Rating", value: stats?.avgRating || 0 },
                  { label: "Watchlist", value: watchlist.length }
                ].map((stat) => (
                  <div key={stat.label} className="group bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-serif text-5xl md:text-6xl text-white block mb-4 tracking-tight">{stat.value}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* TOP 5 */}
              <div>
                <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-white" />
                    <h3 className="font-serif text-2xl text-white">Top 5</h3>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsTop5ModalOpen(true)}
                      className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {targetUser.top5Movies && targetUser.top5Movies.length > 0 ? (
                    targetUser.top5Movies.map((movie, i) => (
                      <div key={movie.id} className="relative group aspect-[2/3]">
                        <div className="absolute top-2 left-2 z-10 font-mono text-4xl font-bold text-white/20 drop-shadow-md pointer-events-none stroke-black text-stroke-2">
                          {i + 1}
                        </div>
                        <MovieCard movie={movie} size="md" className="h-full w-full" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <Star className="h-8 w-8 mx-auto mb-4 text-white/10" />
                      <p className="font-serif italic text-white/40 mb-6">"Share your top 5 movies with the community"</p>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          onClick={() => setIsTop5ModalOpen(true)}
                          className="font-mono text-xs uppercase tracking-widest gap-2"
                        >
                          <Plus className="h-3 w-3" />
                          Add Your Top 5
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>


              {/* TABS (Diary/Watchlist) */}
              <Tabs defaultValue="diary" className="w-full">
                <TabsList className="bg-transparent border-b border-white/10 w-full justify-start h-auto p-0 rounded-none mb-8 gap-8">
                  <TabsTrigger
                    value="diary"
                    className="bg-transparent px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent font-serif text-lg text-white/40 data-[state=active]:text-white transition-all"
                  >
                    Recent Activity
                  </TabsTrigger>
                  <TabsTrigger
                    value="watchlist"
                    className="bg-transparent px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent font-serif text-lg text-white/40 data-[state=active]:text-white transition-all"
                  >
                    Watchlist
                    <span className="ml-2 font-mono text-[10px] text-white/20 align-top">{watchlist.length}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="diary" className="space-y-4">
                  {logs.length > 0 ? (
                    <>
                      {logs.slice(0, 5).map(log => (
                        <LogEntryCard key={log.id} entry={log} />
                      ))}
                      {logs.length > 5 && (
                        <div className="text-center pt-8">
                          <Link to={`/u/${targetUser.username}/diary`}>
                            <Button variant="ghost" className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-white">View Full Diary</Button>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-20 text-center text-white/30 font-serif italic">
                      The screen is yet to be lit.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="watchlist">
                  {watchlist.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {watchlist.map(movie => (
                        <MovieCard key={movie.id} movie={movie} size="md" />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-white/30 font-serif italic">
                      No films in queue.
                    </div>
                  )}
                </TabsContent>
              </Tabs>

            </div>
          )}
        </div>

        {/* Top 5 Modal */}
        {isOwnProfile && (
          <Top5MoviesModal
            isOpen={isTop5ModalOpen}
            onClose={() => setIsTop5ModalOpen(false)}
            onSave={handleSaveTop5}
            currentTop5={targetUser?.top5Movies || []}
          />
        )}
      </div>
    </Layout>
  );
}
