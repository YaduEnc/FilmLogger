import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DisplayH2 } from '@/components/ui/typography';
import { getUnifiedTrending } from '@/lib/db';
import { TrendingUp, Heart, MessageSquare, Star, Film, Loader2, Eye } from 'lucide-react';

interface PopularMovie {
  id: string;
  movieId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl: string;
  logCount: number;
  favoriteCount: number;
  reviewCount: number;
  avgRating: number;
  weeklyLogs: number;
  monthlyLogs: number;
  commentCount?: number;
  trendingScore?: number;
}

export function PopularSection() {
  const [trendingMovies, setTrendingMovies] = useState<PopularMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    setIsLoading(true);
    try {
      const unified = await getUnifiedTrending(20);
      setTrendingMovies(unified as any);
    } catch (error) {
      console.error('Error loading popular movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMovieGrid = (movies: PopularMovie[]) => {
    if (movies.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p className="text-sm">No data yet</p>
          <p className="text-xs mt-1">Start logging movies to see popular content!</p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 sm:gap-3">
        {movies.map((movie, index) => (
          <Link
            key={movie.id}
            to={`/${movie.mediaType}/${movie.movieId}`}
            className="group relative"
          >
            {/* Rank Badge */}
            <div className="absolute -top-1 -left-1 z-10 bg-primary text-primary-foreground rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-lg">
              #{index + 1}
            </div>

            {/* Poster */}
            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Overlay with combined stats */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1">
                  <p className="text-white text-[10px] font-medium line-clamp-2">{movie.title}</p>

                  {/* Combined metrics */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-white text-[9px]">
                    {movie.weeklyLogs > 0 && (
                      <div className="flex items-center gap-0.5">
                        <TrendingUp className="h-2.5 w-2.5" />
                        <span>{movie.weeklyLogs}</span>
                      </div>
                    )}
                    {movie.favoriteCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Heart className="h-2.5 w-2.5 fill-current" />
                        <span>{movie.favoriteCount}</span>
                      </div>
                    )}
                    {movie.avgRating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                        <span>{movie.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.commentCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <MessageSquare className="h-2.5 w-2.5" />
                        <span>{movie.commentCount}</span>
                      </div>
                    )}
                    {movie.logCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Eye className="h-2.5 w-2.5" />
                        <span>{movie.logCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Title below poster (always visible) */}
            <p className="mt-1 text-[10px] sm:text-xs font-medium line-clamp-2 text-center">{movie.title}</p>
          </Link>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
          <DisplayH2 className="text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tighter">Trending on CineLunatic</DisplayH2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
        {trendingMovies.map((movie, index) => (
          <Link
            key={movie.id}
            to={`/${movie.mediaType}/${movie.movieId}`}
            className="group/rank relative"
          >
            {/* Rank Badge - Archival Style */}
            <div className="absolute -top-3 -left-3 z-30 transition-transform duration-500 group-hover/rank:-translate-y-1 group-hover/rank:-translate-x-1">
              <div className="bg-primary text-primary-foreground font-black italic text-xl px-3 py-1 rounded-sm shadow-2xl border border-white/20 transform -rotate-12">
                #{index + 1}
              </div>
            </div>

            {/* Poster Container with Premium Treatment */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-xl transition-all duration-700 bg-muted group-hover/rank:scale-105 group-hover/rank:shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10">
              {/* Subtle Reflection Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 pointer-events-none z-10 group-hover/rank:opacity-100" />

              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover/rank:scale-110 group-hover/rank:rotate-1"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Film className="h-8 w-8 text-white/10" />
                </div>
              )}

              {/* Kinetic Stats Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover/rank:opacity-100 transition-all duration-500 flex flex-col justify-end p-4 z-20 translate-y-4 group-hover/rank:translate-y-0">
                <div className="flex flex-wrap gap-x-3 gap-y-2 text-white/90">
                  {movie.weeklyLogs > 0 && (
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      <TrendingUp className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[10px] font-black">{movie.weeklyLogs}</span>
                    </div>
                  )}
                  {movie.favoriteCount > 0 && (
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      <Heart className="h-2.5 w-2.5 fill-primary text-primary" />
                      <span className="text-[10px] font-black">{movie.favoriteCount}</span>
                    </div>
                  )}
                  {movie.avgRating > 0 && (
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                      <span className="text-[10px] font-black">{movie.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meta Data */}
            <div className="mt-4 px-1 opacity-80 group-hover/rank:opacity-100 transition-opacity">
              <p className="text-[13px] font-bold leading-tight truncate tracking-tight text-white/90 group-hover/rank:text-primary">
                {movie.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-px w-3 bg-white/10" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
