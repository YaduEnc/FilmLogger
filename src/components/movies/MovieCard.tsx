import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, memo } from "react";
import { Star, Heart, Check, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toggleFavorite, isFavorite, getMovieLogs, createLogEntry } from "@/lib/db";
import { toast } from "sonner";
import { AddToListModal } from "./AddToListModal";
import { CreateListModal } from "./CreateListModal";

interface MovieCardProps {
  movie: Movie;
  showRating?: boolean;
  rating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function MovieCardComponent({ movie, showRating, rating, size = "md", className }: MovieCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Check status when user clicks/interacts (not on hover)
  const checkStatusOnInteraction = useCallback(async () => {
    if (!user || isLiked !== false || isLogged !== false) return;
    try {
      const [fav, logs] = await Promise.all([
        isFavorite(user.uid, movie.id, movie.mediaType || 'movie'),
        getMovieLogs(user.uid, movie.id, movie.mediaType || 'movie')
      ]);
      setIsLiked(fav);
      setIsLogged(logs.length > 0);
    } catch (error) {
      // Silently fail - status will be checked on interaction
    }
  }, [user, movie.id, movie.mediaType, isLiked, isLogged]);

  const handleToggleLike = async (e: React.MouseEvent | React.FocusEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Sign in to like films");

    // Optimistic update - update UI immediately
    const previousState = isLiked;
    const optimisticState = !isLiked;
    setIsLiked(optimisticState);
    setIsActionLoading('like');

    try {
      const newState = await toggleFavorite(user.uid, movie);
      // Only update if server response differs (shouldn't happen, but safety check)
      if (newState !== optimisticState) {
        setIsLiked(newState);
      }
      toast.success(newState ? `Added ${movie.title} to favorites` : `Removed ${movie.title} from favorites`);
    } catch (err) {
      // Rollback on error
      setIsLiked(previousState);
      toast.error("Failed to update favorite");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleQuickLog = async (e: React.MouseEvent | React.FocusEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Sign in to log films");
    if (isLogged) return toast.info("Already logged");

    // Optimistic update - update UI immediately
    const previousState = isLogged;
    setIsLogged(true);
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
      toast.success(`Logged ${movie.title} as watched`);
    } catch (err) {
      // Rollback on error
      setIsLogged(previousState);
      toast.error("Failed to log film");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleAddToList = (e: React.MouseEvent | React.FocusEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Sign in to manage collections");
    setIsAddToListOpen(true);
  };

  // Mobile Long Press
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  const sizeClasses = {
    sm: "w-[138px] sm:w-[148px]",
    md: "w-[152px] sm:w-[168px] lg:w-[176px]",
    lg: "w-[176px] sm:w-[200px] lg:w-[216px]",
  };

  // Get director or creator
  const directorOrCreator = movie.mediaType === 'tv' && movie.createdBy && movie.createdBy.length > 0
    ? movie.createdBy[0].name
    : movie.director;

  // Get rating (use provided rating or movie rating)
  const displayRating = rating !== undefined ? rating : movie.rating;

  return (
    <Link
      to={`/${movie.mediaType === 'tv' ? 'tv' : 'movie'}/${movie.id}`}
      className={cn("block group/card outline-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => {
        setIsHovered(true);
        checkStatusOnInteraction();
      }}
      onBlur={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={checkStatusOnInteraction}
    >
      <div className={cn("relative transition-all duration-500 group/container", sizeClasses[size], "w-full")}>
        {/* Poster Container */}
        <div className={cn(
          "aspect-[2/3] bg-muted/20 relative overflow-hidden border border-white/8 shadow-md transition-all duration-500",
          isHovered ? "shadow-[0_20px_50px_rgba(0,0,0,0.42)] scale-[1.02] z-30" : "z-0"
        )}>
          {/* Poster Image */}
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              loading="lazy"
                className={cn(
                  "w-full h-full object-cover transition-all duration-700",
                  isHovered ? "scale-105 grayscale-[0.08]" : "scale-100 grayscale-[0.28]"
                )}
              />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-xs text-center px-2 font-mono uppercase tracking-widest text-muted-foreground/60">
                {movie.title}
              </span>
            </div>
          )}

          {/* Language & Region Badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            {movie.language && movie.language !== 'EN' && (
              <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 border border-white/10 rounded-none">
                <span className="font-mono text-[8px] font-bold text-white tracking-[0.18em] uppercase">
                  {movie.language === 'HI' ? 'Hindi' :
                    movie.language === 'TA' ? 'Tamil' :
                      movie.language === 'TE' ? 'Telugu' :
                        movie.language === 'ML' ? 'Malayalam' :
                          movie.language === 'KN' ? 'Kannada' :
                            movie.language === 'BN' ? 'Bengali' : movie.language}
                </span>
              </div>
            )}
            {movie.region === 'IN' && (
              <div className="bg-primary/20 backdrop-blur-md px-1.5 py-0.5 border border-primary/20 rounded-none">
                <span className="font-mono text-[8px] font-bold text-primary tracking-widest uppercase">
                  India
                </span>
              </div>
            )}
          </div>

          {/* Top Gradient for contrast if needed (optional, keeping minimal) */}


          {/* Action Touchpoint Overlay (Glassmorphic Strip) */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 p-2.5 z-20 transition-all duration-300 ease-out translate-y-full opacity-0",
            (isHovered || isActionLoading) && "translate-y-0 opacity-100"
          )}>
            <div className="flex items-center justify-between gap-1 bg-black/70 backdrop-blur-xl border border-white/10 p-1 shadow-2xl">
              <button
                onClick={handleToggleLike}
                className={cn(
                  "flex-1 flex items-center justify-center p-1.5 transition-all hover:bg-white/10 outline-none group/btn",
                  isLiked ? "text-primary" : "text-white/70 hover:text-white"
                )}
                aria-label="Like"
              >
                {isActionLoading === 'like' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart className={cn("h-3.5 w-3.5 transition-transform group-hover/btn:scale-110", isLiked && "fill-current")} />
                )}
              </button>

              <div className="w-px h-3 bg-white/10" />

              <button
                onClick={handleQuickLog}
                className={cn(
                  "flex-1 flex items-center justify-center p-1.5 transition-all hover:bg-white/10 outline-none group/btn",
                  isLogged ? "text-green-500" : "text-white/70 hover:text-white"
                )}
                aria-label="Log"
              >
                {isActionLoading === 'log' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
                )}
              </button>

              <div className="w-px h-3 bg-white/10" />

              <button
                onClick={handleAddToList}
                className="flex-1 flex items-center justify-center p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-all outline-none group/btn"
                aria-label="Add to List"
              >
                <Plus className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        {size !== "sm" && (
          <div className="mt-3 space-y-1">
            <h3 className={cn(
              "font-serif text-[15px] font-bold leading-tight uppercase tracking-tight text-foreground transition-colors duration-300",
              isHovered ? "text-primary" : "text-foreground"
            )}>
              <span className="line-clamp-1">{movie.title}</span>
            </h3>
            <div className="flex items-center gap-2.5 min-h-[1rem]">
              {movie.year && (
                <span className="font-mono text-[10px] text-muted-foreground/60 tracking-[0.16em] uppercase">
                  {movie.year}
                </span>
              )}
              {directorOrCreator && size === "lg" && (
                <>
                  <div className="h-px w-3 bg-white/10" />
                  <span className="font-mono text-[9px] text-muted-foreground/40 tracking-[0.16em] uppercase truncate max-w-[96px]">
                    {directorOrCreator}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddToListModal
        movie={movie}
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        onCreateNew={() => setIsCreateListOpen(true)}
      />
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onSuccess={() => setIsAddToListOpen(true)}
      />
    </Link>
  );
}

export const MovieCard = memo(MovieCardComponent, (prevProps, nextProps) => {
  return prevProps.movie.id === nextProps.movie.id &&
    prevProps.rating === nextProps.rating &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className;
});
