import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MovieCardProps {
  movie: Movie;
  showRating?: boolean;
  rating?: number;
  size?: "sm" | "md" | "lg";
}

export function MovieCard({ movie, showRating, rating, size = "md" }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sizeClasses = {
    sm: "w-20",
    md: "w-28",
    lg: "w-36",
  };

  return (
    <Link
      to={`/${movie.mediaType === 'tv' ? 'tv' : 'movie'}/${movie.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("relative", sizeClasses[size])}>
        {/* Poster */}
        <div className="aspect-[2/3] bg-muted rounded-sm overflow-hidden border border-border">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-xs text-center px-1 leading-tight">
                {movie.title}
              </span>
            </div>
          )}
        </div>

        {/* Hover Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg z-50 min-w-[140px] max-w-[200px] pointer-events-none">
            <p className="text-sm font-medium text-foreground mb-1 truncate">
              {movie.title}
            </p>
            {movie.mediaType === 'tv' && movie.createdBy && movie.createdBy.length > 0 ? (
              <p className="text-xs text-muted-foreground truncate">
                {movie.createdBy[0].name}
              </p>
            ) : movie.director ? (
              <p className="text-xs text-muted-foreground truncate">
                {movie.director}
              </p>
            ) : null}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
          </div>
        )}

        {/* Rating badge */}
        {showRating && rating !== undefined && (
          <div className="absolute -bottom-1 -right-1 bg-foreground text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-sm">
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Title (optional for larger sizes) */}
      {size !== "sm" && (
        <div className="mt-2 group-hover:underline decoration-border underline-offset-4">
          <p className="text-[13px] md:text-sm font-medium leading-tight truncate">
            {movie.title}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-medium tracking-tight uppercase">
            {movie.year}
          </p>
        </div>
      )}
    </Link>
  );
}
