import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movies/MovieCard";
import { Search as SearchIcon, SlidersHorizontal, Loader2, X } from "lucide-react";
import { Movie } from "@/types/movie";
import { searchMovies, getTrendingMovies, getPopularMovies } from "@/lib/tmdb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const genres = ["All", "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];
const decades = ["All", "2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "Earlier"];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedDecade, setSelectedDecade] = useState("All");
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const loadInitialContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trendingData, popularData] = await Promise.all([
        getTrendingMovies(),
        getPopularMovies()
      ]);
      setMovies(trendingData.movies);
      setPopularMovies(popularData.movies);
    } catch (error) {
      console.error("Failed to load initial content:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      loadInitialContent();
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const { movies: searchResults, totalResults: total } = await searchMovies(searchQuery);
      setMovies(searchResults);
      setTotalResults(total);
      setSearchParams({ q: searchQuery });
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialContent, setSearchParams]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    } else {
      loadInitialContent();
    }
  }, []);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearFilters = () => {
    setSelectedGenre("All");
    setSelectedDecade("All");
  };

  const applyFilters = (list: Movie[]) => {
    return list.filter((movie) => {
      const matchesGenre = selectedGenre === "All" || movie.genres?.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()));
      const matchesDecade = selectedDecade === "All" || (selectedDecade === "Earlier" ? movie.year < 1960 : (movie.year >= parseInt(selectedDecade) && movie.year < parseInt(selectedDecade) + 10));
      return matchesGenre && matchesDecade;
    });
  };

  const isFiltered = selectedGenre !== "All" || selectedDecade !== "All";
  const filteredMovies = applyFilters(movies);
  const filteredPopular = applyFilters(popularMovies);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <H1 className="mb-4">Explore films</H1>
          <p className="text-muted-foreground">
            Browse the archive to log, rate, or add films to your library.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={onSearchSubmit} className="flex gap-2 mb-10">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading} className="px-8">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 w-11 ${showFilters ? "bg-muted text-foreground" : ""}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 mb-8 pb-8 border-b border-border">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Genre</label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Decade</label>
              <Select value={selectedDecade} onValueChange={setSelectedDecade}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {decades.map((decade) => (
                    <SelectItem key={decade} value={decade}>
                      {decade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="space-y-12">
            {/* Search Specific Results */}
            {hasSearched ? (
              <div>
                <p className="text-sm font-medium mb-6">
                  {filteredMovies.length} {filteredMovies.length === 1 ? 'film' : 'films'} found
                  {isFiltered && ` with applied filters`}
                </p>
                {filteredMovies.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
                    {filteredMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No matches found for your current search and filters.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Discovery Content */
              <>
                {/* Unified view if filtered */}
                {isFiltered ? (
                  <div>
                    <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-6 pb-2 border-b">
                      Filtered Discovery
                    </p>
                    {(filteredMovies.length > 0 || filteredPopular.length > 0) ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
                        {[...new Map([...filteredMovies, ...filteredPopular].map(m => [m.id, m])).values()].map((movie) => (
                          <MovieCard key={movie.id} movie={movie} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No films in trending or popular match these filters.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-6 pb-2 border-b">
                        Trending This Week
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
                        {movies.slice(0, 16).map((movie) => (
                          <MovieCard key={movie.id} movie={movie} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-6 pb-2 border-b">
                        Most Popular
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
                        {popularMovies.slice(0, 16).map((movie) => (
                          <MovieCard key={movie.id} movie={movie} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
