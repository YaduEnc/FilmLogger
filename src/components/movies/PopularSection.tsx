import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Trending on CineLunatic</h2>
      </div>

      {renderMovieGrid(trendingMovies)}
    </div>
  );
}
