import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Movie } from '@/types/movie';
import { searchMovies, searchTV, getMovieDetails, getTVDetails } from '@/lib/tmdb';
import { Search, X, Loader2, Film, Tv } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { toast } from 'sonner';

interface Top5MoviesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movies: Movie[]) => void;
  currentTop5?: Movie[];
}

export function Top5MoviesModal({ isOpen, onClose, onSave, currentTop5 = [] }: Top5MoviesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>(currentTop5);

  useEffect(() => {
    if (isOpen) {
      setSelectedMovies(currentTop5);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, currentTop5]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const [moviesResult, tvResult] = await Promise.all([
        searchMovies(searchQuery),
        searchTV(searchQuery)
      ]);

      const combinedResults = [
        ...moviesResult.movies.slice(0, 5),
        ...tvResult.movies.slice(0, 5)
      ];

      setSearchResults(combinedResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search movies');
    } finally {
      setIsSearching(false);
    }
  };

  const addMovie = (movie: Movie) => {
    if (selectedMovies.length >= 5) {
      toast.error('You can only select 5 movies');
      return;
    }
    if (selectedMovies.some(m => m.id === movie.id)) {
      toast.error('This movie is already in your top 5');
      return;
    }
    setSelectedMovies([...selectedMovies, movie]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMovie = (movieId: number) => {
    setSelectedMovies(selectedMovies.filter(m => m.id !== movieId));
  };

  const handleSave = () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie');
      return;
    }
    onSave(selectedMovies);
    onClose();
  };

  const moveMovie = (index: number, direction: 'up' | 'down') => {
    const newMovies = [...selectedMovies];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newMovies.length) return;
    [newMovies[index], newMovies[newIndex]] = [newMovies[newIndex], newMovies[index]];
    setSelectedMovies(newMovies);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Your Top 5 Movies</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Movies */}
          {selectedMovies.length > 0 && (
            <div className="space-y-3">
              <Label>Your Top {selectedMovies.length} (drag to reorder)</Label>
              <div className="grid grid-cols-5 gap-3">
                {selectedMovies.map((movie, index) => (
                  <div key={movie.id} className="relative group">
                    <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      #{index + 1}
                    </div>
                    <MovieCard movie={movie} size="sm" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMovie(movie.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-0 left-0 h-6 w-6 rounded-full bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => moveMovie(index, 'up')}
                      >
                        ↑
                      </Button>
                    )}
                    {index < selectedMovies.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => moveMovie(index, 'down')}
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          {selectedMovies.length < 5 && (
            <div className="space-y-3">
              <Label>Search for movies or TV shows</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a movie or TV show..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto">
                  {searchResults.map((movie) => {
                    const isSelected = selectedMovies.some(m => m.id === movie.id);
                    return (
                      <button
                        key={movie.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addMovie(movie);
                        }}
                        disabled={isSelected}
                        className="relative group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
                      >
                        {/* Custom movie display without Link */}
                        <div className="relative w-20">
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
                          {/* Title below poster */}
                          <p className="mt-1 text-[10px] font-medium leading-tight truncate text-center">
                            {movie.title}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 rounded-sm flex items-center justify-center pointer-events-none">
                            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={selectedMovies.length === 0}>
              Save Top {selectedMovies.length}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
