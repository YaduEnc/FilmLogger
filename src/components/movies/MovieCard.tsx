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
          "aspect-[2/3] bg-muted rounded-xl overflow-hidden transition-all duration-700 relative z-0 transform-gpu",
          isHovered ? "scale-[1.02] shadow-[0_15px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30" : "shadow-lg"
        )}>
          {/* Persistent Border Overlay to prevent chipping */}
          <div className="absolute inset-0 border border-border/50 rounded-xl pointer-events-none z-50" />
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
                "w-full h-full object-cover transition-transform duration-[1.5s] ease-out",
                isHovered && "scale-105"
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
                  "p-1.5 rounded-full backdrop-blur-3xl border border-border transition-all hover:scale-110 active:scale-90",
                  isLiked ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-foreground hover:bg-muted/50"
                )}
              >
                {isActionLoading === 'like' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />}
              </button>
              <button
                onClick={handleQuickLog}
                className={cn(
                  "p-1.5 rounded-full backdrop-blur-3xl border border-border transition-all hover:scale-110 active:scale-90",
                  isLogged ? "bg-green-500 text-white border-green-500" : "bg-muted/30 text-foreground hover:bg-muted/50"
                )}
              >
                {isActionLoading === 'log' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleAddToList}
                className="p-1.5 rounded-full bg-muted/30 text-foreground backdrop-blur-3xl border border-border hover:bg-muted/50 transition-all hover:scale-110 active:scale-90"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {displayRating !== undefined && (
              <div className="flex items-center justify-center gap-1.5 mb-1 px-2 py-1 bg-muted/50 backdrop-blur-md rounded-full w-fit mx-auto border border-border">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-[10px] font-black text-foreground tracking-widest">
                  {displayRating.toFixed(1)}
                </span>
              </div>
            )}

            {directorOrCreator && (
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] text-center truncate italic">
                {directorOrCreator}
              </p>
            )}
          </div>
        </div>

        {/* Rating badge (always visible if showRating is true) */}
        {showRating && rating !== undefined && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1 rounded-lg z-40 shadow-xl border border-border">
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
          <p className="text-[13px] md:text-sm font-bold leading-tight truncate tracking-tight text-foreground group-hover/card:text-primary transition-colors">
            {movie.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-3 bg-border" />
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">
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
