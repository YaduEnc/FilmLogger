import { useState, useEffect } from "react";
import { Movie } from "@/types/movie";
import { getUpcomingMovies, getUpcomingTV } from "@/lib/tmdb";
import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/button";
import { Calendar, Grid, Film, Tv, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingReleasesProps {
  viewMode?: 'grid' | 'calendar';
}

export function UpcomingReleases({ viewMode: initialViewMode = 'grid' }: UpcomingReleasesProps) {
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [upcomingTV, setUpcomingTV] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>(initialViewMode);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');

  useEffect(() => {
    async function loadUpcoming() {
      setIsLoading(true);
      try {
        const [moviesData, tvData] = await Promise.all([
          getUpcomingMovies(1),
          getUpcomingTV(1)
        ]);
        setUpcomingMovies(moviesData.movies.slice(0, 8));
        setUpcomingTV(tvData.movies.slice(0, 8));
      } catch (error) {
        console.error("Error loading upcoming releases:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUpcoming();
  }, []);

  const allUpcoming = [...upcomingMovies, ...upcomingTV].sort((a, b) => {
    const dateA = a.mediaType === 'tv' ? a.firstAirDate : a.year?.toString();
    const dateB = b.mediaType === 'tv' ? b.firstAirDate : b.year?.toString();
    return (dateA || '').localeCompare(dateB || '');
  });

  const displayItems = activeTab === 'all' ? allUpcoming : 
                      activeTab === 'movies' ? upcomingMovies : 
                      upcomingTV;

  // Group by release date for calendar view
  const groupedByDate = displayItems.reduce((acc, item) => {
    const releaseDate = item.mediaType === 'tv' 
      ? item.firstAirDate?.split('T')[0] 
      : item.year?.toString() ? `${item.year}-01-01` : 'TBA';
    
    if (!acc[releaseDate]) {
      acc[releaseDate] = [];
    }
    acc[releaseDate].push(item);
    return acc;
  }, {} as Record<string, Movie[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-serif font-bold">Upcoming Releases</h2>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="h-7 px-3 text-xs"
            >
              All
            </Button>
            <Button
              variant={activeTab === 'movies' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('movies')}
              className="h-7 px-3 text-xs"
            >
              <Film className="h-3 w-3 mr-1" />
              Movies
            </Button>
            <Button
              variant={activeTab === 'tv' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('tv')}
              className="h-7 px-3 text-xs"
            >
              <Tv className="h-3 w-3 mr-1" />
              TV
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="h-8 w-8 p-0"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {displayItems.map((item) => (
            <MovieCard key={item.id} movie={item} size="sm" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const items = groupedByDate[date];
            const formattedDate = date === 'TBA' 
              ? 'TBA' 
              : new Date(date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
            
            return (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {formattedDate}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {items.map((item) => (
                    <MovieCard key={item.id} movie={item} size="sm" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {displayItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No upcoming releases found.</p>
        </div>
      )}
    </div>
  );
}
