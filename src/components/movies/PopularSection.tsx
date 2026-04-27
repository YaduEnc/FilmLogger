import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUnifiedTrending } from '@/lib/db';
import { TrendingUp, Star, Film, Loader2 } from 'lucide-react';
import { MovieCard } from './MovieCard';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="font-serif text-3xl sm:text-[2.1rem] font-bold tracking-tight uppercase">Trending on CineLunatic</h2>
        <p className="font-serif text-sm text-foreground/58 max-w-xl">
          A cleaner read on what the network is actually watching.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8">
        {trendingMovies.map((movie, index) => (
          <Link
            key={movie.id}
            to={`/${movie.mediaType}/${movie.movieId}`}
            className="group/rank relative max-w-[176px]"
          >
            <div className="absolute top-2 left-2 z-30">
              <div className="bg-black/70 backdrop-blur-md text-white font-mono text-[10px] font-bold px-2 py-1 rounded-none border border-white/10 tracking-[0.14em]">
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>

            <MovieCard
              movie={{
                id: movie.movieId,
                title: movie.title,
                posterUrl: movie.posterUrl,
                year: undefined,
                mediaType: movie.mediaType
              }}
              size="md"
            />

            <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
              {movie.weeklyLogs > 0 && (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  {movie.weeklyLogs}
                </span>
              )}
              {movie.avgRating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 text-primary" />
                  {movie.avgRating.toFixed(1)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
