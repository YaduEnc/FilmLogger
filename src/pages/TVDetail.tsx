import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Plus, Clock, List, RotateCcw, Loader2, Play, Star, ChevronRight, Check, Heart, Tv, X, ChevronLeft } from "lucide-react";
import { Movie, LogEntry } from "@/types/movie";
import { getTVDetails, getTVSeasonDetails } from "@/lib/tmdb";
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
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [selectedBackdropIndex, setSelectedBackdropIndex] = useState(0);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
    const [seasonDetails, setSeasonDetails] = useState<{ [key: number]: any }>({});
    const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
            {/* Hero Backdrop Section - Small on Mobile */}
            {movie.backdropUrl && (
                <div className="relative w-full h-[120px] sm:h-[200px] lg:h-[450px] overflow-hidden">
                    <img
                        src={movie.backdropUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover opacity-30 grayscale-[0.5]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
            )}

            <div className={`container mx-auto px-4 sm:px-6 ${movie.backdropUrl ? "-mt-16 sm:-mt-24 lg:-mt-60" : "py-6 sm:py-12"} relative z-10`}>
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
                                {movie.numberOfSeasons && (
                                    <span>{movie.numberOfSeasons} {movie.numberOfSeasons === 1 ? 'Season' : 'Seasons'}</span>
                                )}
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
                        <div className="relative group">
                            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden border border-border/50 shadow-2xl">
                                {movie.posterUrl ? (
                                    <img
                                        src={movie.posterUrl}
                                        alt={movie.title}
                                        loading="lazy"
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
                                                            className={`h-1.5 rounded-full transition-all ${
                                                                index === selectedBackdropIndex
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
                                        <span className={`font-medium px-2 py-1 rounded ${
                                            movie.status === 'Returning Series' ? 'bg-green-500/20 text-green-500' :
                                            movie.status === 'Ended' ? 'bg-red-500/20 text-red-500' :
                                            movie.status === 'In Production' ? 'bg-blue-500/20 text-blue-500' :
                                            'bg-muted text-foreground'
                                        }`}>
                                            {movie.status}
                                        </span>
                                    </div>
                                )}
                                {movie.networks && movie.networks.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground">Network</span>
                                        <div className="flex items-center gap-2">
                                            {movie.networks.map((network) => (
                                                <Link 
                                                    key={network.id} 
                                                    to={`/network/${network.id}`}
                                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                                                >
                                                    {network.logoUrl ? (
                                                        <img
                                                            src={network.logoUrl}
                                                            alt={network.name}
                                                            loading="lazy"
                                                            className="h-6 object-contain filter brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">{network.name}</span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {movie.lastAirDate && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Last Air Date</span>
                                        <span className="font-medium text-foreground">{new Date(movie.lastAirDate).toLocaleDateString()}</span>
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

                        {/* Videos Section */}
                        {movie.videos && movie.videos.length > 0 && (
                            <div className="mb-16">
                                <H3 className="text-xl mb-4">Videos & Trailers</H3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        {/* Seasons & Episodes Section */}
                        {movie.seasons && movie.seasons.length > 0 && (
                            <section className="mb-16">
                                <H2 className="mb-6">Seasons & Episodes</H2>
                                <div className="space-y-4">
                                    {movie.seasons.map((season) => {
                                        const isExpanded = expandedSeasons.has(season.season_number);
                                        const hasEpisodes = seasonDetails[season.season_number]?.episodes?.length > 0;

                                        const loadSeasonDetails = async () => {
                                            if (!id || seasonDetails[season.season_number]) return;
                                            try {
                                                const details = await getTVSeasonDetails(parseInt(id), season.season_number);
                                                setSeasonDetails(prev => ({ ...prev, [season.season_number]: details }));
                                            } catch (error) {
                                                console.error("Failed to load season details:", error);
                                            }
                                        };

                                        return (
                                            <div key={season.id} className="border border-border/40 bg-muted/5 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => {
                                                        if (!isExpanded) {
                                                            loadSeasonDetails();
                                                            setExpandedSeasons(prev => new Set(prev).add(season.season_number));
                                                        } else {
                                                            setExpandedSeasons(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.delete(season.season_number);
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                    className="w-full flex gap-4 p-4 hover:bg-muted/10 transition-colors text-left"
                                                >
                                            <div className="w-16 h-24 bg-muted rounded shrink-0 overflow-hidden">
                                                {season.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} loading="lazy" className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                                        <Tv className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-lg">{season.name}</h4>
                                                                <p className="text-muted-foreground text-sm mb-2">
                                                                    {season.episode_count} Episodes • {season.air_date?.split('-')[0]}
                                                                </p>
                                                {season.overview && (
                                                                    <p className="text-sm text-foreground/80 line-clamp-2">{season.overview}</p>
                                                                )}
                                                            </div>
                                                            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    </div>
                                                </button>
                                                {isExpanded && hasEpisodes && (
                                                    <div className="border-t border-border/40 p-4 space-y-3 max-h-[600px] overflow-y-auto">
                                                        {seasonDetails[season.season_number].episodes.map((episode: any) => (
                                                            <div key={episode.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                                                {episode.still_path && (
                                                                    <img
                                                                        src={episode.still_path}
                                                                        alt={episode.name}
                                                                        loading="lazy"
                                                                        className="w-32 h-20 object-cover rounded shrink-0"
                                                                    />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                                        <div>
                                                                            <p className="font-medium text-sm">
                                                                                Episode {episode.episode_number}: {episode.name}
                                                                            </p>
                                                                            {episode.air_date && (
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {new Date(episode.air_date).toLocaleDateString()}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {episode.vote_average && (
                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                <Star className="h-3 w-3 fill-primary text-primary" />
                                                                                <span className="text-xs font-medium">{episode.vote_average.toFixed(1)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {episode.overview && (
                                                                        <p className="text-xs text-foreground/70 line-clamp-2">{episode.overview}</p>
                                                                    )}
                                                                    {episode.runtime && (
                                                                        <p className="text-xs text-muted-foreground mt-1">{episode.runtime} min</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
