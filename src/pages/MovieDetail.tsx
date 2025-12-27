import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Plus, Clock, List, RotateCcw, Loader2, Play, Star, ChevronRight, Check, Heart } from "lucide-react";
import { Movie, LogEntry } from "@/types/movie";
import { getMovieDetails } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { getMovieLogs, toggleWatchlist, isInWatchlist, toggleFavorite, isFavorite } from "@/lib/db";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { CreateListModal } from "@/components/movies/CreateListModal";
import { AddToListModal } from "@/components/movies/AddToListModal";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { toast } from "sonner";


export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatchlistActionLoading, setIsWatchlistActionLoading] = useState(false);
  const [isFavoriteActionLoading, setIsFavoriteActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const movieData = await getMovieDetails(parseInt(id));
        setMovie(movieData);

        if (user) {
          const [logs, watchlistStatus, favoriteStatus] = await Promise.all([
            getMovieLogs(user.uid, parseInt(id)),
            isInWatchlist(user.uid, parseInt(id)),
            isFavorite(user.uid, parseInt(id))
          ]);
          setUserLogs(logs);
          setInWatchlist(watchlistStatus);
          setInFavorites(favoriteStatus);
        }
      } catch (err) {
        console.error("Failed to load movie data:", err);
        setError("Failed to load movie details");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, user]);

  const handleToggleWatchlist = async () => {
    if (!user || !movie) {
      toast.error("Please sign in to manage your watchlist");
      return;
    }

    setIsWatchlistActionLoading(true);
    try {
      const added = await toggleWatchlist(user.uid, movie);
      setInWatchlist(added);
      toast.success(added ? `${movie.title} added to watchlist` : `${movie.title} removed from watchlist`);
    } catch (error) {
      console.error("Watchlist error:", error);
      toast.error("Failed to update watchlist");
    } finally {
      setIsWatchlistActionLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !movie) {
      toast.error("Please sign in to manage your favorites");
      return;
    }

    setIsFavoriteActionLoading(true);
    try {
      const added = await toggleFavorite(user.uid, movie);
      setInFavorites(added);
      toast.success(added ? `${movie.title} added to favorites` : `${movie.title} removed from favorites`);
    } catch (error) {
      console.error("Favorite error:", error);
      toast.error("Failed to update favorites");
    } finally {
      setIsFavoriteActionLoading(false);
    }
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

  if (error || !movie) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg mb-4">{error || "Movie not found"}</p>
          <Link to="/search">
            <Button variant="outline">Back to search</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasWatched = userLogs.length > 0;

  return (
    <Layout>
      {/* Hero Backdrop Section */}
      {movie.backdropUrl && (
        <div className="relative w-full h-[300px] lg:h-[450px] overflow-hidden">
          <img
            src={movie.backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-30 grayscale-[0.5]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div className={`container mx-auto px-6 ${movie.backdropUrl ? "-mt-40 lg:-mt-60" : "py-12"} relative z-10`}>
        <div className="grid lg:grid-cols-[300px_1fr] gap-8 lg:gap-16">
          {/* Left Column: Poster & Quick Info */}
          <aside className="space-y-8">
            <div className="relative group">
              <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden border border-border/50 shadow-2xl">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground p-8">
                    <span className="text-sm font-serif italic text-center text-balance">{movie.title}</span>
                  </div>
                )}
              </div>

              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Play className="h-8 w-8 text-white fill-current translate-x-0.5" />
                  </div>
                </a>
              )}
            </div>

            {/* Minor Metadata */}
            <div className="hidden lg:block space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-serif font-medium">{movie.rating?.toFixed(1) || "—"}</span>
                    <span className="text-xs text-muted-foreground">/ 10</span>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Votes</p>
                  <p className="text-xl font-serif font-medium">{movie.voteCount?.toLocaleString() || "—"}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Narrative & Credits */}
          <main className="max-w-4xl pt-4">
            {/* Header Identity */}
            <div className="mb-8">
              <H1 className="text-4xl lg:text-5xl mb-4 tracking-tight">{movie.title}</H1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:text-base text-muted-foreground font-medium">
                <span className="text-foreground">{movie.year}</span>
                {movie.runtime && <span>{movie.runtime} min</span>}
                {movie.language && <span className="uppercase tracking-widest text-xs border border-muted-foreground/30 px-1.5 py-0.5 rounded">{movie.language}</span>}
                <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-foreground font-bold">{movie.rating?.toFixed(1)}</span>
                  <span className="opacity-50">/ 10</span>
                </div>
              </div>
            </div>

            {/* Key Personnel */}
            <div className="mb-8 space-y-2">
              {movie.director && (
                <p className="text-base">
                  <span className="text-muted-foreground">Directed by</span>{" "}
                  {movie.directorId ? (
                    <Link to={`/person/${movie.directorId}`} className="font-medium hover:text-primary transition-colors underline decoration-border underline-offset-4 decoration-1">
                      {movie.director}
                    </Link>
                  ) : (
                    <span className="font-medium hover:text-primary transition-colors cursor-default underline decoration-border underline-offset-4 decoration-1">{movie.director}</span>
                  )}
                </p>
              )}
              {(movie.castMembers && movie.castMembers.length > 0) || (movie.cast && movie.cast.length > 0) ? (
                <p className="text-sm md:text-base leading-relaxed text-muted-foreground flow-root">
                  {movie.castMembers ? (
                    movie.castMembers.slice(0, 6).map((member, index) => (
                      <span key={member.id}>
                        <Link to={`/person/${member.id}`} className="hover:text-foreground transition-colors">
                          {member.name}
                        </Link>
                        {index < Math.min(movie.castMembers!.length, 6) - 1 && ", "}
                      </span>
                    ))
                  ) : (
                    movie.cast?.slice(0, 6).join(", ")
                  )}
                </p>
              ) : null}
            </div>

            {/* Genre Tags */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10">
                {movie.genres.map((genre) => (
                  <Link
                    key={genre}
                    to={`/search?q=${genre}`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted px-3 py-1.5 rounded-full border border-border/50 transition-all"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Primary Actions */}
            <div className="flex flex-wrap gap-3 mb-12">
              <Link to={`/log?movie=${movie.id}`}>
                <Button size="lg" className="px-8 gap-2 shadow-lg shadow-primary/10">
                  {hasWatched ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Log rewatch
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Log this film
                    </>
                  )}
                </Button>
              </Link>
              <Button
                variant={inWatchlist ? "secondary" : "outline"}
                size="lg"
                className="px-6 gap-2"
                onClick={handleToggleWatchlist}
                disabled={isWatchlistActionLoading}
              >
                {isWatchlistActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : inWatchlist ? (
                  <>
                    <Check className="h-4 w-4" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Watchlist
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-6 gap-2"
                onClick={() => setIsAddToListOpen(true)}
              >
                <List className="h-4 w-4" />
                Add to list
              </Button>
              <Button
                variant={inFavorites ? "secondary" : "ghost"}
                size="icon"
                className="h-12 w-12"
                onClick={handleToggleFavorite}
                disabled={isFavoriteActionLoading}
              >
                {isFavoriteActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={cn("h-5 w-5 transition-colors", inFavorites && "fill-current text-destructive")} />
                )}
              </Button>
            </div>

            {/* Synopsis */}
            {movie.synopsis && (
              <div className="mb-16">
                <p className="text-lg leading-relaxed text-foreground/90 max-w-prose italic font-serif opacity-90">
                  {movie.synopsis}
                </p>
              </div>
            )}

            <Divider className="my-12 opacity-50" />

            {/* Community Reviews Section */}
            <ReviewSection movie={movie} />

            <Divider className="my-16 opacity-50" />

            {/* Personal History Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <H2 className="text-2xl tracking-tight">Your diary entries</H2>
                {hasWatched && (
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    {userLogs.length} {userLogs.length === 1 ? "entry" : "entries"}
                  </span>
                )}
              </div>

              {userLogs.length > 0 ? (
                <div className="grid gap-6">
                  {userLogs.map((entry) => (
                    <LogEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-6 bg-muted/5 border-2 border-dashed border-border/40 rounded-2xl group hover:bg-muted/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Clock className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium leading-none mb-1">Unarchived</h4>
                      <p className="text-xs text-muted-foreground">You haven't logged any viewings of this film yet.</p>
                    </div>
                  </div>
                  <Link to={`/log?movie=${movie.id}`}>
                    <Button variant="outline" size="sm" className="gap-2 rounded-full border-border/60 hover:bg-background">
                      Log it now
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>


      <AddToListModal
        movie={movie}
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        onCreateNew={() => setIsCreateListOpen(true)}
      />

      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onSuccess={() => {
          setIsAddToListOpen(true);
        }}
      />
    </Layout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
