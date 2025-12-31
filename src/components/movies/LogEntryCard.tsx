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
    <article className="py-6 border-b border-white/5 last:border-0 group/log">
      <div className="flex gap-4">
        {/* Poster */}
        {showMovie && (
          <Link to={`/${entry.mediaType || 'movie'}/${entry.movieId}`} className="shrink-0">
            <div className="w-16 aspect-[2/3] bg-muted rounded-none overflow-hidden border border-white/5 grayscale group-hover/log:grayscale-0 transition-all duration-500">
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
                  to={`/${entry.mediaType || 'movie'}/${entry.movieId}`}
                  className="font-serif text-lg font-bold hover:text-primary transition-colors uppercase tracking-tight"
                >
                  {entry.movie.title}
                </Link>
              )}
              <div className="flex items-center gap-3 text-muted-foreground mt-1">
                <time className="font-mono text-[10px] uppercase tracking-[0.2em]">{format(new Date(entry.watchedDate), "dd MMM yyyy")}</time>
                {entry.isRewatch && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-primary/60 uppercase tracking-widest">
                    <RotateCcw className="h-3 w-3" />
                    <span>REV / {entry.rewatchCount}</span>
                  </span>
                )}
              </div>
            </div>
            <StarRating rating={entry.rating} readonly size="sm" />
          </div>

          {/* Review */}
          {entry.reviewShort && (
            <p className="mt-3 text-[13px] leading-relaxed line-clamp-3 text-foreground/80 font-serif italic border-l border-white/10 pl-4">
              "{entry.reviewShort}"
            </p>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest border border-white/5 px-2 py-0.5"
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
