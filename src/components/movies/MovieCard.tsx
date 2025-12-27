import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  showRating?: boolean;
  rating?: number;
  size?: "sm" | "md" | "lg";
}

export function MovieCard({ movie, showRating, rating, size = "md" }: MovieCardProps) {
  const sizeClasses = {
    sm: "w-14",
    md: "w-20",
    lg: "w-28",
  };

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block"
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
