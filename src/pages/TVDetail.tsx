import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Plus, Clock, List, RotateCcw, Loader2, Play, Star, ChevronRight, Check, Heart, Tv } from "lucide-react";
import { Movie, LogEntry } from "@/types/movie";
import { getTVDetails } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { getMovieLogs, toggleWatchlist, isInWatchlist, toggleFavorite, isFavorite } from "@/lib/db";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { CreateListModal } from "@/components/movies/CreateListModal";
import { AddToListModal } from "@/components/movies/AddToListModal";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { CommunityRatingMeter } from "@/components/movies/CommunityRatingMeter";
import { GenreTagger } from "@/components/movies/GenreTagger";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCommunityRating, getUserCommunityInteraction } from "@/lib/db";


export default function TVDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [inFavorites, setInFavorites] = useState(false);
    const [communityData, setCommunityData] = useState<any>(null);
    const [userInteraction, setUserInteraction] = useState<{ rating: number | null, genres: string[] }>({ rating: null, genres: [] });
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
                const movieData = await getTVDetails(parseInt(id));
                setMovie(movieData);

                if (user) {
                    const [logs, watchlistStatus, favoriteStatus] = await Promise.all([
                        getMovieLogs(user.uid, parseInt(id), 'tv'),
                        isInWatchlist(user.uid, parseInt(id), 'tv'),
                        isFavorite(user.uid, parseInt(id), 'tv')
                    ]);
                    setUserLogs(logs);
                    setInWatchlist(watchlistStatus);
                    setInFavorites(favoriteStatus);

                    const interaction = await getUserCommunityInteraction(user.uid, id, 'tv');
                    setUserInteraction(interaction);
                }

                const commData = await getCommunityRating(id, 'tv');
                setCommunityData(commData);
            } catch (err) {
                console.error("Failed to load tv show data:", err);
                setError("TV Show not found");
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
                    <p className="text-muted-foreground text-lg mb-4">{error || "Show not found"}</p>
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
                                {movie.numberOfSeasons && (
                                    <span>{movie.numberOfSeasons} {movie.numberOfSeasons === 1 ? 'Season' : 'Seasons'}</span>
                                )}
                                <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    <span className="text-foreground font-bold">{movie.rating?.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Key Personnel & Metadata */}
                        <div className="mb-8 space-y-4">
                            {movie.createdBy && movie.createdBy.length > 0 && (
                                <div className="text-base">
                                    <span className="text-muted-foreground mr-2">Created by</span>
                                    {movie.createdBy.map((creator, index) => (
                                        <span key={creator.id}>
                                            <span className="font-medium text-foreground">{creator.name}</span>
                                            {index < movie.createdBy!.length - 1 && ", "}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                {movie.status && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className="font-medium text-foreground">{movie.status}</span>
                                    </div>
                                )}
                                {movie.networks && movie.networks.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Network</span>
                                        <span className="font-medium text-foreground">{movie.networks.map(n => n.name).join(", ")}</span>
                                    </div>
                                )}
                                {movie.lastAirDate && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Last Air Date</span>
                                        <span className="font-medium text-foreground">{movie.lastAirDate}</span>
                                    </div>
                                )}
                            </div>

                            {(movie.castMembers && movie.castMembers.length > 0) || (movie.cast && movie.cast.length > 0) ? (
                                <p className="text-sm md:text-base leading-relaxed text-muted-foreground flow-root pt-2">
                                    <span className="text-foreground font-medium mr-2">Starring</span>
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
                                        <p className="text-xs text-muted-foreground italic mt-1">Be the first to rate this show!</p>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Community Genres</p>
                                    </div>
                                    <GenreTagger
                                        mediaId={id || ""}
                                        mediaType="tv"
                                        topGenres={communityData?.topGenres || []}
                                        userGenres={userInteraction.genres}
                                        onVoteComplete={async () => {
                                            if (user && id) {
                                                const updated = await getUserCommunityInteraction(user.uid, id, 'tv');
                                                setUserInteraction(prev => ({ ...prev, genres: updated.genres }));
                                                const newCommData = await getCommunityRating(id, 'tv');
                                                setCommunityData(newCommData);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Primary Actions */}
                        <div className="flex flex-wrap gap-3 mb-12">
                            <Link to={`/log?movie=${movie.id}&type=tv`}>
                                <Button size="lg" className="px-8 gap-2 shadow-lg shadow-primary/10">
                                    {hasWatched ? (
                                        <>
                                            <RotateCcw className="h-4 w-4" />
                                            Log rewatch
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            Log TV Show
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

                        {/* Seasons Section */}
                        {movie.seasons && movie.seasons.length > 0 && (
                            <section className="mb-16">
                                <H2 className="mb-6">Seasons</H2>
                                <div className="space-y-4">
                                    {movie.seasons.map((season) => (
                                        <div key={season.id} className="flex gap-4 p-4 rounded-xl border border-border/40 bg-muted/5">
                                            <div className="w-16 h-24 bg-muted rounded shrink-0 overflow-hidden">
                                                {season.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                                        <Tv className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-lg">{season.name}</h4>
                                                <p className="text-muted-foreground text-sm mb-2">{season.episode_count} Episodes • {season.air_date?.split('-')[0]}</p>
                                                {season.overview && (
                                                    <p className="text-sm text-foreground/80 line-clamp-2 md:line-clamp-none">{season.overview}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <Divider className="my-12 opacity-50" />

                        {/* Community Reviews Section */}
                        <ReviewSection movie={movie} />

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
