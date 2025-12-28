import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPopularMovies } from '@/lib/db';
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
}

export function PopularSection() {
  const [trendingMovies, setTrendingMovies] = useState<PopularMovie[]>([]);
  const [mostLogged, setMostLogged] = useState<PopularMovie[]>([]);
  const [mostFavorited, setMostFavorited] = useState<PopularMovie[]>([]);
  const [topRated, setTopRated] = useState<PopularMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    setIsLoading(true);
    try {
      const [trending, logged, favorited, rated] = await Promise.all([
        getPopularMovies('logs', 'week', 8),
        getPopularMovies('logs', 'all', 8),
        getPopularMovies('favorites', 'all', 8),
        getPopularMovies('rating', 'all', 8)
      ]);
      
      setTrendingMovies(trending as any);
      setMostLogged(logged as any);
      setMostFavorited(favorited as any);
      setTopRated(rated as any);
    } catch (error) {
      console.error('Error loading popular movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMovieGrid = (movies: PopularMovie[], showMetric: 'logs' | 'favorites' | 'rating' | 'weekly') => {
    if (movies.length === 0) {
      return (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No data yet</p>
          <p className="text-sm mt-1">Start logging movies to see popular content!</p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {movies.map((movie, index) => (
          <Link
            key={movie.id}
            to={`/${movie.mediaType}/${movie.movieId}`}
            className="group relative"
          >
            {/* Rank Badge */}
            <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
              #{index + 1}
            </div>

            {/* Poster */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              {/* Overlay with stats */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                  <p className="text-white text-xs font-medium line-clamp-2">{movie.title}</p>
                  
                  {showMetric === 'logs' && (
                    <div className="flex items-center gap-1 text-white text-xs">
                      <Eye className="h-3 w-3" />
                      <span>{movie.logCount} logs</span>
                    </div>
                  )}
                  
                  {showMetric === 'favorites' && (
                    <div className="flex items-center gap-1 text-white text-xs">
                      <Heart className="h-3 w-3 fill-current" />
                      <span>{movie.favoriteCount} favorites</span>
                    </div>
                  )}
                  
                  {showMetric === 'rating' && movie.avgRating > 0 && (
                    <div className="flex items-center gap-1 text-white text-xs">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span>{movie.avgRating.toFixed(1)}/10</span>
                    </div>
                  )}
                  
                  {showMetric === 'weekly' && (
                    <div className="flex items-center gap-1 text-white text-xs">
                      <TrendingUp className="h-3 w-3" />
                      <span>{movie.weeklyLogs} this week</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title below poster (always visible) */}
            <p className="mt-2 text-sm font-medium line-clamp-2 text-center">{movie.title}</p>
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Popular on CineLunatic</h2>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="logged" className="gap-2">
            <Eye className="h-4 w-4" />
            Most Logged
          </TabsTrigger>
          <TabsTrigger value="favorited" className="gap-2">
            <Heart className="h-4 w-4" />
            Most Favorited
          </TabsTrigger>
          <TabsTrigger value="rated" className="gap-2">
            <Star className="h-4 w-4" />
            Top Rated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          {renderMovieGrid(trendingMovies, 'weekly')}
        </TabsContent>

        <TabsContent value="logged">
          {renderMovieGrid(mostLogged, 'logs')}
        </TabsContent>

        <TabsContent value="favorited">
          {renderMovieGrid(mostFavorited, 'favorites')}
        </TabsContent>

        <TabsContent value="rated">
          {renderMovieGrid(topRated, 'rating')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
