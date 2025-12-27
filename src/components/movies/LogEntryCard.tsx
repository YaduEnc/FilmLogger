import { Link } from "react-router-dom";
import { LogEntry } from "@/types/movie";
import { StarRating } from "./StarRating";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react";

interface LogEntryCardProps {
  entry: LogEntry;
  showMovie?: boolean;
}

export function LogEntryCard({ entry, showMovie = true }: LogEntryCardProps) {
  return (
    <article className="py-4 border-b border-border last:border-0">
      <div className="flex gap-4">
        {/* Poster */}
        {showMovie && (
          <Link to={`/movie/${entry.movieId}`} className="shrink-0">
            <div className="w-16 aspect-[2/3] bg-muted rounded-sm overflow-hidden border border-border">
              {entry.movie.posterUrl ? (
                <img
                  src={entry.movie.posterUrl}
                  alt={entry.movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground text-center px-1">
                    {entry.movie.title}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              {showMovie && (
                <Link
                  to={`/movie/${entry.movieId}`}
                  className="font-medium hover:underline underline-offset-2"
                >
                  {entry.movie.title}
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <time>{format(new Date(entry.watchedDate), "MMM d, yyyy")}</time>
                {entry.isRewatch && (
                  <span className="flex items-center gap-0.5">
                    <RotateCcw className="h-3 w-3" />
                    <span>×{entry.rewatchCount}</span>
                  </span>
                )}
              </div>
            </div>
            <StarRating rating={entry.rating} readonly size="sm" />
          </div>

          {/* Review */}
          {entry.reviewShort && (
            <p className="mt-2 text-sm leading-relaxed line-clamp-3">
              {entry.reviewShort}
            </p>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
