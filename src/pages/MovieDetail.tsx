import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Plus, Clock, List, RotateCcw, Loader2, Play, Star, ChevronRight, Check, Heart, ChevronLeft, X } from "lucide-react";
import { Movie, LogEntry } from "@/types/movie";
import { getMovieDetails, getSimilarMovies, getSimilarTV } from "@/lib/tmdb";
import { MovieCard } from "@/components/movies/MovieCard";
import { useAuth } from "@/hooks/useAuth";
import { getMovieLogs, toggleWatchlist, isInWatchlist, toggleFavorite, isFavorite, logActivity, updateMovieStats } from "@/lib/db";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { CreateListModal } from "@/components/movies/CreateListModal";
import { AddToListModal } from "@/components/movies/AddToListModal";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { CommunityRatingMeter } from "@/components/movies/CommunityRatingMeter";
import { GenreTagger } from "@/components/movies/GenreTagger";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCommunityRating, getUserCommunityInteraction, createLogEntry } from "@/lib/db";


export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [communityData, setCommunityData] = useState<any>(null);
  const [userInteraction, setUserInteraction] = useState<{ rating: number | null, genres: string[] }>({ rating: null, genres: [] });
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isWatchlistActionLoading, setIsWatchlistActionLoading] = useState(false);
  const [isFavoriteActionLoading, setIsFavoriteActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedBackdropIndex, setSelectedBackdropIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (backdropRef.current) {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        backdropRef.current.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (movie?.backdrops && movie.backdrops.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setSelectedBackdropIndex((prev) => (prev < movie.backdrops!.length - 1 ? prev + 1 : 0));
      }, 4000); // Change every 4 seconds
    }

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [movie?.backdrops]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const movieData = await getMovieDetails(parseInt(id));
        setMovie(movieData);

        // Load similar movies
        try {
          const similar = movieData.mediaType === 'tv'
            ? await getSimilarTV(parseInt(id))
            : await getSimilarMovies(parseInt(id));
          setSimilarMovies(similar.movies.slice(0, 16));
        } catch (error) {
          console.error("Failed to load similar movies:", error);
          setSimilarMovies([]); // Set empty array on error
        }

        if (user) {
          const [logs, watchlistStatus, favoriteStatus] = await Promise.all([
            getMovieLogs(user.uid, parseInt(id)),
            isInWatchlist(user.uid, parseInt(id)),
            isFavorite(user.uid, parseInt(id))
          ]);
          setUserLogs(logs);
          setInWatchlist(watchlistStatus);
          setInFavorites(favoriteStatus);

          const interaction = await getUserCommunityInteraction(user.uid, id, movieData.mediaType || 'movie');
          setUserInteraction(interaction);
        }

        const commData = await getCommunityRating(id, movieData.mediaType || 'movie');
        setCommunityData(commData);
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

      if (added) {
        // Update stats and log activity when adding to watchlist
        await Promise.all([
          updateMovieStats(
            movie.id,
            movie.mediaType || 'movie',
            movie.title,
            movie.posterUrl,
            'watchlist'
          ),
          logActivity({
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userPhoto: user.photoURL,
            type: 'watchlist',
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.posterUrl,
            mediaType: movie.mediaType || 'movie'
          })
        ]);
      }

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

      if (added) {
        // Log activity and update stats when adding to favorites
        await Promise.all([
          logActivity({
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userPhoto: user.photoURL,
            type: 'favorite',
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.posterUrl,
            mediaType: movie.mediaType || 'movie'
          }),
          updateMovieStats(
            movie.id,
            movie.mediaType || 'movie',
            movie.title,
            movie.posterUrl,
            'favorite'
          )
        ]);
      }

      toast.success(added ? `${movie.title} added to favorites` : `${movie.title} removed from favorites`);
    } catch (error) {
      console.error("Favorite error:", error);
      toast.error("Failed to update favorites");
    } finally {
      setIsFavoriteActionLoading(false);
    }
  };

  const handleQuickLog = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !movie) return toast.error("Sign in to log films");
    if (hasWatched) return toast.info("Already logged");

    setIsActionLoading('log');
    try {
      await createLogEntry(user.uid, {
        movieId: movie.id,
        mediaType: movie.mediaType || 'movie',
        rating: 0,
        reviewShort: "",
        tags: [],
        watchedDate: new Date().toISOString(),
        visibility: "public",
        isRewatch: false,
        rewatchCount: 0,
        movie: movie
      });
      // Instant update for this page
      setUserLogs([{ id: 'temp', watchedDate: new Date().toISOString() } as any]);
      toast.success(`Logged ${movie.title} as watched`);
    } catch (err) {
      toast.error("Failed to log film");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleAddToListTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddToListOpen(true);
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
      {/* Hero Backdrop Section with Parallax - Small on Mobile */}
      {movie.backdropUrl && (
        <div className="relative w-full h-[120px] sm:h-[200px] lg:h-[450px] overflow-hidden">
          <div
            ref={backdropRef}
            className="absolute inset-0 w-full h-[120%] -top-[10%]"
            style={{ willChange: 'transform' }}
          >
            <img
              src={movie.backdropUrl}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover opacity-60 grayscale-[0.15]"
              style={{ filter: 'blur(0.5px)' }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent z-10" />
        </div>
      )}

      <div className={`container mx-auto px-4 sm:px-6 ${movie.backdropUrl ? "-mt-16 sm:-mt-24 lg:-mt-60" : "py-6 sm:py-12"} relative z-20`}>
        {/* Mobile: Compact Top Layout with Small Poster */}
        <div className="lg:hidden mb-6">
          <div className="flex gap-3 items-start">
            <div className="relative group shrink-0">
              <div className="w-20 h-[120px] bg-muted rounded-lg overflow-hidden border border-border/50 shadow-lg">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground p-2">
                    <span className="text-[10px] font-serif italic text-center">{movie.title}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <H1 className="text-xl sm:text-2xl mb-2 leading-tight line-clamp-2">{movie.title}</H1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{movie.year}</span>
                {movie.runtime && <span>{movie.runtime} min</span>}
                {movie.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-foreground font-medium">{movie.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 sm:gap-8 lg:gap-16">
          {/* Left Column: Poster & Quick Info - Hidden on Mobile */}
          <aside className="hidden lg:block space-y-8">
            <div
              className="relative group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden border border-border/50 shadow-2xl relative">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500",
                      isHovered && "scale-105"
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground p-8">
                    <span className="text-sm font-serif italic text-center text-balance">{movie.title}</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-300 flex flex-col justify-end p-4 z-20",
                  isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                )}>
                  <div className="flex gap-3">
                    <button
                      onClick={handleToggleFavorite}
                      className={cn(
                        "p-2.5 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95",
                        inFavorites ? "bg-primary text-primary-foreground" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {isFavoriteActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-5 w-5", inFavorites && "fill-current")} />}
                    </button>
                    <button
                      onClick={handleQuickLog}
                      className={cn(
                        "p-2.5 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95",
                        hasWatched ? "bg-green-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {isActionLoading === 'log' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={handleAddToListTrigger}
                      className="p-2.5 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity cursor-pointer z-10",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <Play className="h-8 w-8 text-white fill-current translate-x-0.5" />
                    </div>
                  </a>
                )}
              </div>
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

            {/* Backdrop Carousel - Below Poster */}
            {movie.backdrops && movie.backdrops.length > 0 && (
              <div className="mt-8">
                <div className="relative">
                  <div className="relative h-[250px] rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={movie.backdrops[selectedBackdropIndex].url}
                      alt={`${movie.title} backdrop ${selectedBackdropIndex + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

                    {movie.backdrops.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedBackdropIndex((prev) => (prev > 0 ? prev - 1 : movie.backdrops!.length - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 hover:bg-background transition-colors shadow-lg"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedBackdropIndex((prev) => (prev < movie.backdrops!.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 hover:bg-background transition-colors shadow-lg"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                          {movie.backdrops.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedBackdropIndex(index)}
                              className={`h-1.5 rounded-full transition-all ${index === selectedBackdropIndex
                                ? 'w-6 bg-primary'
                                : 'w-1.5 bg-white/50 hover:bg-white/70'
                                }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Production Companies - Below Carousel */}
            {movie.productionCompanies && movie.productionCompanies.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Production Companies</p>
                <div className="flex flex-wrap gap-3 items-center">
                  {movie.productionCompanies.map((company) => (
                    <div key={company.id} className="flex items-center">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          loading="lazy"
                          className="h-8 object-contain filter brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              const textDiv = document.createElement('div');
                              textDiv.className = 'text-xs text-muted-foreground';
                              textDiv.textContent = company.name;
                              parent.appendChild(textDiv);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{company.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Right Column: Narrative & Credits */}
          <main className="max-w-4xl pt-0 lg:pt-4">
            {/* Header Identity - Hidden on Mobile (shown in compact top layout) */}
            <div className="hidden lg:block mb-8">
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

            {/* Community Intelligence */}
            <div className="mb-10 p-4 bg-muted/20 border border-border/40 rounded-lg space-y-4">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Community Rating</p>
                  <CommunityRatingMeter
                    average={communityData?.averageRating || 0}
                    totalRatings={communityData?.totalRatings || 0}
                    userRating={userInteraction.rating}
                  />
                  {!communityData?.totalRatings && (
                    <p className="text-xs text-muted-foreground italic mt-1">Be the first to rate this film!</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Community Genres</p>
                  </div>
                  <GenreTagger
                    mediaId={id || ""}
                    mediaType="movie"
                    topGenres={communityData?.topGenres || []}
                    userGenres={userInteraction.genres}
                    onVoteComplete={async () => {
                      if (user && id) {
                        const updated = await getUserCommunityInteraction(user.uid, id, 'movie');
                        setUserInteraction(prev => ({ ...prev, genres: updated.genres }));
                        const newCommData = await getCommunityRating(id, 'movie');
                        setCommunityData(newCommData);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

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

            {/* Videos Section */}
            {movie.videos && movie.videos.length > 0 && (
              <div className="mb-16">
                <H3 className="text-xl mb-4">Videos & Trailers</H3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {movie.videos.slice(0, 6).map((video) => (
                    <button
                      key={video.key}
                      onClick={() => {
                        setSelectedVideo(video.key);
                        setIsVideoModalOpen(true);
                      }}
                      className="relative group aspect-video bg-muted rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
                          <Play className="h-6 w-6 text-white fill-current translate-x-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                        <p className="text-sm font-medium text-white line-clamp-2">{video.name}</p>
                        <p className="text-xs text-white/70 mt-1">{video.type}</p>
                      </div>
                      <img
                        src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                        alt={video.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                        }}
                      />
                    </button>
                  ))}
                </div>
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

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <section className="mt-12">
                <SimilarMoviesSection title={`Similar to ${movie.title}`} movies={similarMovies} />
              </section>
            )}
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

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsVideoModalOpen(false)}>
          <div className="relative w-full max-w-5xl mx-4 aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-20 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 hover:bg-background transition-colors shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </Layout>
  );
}



// Horizontal Scroll Component for Similar Movies
function SimilarMoviesSection({ title, movies }: { title: string; movies: Movie[] }) {
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
  }, [movies]);

  return (
    <div>
      <H2 className="mb-6">{title}</H2>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-background/90 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((item) => (
            <div key={item.id} className="flex-none w-[144px]">
              <MovieCard movie={item} size="md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
