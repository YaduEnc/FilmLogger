import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPopularMovies, getMostCommentedToday } from '@/lib/db';
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
}

export function PopularSection() {
  const [trendingMovies, setTrendingMovies] = useState<PopularMovie[]>([]);
  const [mostLogged, setMostLogged] = useState<PopularMovie[]>([]);
  const [mostFavorited, setMostFavorited] = useState<PopularMovie[]>([]);
  const [topRated, setTopRated] = useState<PopularMovie[]>([]);
  const [mostCommented, setMostCommented] = useState<PopularMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    setIsLoading(true);
    try {
      const [trending, logged, favorited, rated, commented] = await Promise.all([
        getPopularMovies('logs', 'week', 8),
        getPopularMovies('logs', 'all', 8),
        getPopularMovies('favorites', 'all', 8),
        getPopularMovies('rating', 'all', 8),
        getMostCommentedToday(8)
      ]);
      
      setTrendingMovies(trending as any);
      setMostLogged(logged as any);
      setMostFavorited(favorited as any);
      setTopRated(rated as any);
      setMostCommented(commented as any);
    } catch (error) {
      console.error('Error loading popular movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMovieGrid = (movies: PopularMovie[], showMetric: 'logs' | 'favorites' | 'rating' | 'weekly' | 'comments') => {
    if (movies.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p className="text-sm">No data yet</p>
          <p className="text-xs mt-1">Start logging movies to see popular content!</p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2">
        {movies.map((movie, index) => (
          <Link
            key={movie.id}
            to={`/${movie.mediaType}/${movie.movieId}`}
            className="group relative"
          >
            {/* Rank Badge */}
            <div className="absolute -top-1 -left-1 z-10 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
              #{index + 1}
            </div>

            {/* Poster */}
            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Overlay with stats */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
                  <p className="text-white text-[10px] font-medium line-clamp-2">{movie.title}</p>
                  
                  {showMetric === 'logs' && (
                    <div className="flex items-center gap-1 text-white text-[10px]">
                      <Eye className="h-2.5 w-2.5" />
                      <span>{movie.logCount} logs</span>
                    </div>
                  )}
                  
                  {showMetric === 'favorites' && (
                    <div className="flex items-center gap-1 text-white text-[10px]">
                      <Heart className="h-2.5 w-2.5 fill-current" />
                      <span>{movie.favoriteCount} favorites</span>
                    </div>
                  )}
                  
                  {showMetric === 'rating' && movie.avgRating > 0 && (
                    <div className="flex items-center gap-1 text-white text-[10px]">
                      <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                      <span>{movie.avgRating.toFixed(1)}/10</span>
                    </div>
                  )}
                  
                  {showMetric === 'weekly' && (
                    <div className="flex items-center gap-1 text-white text-[10px]">
                      <TrendingUp className="h-2.5 w-2.5" />
                      <span>{movie.weeklyLogs} this week</span>
                    </div>
                  )}
                  
                  {showMetric === 'comments' && (
                    <div className="flex items-center gap-1 text-white text-[10px]">
                      <MessageSquare className="h-2.5 w-2.5" />
                      <span>{movie.commentCount || 0} comments today</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title below poster (always visible) */}
            <p className="mt-1 text-xs font-medium line-clamp-2 text-center">{movie.title}</p>
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
        <h2 className="text-xl font-bold">Popular on CineLunatic</h2>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4 h-9">
          <TabsTrigger value="trending" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="logged" className="gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" />
            Most Logged
          </TabsTrigger>
          <TabsTrigger value="favorited" className="gap-1.5 text-xs">
            <Heart className="h-3.5 w-3.5" />
            Most Favorited
          </TabsTrigger>
          <TabsTrigger value="rated" className="gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5" />
            Top Rated
          </TabsTrigger>
          <TabsTrigger value="commented" className="gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            Most Commented
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

        <TabsContent value="commented">
          {renderMovieGrid(mostCommented, 'comments')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
