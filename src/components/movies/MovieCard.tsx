import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
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
  className?: string; // Added className prop
}

export function MovieCard({ movie, showRating, rating, size = "md", className }: MovieCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (user && isHovered) {
        try {
          const [fav, logs] = await Promise.all([
            isFavorite(user.uid, movie.id, movie.mediaType || 'movie'),
            getMovieLogs(user.uid, movie.id, movie.mediaType || 'movie')
          ]);
          setIsLiked(fav);
          setIsLogged(logs.length > 0);
        } catch (error) {
          console.error("Error checking card status:", error);
        }
      }
    }
    checkStatus();
  }, [user, movie.id, movie.mediaType, isHovered]);

  const handleToggleLike = async (e: React.MouseEvent | React.FocusEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Sign in to like films");

    setIsActionLoading('like');
    try {
      const newState = await toggleFavorite(user.uid, movie);
      setIsLiked(newState);
      toast.success(newState ? `Added ${movie.title} to favorites` : `Removed ${movie.title} from favorites`);
    } catch (err) {
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
      setIsLogged(true);
      toast.success(`Logged ${movie.title} as watched`);
    } catch (err) {
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
    sm: "w-24",
    md: "w-36",
    lg: "w-44",
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
      className={cn("block group/card outline-none", className)} // Added className here
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn("relative transition-all duration-500 group/container", sizeClasses[size], "w-full")}>
        {/* Poster Container */}
        <div className={cn(
          "aspect-[2/3] bg-muted/20 relative overflow-hidden shadow-md transition-all duration-500",
          isHovered ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-[1.02] z-30" : "z-0"
        )}>
          {/* Poster Image */}
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              loading="lazy"
              className={cn(
                "w-full h-full object-cover transition-all duration-700",
                isHovered ? "scale-105 grayscale-[0.2]" : "scale-100 grayscale-[0.5]"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-xs text-center px-2 font-mono uppercase tracking-widest text-muted-foreground/60">
                {movie.title}
              </span>
            </div>
          )}

          {/* Top Gradient for contrast if needed (optional, keeping minimal) */}

          {/* Rating Badge - Top Right */}
          {displayRating !== undefined && displayRating > 0 && (
            <div className="absolute top-3 right-3 z-20">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1.5 shadow-lg">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-mono text-[10px] font-bold text-white tracking-widest">
                  {displayRating.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Action Touchpoint Overlay (Glassmorphic Strip) */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 p-3 z-20 transition-all duration-300 ease-out translate-y-full opacity-0",
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
          <div className="mt-4 space-y-1">
            <h3 className={cn(
              "font-serif text-sm font-bold leading-tight uppercase tracking-tight text-foreground transition-colors duration-300",
              isHovered ? "text-primary" : "text-foreground"
            )}>
              <span className="line-clamp-1">{movie.title}</span>
            </h3>
            <div className="flex items-center gap-3">
              {movie.year && (
                <span className="font-mono text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase">
                  {movie.year}
                </span>
              )}
              {directorOrCreator && (
                <>
                  <div className="h-px w-3 bg-white/10" />
                  <span className="font-mono text-[9px] text-muted-foreground/40 tracking-[0.2em] uppercase truncate max-w-[80px]">
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
