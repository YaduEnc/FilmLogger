import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movies/MovieCard";
import { Search as SearchIcon, SlidersHorizontal, Loader2, X, Clapperboard, Tv, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Movie } from "@/types/movie";
import {
  searchMovies,
  getTrendingMovies,
  getPopularMovies,
  searchTV,
  getTrendingTV,
  getPopularTV,
  discoverMedia
} from "@/lib/tmdb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const genres = ["All", "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"];
const genreIds: Record<string, number> = {
  "Action": 28, "Adventure": 12, "Animation": 16, "Comedy": 35, "Crime": 80,
  "Documentary": 99, "Drama": 18, "Family": 10751, "Fantasy": 14, "History": 36,
  "Horror": 27, "Music": 10402, "Mystery": 9648, "Romance": 10749, "Sci-Fi": 878,
  "Thriller": 53, "War": 10752, "Western": 37
};

const decades = ["All", "2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "Earlier"];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType = (searchParams.get("type") as 'movie' | 'tv') || 'movie';

  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedDecade, setSelectedDecade] = useState("All");
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Genre');

  const [page, setPage] = useState(1);
  const [activeParams, setActiveParams] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('popularity.desc');

  // Update URL when type changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('type', mediaType);
    setSearchParams(params, { replace: true });
    // Reset state on type change
    setPage(1);
    setMovies([]);
    setActiveParams(null);
    setHasSearched(false);
    // Reset filters
    setSelectedGenre("All");
    setSelectedDecade("All");
    setSortBy('popularity.desc');
  }, [mediaType, setSearchParams]);

  const getDiscoveryParams = (baseParams: any = {}) => {
    const params: any = { ...baseParams, sort_by: sortBy };

    if (selectedDecade !== "All") {
      if (selectedDecade === "Earlier") {
        if (mediaType === 'movie') {
          params['primary_release_date.lte'] = '1959-12-31';
        } else {
          params['first_air_date.lte'] = '1959-12-31';
        }
      } else {
        const startYear = parseInt(selectedDecade);
        const endYear = startYear + 9;
        if (mediaType === 'movie') {
          params['primary_release_date.gte'] = `${startYear}-01-01`;
          params['primary_release_date.lte'] = `${endYear}-12-31`;
        } else {
          params['first_air_date.gte'] = `${startYear}-01-01`;
          params['first_air_date.lte'] = `${endYear}-12-31`;
        }
      }
    }
    return params;
  };

  const executeDiscovery = async (params: any, isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setPage(1);
      setHasSearched(true);
    }

    try {
      const { movies: results, totalResults: total } = await discoverMedia(mediaType, { ...params, page: isLoadMore ? page + 1 : 1 });

      if (isLoadMore) {
        setMovies(prev => [...prev, ...results]);
        setPage(prev => prev + 1);
      } else {
        setMovies(results);
        setTotalResults(total);
        setActiveParams(params);
      }
    } catch (err) {
      toast.error("Failed to fetch results");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadInitialContent = useCallback(async () => {
    setIsLoading(true);
    try {
      let trendingData, popularData;

      if (mediaType === 'movie') {
        [trendingData, popularData] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies()
        ]);
      } else {
        [trendingData, popularData] = await Promise.all([
          getTrendingTV(),
          getPopularTV()
        ]);
      }

      setMovies(trendingData.movies);
      setPopularMovies(popularData.movies);
    } catch (error) {
      console.error("Failed to load initial content:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mediaType]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      loadInitialContent();
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setPage(1);
    setActiveParams(null); // Clear browse params
    try {
      const searchFn = mediaType === 'movie' ? searchMovies : searchTV;
      const { movies: searchResults, totalResults: total } = await searchFn(searchQuery, 1);
      setMovies(searchResults);
      setTotalResults(total);
      setSearchParams({ q: searchQuery, type: mediaType });
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialContent, setSearchParams, mediaType]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      let newMovies: Movie[] = [];

      if (activeParams) {
        await executeDiscovery(activeParams, true);
      } else if (query) {
        // Load more for search
        const searchFn = mediaType === 'movie' ? searchMovies : searchTV;
        const { movies: results } = await searchFn(query, nextPage);
        if (results.length > 0) {
          setMovies(prev => [...prev, ...results]);
          setPage(nextPage);
        }
      }

      if (newMovies.length > 0) {
        setMovies(prev => [...prev, ...newMovies]);
        setPage(nextPage);
      }
    } catch (error) {
      toast.error("Failed to load more results");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Effect to reload when Sort/Decade changes IF we are already browsing
  useEffect(() => {
    if (activeParams && hasSearched) {
      const base: any = {};
      if (activeParams.with_genres) base.with_genres = activeParams.with_genres;
      if (activeParams.with_origin_country) base.with_origin_country = activeParams.with_origin_country;
      if (activeParams.with_original_language) base.with_original_language = activeParams.with_original_language;

      const params = getDiscoveryParams(base);
      executeDiscovery(params);
    }
  }, [sortBy, selectedDecade]);

  // Reload when mediaType changes - Logic moved to useEffect dependency on mediaType
  useEffect(() => {
    if (query) {
      handleSearch(query);
    } else {
      loadInitialContent();
    }
  }, [mediaType]);

  // Initial load
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    } else {
      loadInitialContent();
    }
  }, []); // Run once

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearFilters = () => {
    setSelectedGenre("All");
    setSelectedDecade("All");
  };

  // Removed client-side applyFilters as we now use API
  const filteredMovies = movies;
  const isFiltered = selectedGenre !== "All" || selectedDecade !== "All";
  const showLoadMore = hasSearched && movies.length < totalResults;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <H1 className="mb-4">Explore {mediaType === 'movie' ? 'films' : 'series'}</H1>
          <div className="flex items-center gap-6 mb-4">
            {/* Custom Toggle */}
            <div className="bg-muted/10 p-1 rounded-full inline-flex border border-border/50">
              <button
                onClick={() => setMediaType('movie')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                  mediaType === 'movie'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                <Clapperboard className="h-3.5 w-3.5" />
                Films
              </button>
              <button
                onClick={() => setMediaType('tv')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                  mediaType === 'tv'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
              >
                <Tv className="h-3.5 w-3.5" />
                Series
              </button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Browse the archive to log, rate, or add {mediaType === 'movie' ? 'films' : 'shows'} to your library.
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 data-[state=open]:bg-muted data-[state=open]:text-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">

              {/* Tabs */}
              <div className="flex p-1 bg-muted/30 rounded-lg mb-4">
                {['Genre', 'Country', 'Language'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Sort & Filter Controls (Grid) */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs bg-transparent border-border/50">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity.desc">Most Popular</SelectItem>
                    <SelectItem value="vote_average.desc">Top Rated</SelectItem>
                    <SelectItem value="primary_release_date.desc">Newest First</SelectItem>
                    <SelectItem value="primary_release_date.asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDecade} onValueChange={setSelectedDecade}>
                  <SelectTrigger className="h-8 text-xs bg-transparent border-border/50">
                    <SelectValue placeholder="Decade" />
                  </SelectTrigger>
                  <SelectContent>
                    {decades.map(decade => (
                      <SelectItem key={decade} value={decade}>{decade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Lists */}
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
                {activeTab === 'Genre' && (genres.filter(g => g !== 'All').map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      const genreId = genreIds[genre];
                      if (!genreId) return;
                      const params = getDiscoveryParams({ with_genres: genreId.toString() });
                      executeDiscovery(params);
                      toast.success(`Browsing ${genre}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/30 rounded-md transition-colors group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{genre}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                  </button>
                )))}

                {activeTab === 'Country' && ([
                  { code: 'US', name: 'United States' },
                  { code: 'GB', name: 'United Kingdom' },
                  { code: 'FR', name: 'France' },
                  { code: 'JP', name: 'Japan' },
                  { code: 'KR', name: 'South Korea' },
                  { code: 'IN', name: 'India' },
                  { code: 'DE', name: 'Germany' },
                  { code: 'IT', name: 'Italy' },
                  { code: 'ES', name: 'Spain' },
                  { code: 'CN', name: 'China' },
                ].map((country) => (
                  <button
                    key={country.code}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/30 rounded-md transition-colors group"
                    onClick={() => {
                      const params = getDiscoveryParams({ with_origin_country: country.code });
                      executeDiscovery(params);
                      toast.success(`Browsing ${country.name}`);
                    }}
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{country.name}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                  </button>
                )))}

                {activeTab === 'Language' && ([
                  { code: 'en', name: 'English' },
                  { code: 'fr', name: 'French' },
                  { code: 'ja', name: 'Japanese' },
                  { code: 'ko', name: 'Korean' },
                  { code: 'es', name: 'Spanish' },
                  { code: 'hi', name: 'Hindi' },
                  { code: 'de', name: 'German' },
                  { code: 'it', name: 'Italian' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/30 rounded-md transition-colors group"
                    onClick={() => {
                      const params = getDiscoveryParams({ with_original_language: lang.code });
                      executeDiscovery(params);
                      toast.success(`Browsing ${lang.name}`);
                    }}
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{lang.name}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                  </button>
                )))}
              </div>
            </PopoverContent>
          </Popover>
        </form>

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
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
                      {filteredMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                      ))}
                    </div>
                    {showLoadMore && (
                      <div className="mt-12 flex justify-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="min-w-[200px]"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Load More"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-16 text-center border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No matches found for your current search and filters.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Discovery Content - Trending/Popular */
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
          </div>
        )}
      </div>
    </Layout>
  );
}
