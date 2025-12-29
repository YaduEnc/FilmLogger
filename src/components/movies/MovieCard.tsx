import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Star } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  showRating?: boolean;
  rating?: number;
  size?: "sm" | "md" | "lg";
}

export function MovieCard({ movie, showRating, rating, size = "md" }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("relative", sizeClasses[size])}>
        {/* Poster */}
        <div className={cn(
          "aspect-[2/3] bg-muted rounded-sm overflow-hidden border border-border transition-all duration-300",
          isHovered && "border-primary/50 shadow-lg shadow-primary/20"
        )}>
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              loading="lazy"
              className={cn(
                "w-full h-full object-cover transition-transform duration-300",
                isHovered && "scale-105"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-xs text-center px-1 leading-tight">
                {movie.title}
              </span>
            </div>
          )}
          
          {/* Hover Overlay with Rating and Director */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 flex flex-col justify-end p-3 z-10">
              {displayRating !== undefined && (
                <div className="flex items-center gap-1 mb-1.5">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-semibold text-white">
                    {displayRating.toFixed(1)}
                  </span>
                </div>
              )}
              {directorOrCreator && (
                <p className="text-xs text-white font-medium truncate leading-tight">
                  {directorOrCreator}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Rating badge (always visible if showRating is true) */}
        {showRating && rating !== undefined && (
          <div className="absolute -bottom-1 -right-1 bg-foreground text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-sm z-10">
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Title (optional for larger sizes) */}
      {size !== "sm" && (
        <div className={cn(
          "mt-2 transition-all",
          isHovered && "underline decoration-border underline-offset-4"
        )}>
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
