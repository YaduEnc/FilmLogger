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
}

export function MovieCard({ movie, showRating, rating, size = "md" }: MovieCardProps) {
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
      className="block group/card outline-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn("relative transition-all duration-500", sizeClasses[size])}>
        {/* Poster Container with Glassmorphic Frame */}
        <div className={cn(
          "aspect-[2/3] bg-muted rounded-none overflow-hidden transition-all duration-700 relative z-0 transform-gpu",
          isHovered ? "scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30" : "shadow-md"
        )}>
          {/* Persistent Border Overlay */}
          <div className="absolute inset-0 border border-white/5 rounded-none pointer-events-none z-50" />
          {/* Subtle Reflection Overlay on Hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 pointer-events-none z-10",
            isHovered && "opacity-100"
          )} />

          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              loading="lazy"
              className={cn(
                "w-full h-full object-cover transition-all duration-[1.5s] ease-out",
                isHovered ? "scale-110 grayscale-0" : "scale-100 grayscale-[0.4]"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-white/5">
              <span className="text-xs text-center px-2 leading-tight font-serif italic">
                {movie.title}
              </span>
            </div>
          )}

          {/* Kinetic Hover Overlay with Quick Actions - Theme Aware */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent transition-all duration-500 flex flex-col justify-end p-4 z-20",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          )}>
            <div className="flex items-center justify-center gap-2 mb-3 scale-90 group-hover/card:scale-100 transition-transform duration-500 delay-100">
              <button
                onClick={handleToggleLike}
                className={cn(
                  "p-2 rounded-none backdrop-blur-3xl border border-white/10 transition-all hover:scale-110 active:scale-90",
                  isLiked ? "bg-primary text-primary-foreground border-primary" : "bg-black/40 text-foreground hover:bg-black/60"
                )}
              >
                {isActionLoading === 'like' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />}
              </button>
              <button
                onClick={handleQuickLog}
                className={cn(
                  "p-2 rounded-none backdrop-blur-3xl border border-white/10 transition-all hover:scale-110 active:scale-90",
                  isLogged ? "bg-green-500/80 text-white border-green-500/50" : "bg-black/40 text-foreground hover:bg-black/60"
                )}
              >
                {isActionLoading === 'log' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleAddToList}
                className="p-2 rounded-none bg-black/40 text-foreground backdrop-blur-3xl border border-white/10 hover:bg-black/60 transition-all hover:scale-110 active:scale-90"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {displayRating !== undefined && (
              <div className="flex items-center justify-center gap-1.5 mb-1 px-3 py-1 bg-black/60 backdrop-blur-md rounded-none w-fit mx-auto border border-white/5">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-mono text-[10px] font-bold text-foreground tracking-[0.2em]">
                  {displayRating.toFixed(1)}
                </span>
              </div>
            )}

            {directorOrCreator && (
              <p className="font-mono text-[8px] text-muted-foreground/60 uppercase tracking-[0.4em] text-center truncate">
                {directorOrCreator}
              </p>
            )}
          </div>
        </div>

        {/* Rating badge (always visible if showRating is true) */}
        {showRating && rating !== undefined && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground font-mono text-[10px] font-bold px-2 py-1 rounded-none z-40 shadow-xl border border-primary/20">
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Refined Metadata Typography */}
      {size !== "sm" && (
        <div className={cn(
          "mt-4 transition-all duration-500 transform",
          isHovered ? "translate-y-1" : "translate-y-0"
        )}>
          <p className="font-serif text-[13px] md:text-sm font-bold leading-tight truncate tracking-tight text-foreground group-hover/card:text-primary transition-colors uppercase">
            {movie.title}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="h-px w-4 bg-primary/30" />
            <p className="font-mono text-[9px] text-muted-foreground/50 tracking-[0.4em] uppercase">
              {movie.year}
            </p>
          </div>
        </div>
      )}
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
