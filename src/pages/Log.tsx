import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/movies/StarRating";
import { Switch } from "@/components/ui/switch";
import { Divider } from "@/components/ui/divider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Search, Loader2, Tv } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createLogEntry, logActivity, updateMovieStats, saveTVProgress } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Movie } from "@/types/movie";
import { searchMovies, searchTV, getMovieDetails, getTVDetails } from "@/lib/tmdb";

const moods = ["", "Euphoric", "Thoughtful", "Melancholic", "Nostalgic", "Unsettled", "Inspired"];
const locations = ["", "Cinema", "Home", "Plane", "Festival", "Other"];

export default function Log() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const movieIdParam = searchParams.get("movie");
  const typeParam = searchParams.get("type"); // 'movie' | 'tv'

  const [movie, setMovie] = useState<Movie | null>(null);
  const [movieSearch, setMovieSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [rating, setRating] = useState(0);
  const [isRewatch, setIsRewatch] = useState(false);
  const [reviewShort, setReviewShort] = useState("");
  const [diaryLong, setDiaryLong] = useState("");
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<"private" | "followers" | "public">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // TV Progress - Completion Percentage
  const [completionPercentage, setCompletionPercentage] = useState<number[]>([0]);

  // Load movie if ID is provided
  useEffect(() => {
    async function loadMovie() {
      if (!movieIdParam) return;

      setIsLoadingMovie(true);
      try {
        let movieData: Movie;
        if (typeParam === 'tv') {
          movieData = await getTVDetails(parseInt(movieIdParam));
        } else {
          movieData = await getMovieDetails(parseInt(movieIdParam));
        }
        setMovie(movieData);
      } catch (error) {
        console.error("Failed to load movie:", error);
        toast({
          title: "Error",
          description: "Failed to load movie details",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMovie(false);
      }
    }

    loadMovie();
  }, [movieIdParam, typeParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to log a film.",
        variant: "destructive",
      });
      return;
    }

    if (!movie) {
      toast({
        title: "Select a film",
        description: "Please search and select a film to log.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createLogEntry(user.uid, {
        movieId: movie.id,
        movie,
        mediaType: movie.mediaType || 'movie',
        watchedDate: date.toISOString(),
        rating,
        reviewShort,
        diaryLong,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        mood,
        location,
        visibility,
        isRewatch,
        rewatchCount: isRewatch ? 1 : 0,
        // TV Progress - Completion Percentage
        ...(movie.mediaType === 'tv' && {
          currentSeason: undefined,
          currentEpisode: undefined,
          totalSeasons: movie.numberOfSeasons,
          totalEpisodes: movie.numberOfEpisodes,
        }),
      });

      // Save TV progress if it's a TV show
      if (movie.mediaType === 'tv' && movie.numberOfSeasons) {
        const completion = completionPercentage[0];
        // Calculate approximate season/episode from percentage
        const totalEpisodes = movie.numberOfEpisodes || (movie.numberOfSeasons * 10);
        const completedEpisodes = Math.round((completion / 100) * totalEpisodes);
        const avgEpisodesPerSeason = totalEpisodes / movie.numberOfSeasons;
        const approximateSeason = Math.min(
          Math.ceil(completedEpisodes / avgEpisodesPerSeason),
          movie.numberOfSeasons
        );
        const approximateEpisode = completedEpisodes % Math.ceil(avgEpisodesPerSeason) || Math.ceil(avgEpisodesPerSeason);
        
        await saveTVProgress(
          user.uid,
          movie.id,
          movie.title,
          movie.posterUrl,
          approximateSeason,
          approximateEpisode,
          movie.numberOfSeasons,
          totalEpisodes
        );
      }

      // Log activity and update stats
      const activityPromises = [
        logActivity({
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userPhoto: user.photoURL,
          type: reviewShort ? 'review' : 'log',
          movieId: movie.id,
          movieTitle: movie.title,
          moviePoster: movie.posterUrl,
          mediaType: movie.mediaType || 'movie',
          rating,
          reviewText: reviewShort,
          // Include TV completion percentage in activity
          ...(movie.mediaType === 'tv' && {
            tvProgress: `${completionPercentage[0]}%`
          })
        }),
        updateMovieStats(
          movie.id,
          movie.mediaType || 'movie',
          movie.title,
          movie.posterUrl,
          'log',
          rating
        )
      ];

      await Promise.all(activityPromises);

      toast({
        title: "Entry saved",
        description: `Logged ${movie.title} to your diary.`,
      });

      navigate("/home");
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMovieSearch = async () => {
    if (!movieSearch.trim()) return;

    setIsSearching(true);
    try {
      // Search both movies and TV shows
      const [moviesResult, tvResult] = await Promise.all([
        searchMovies(movieSearch),
        searchTV(movieSearch)
      ]);
      
      // Combine results, prioritizing movies first
      const combinedResults = [
        ...moviesResult.movies.slice(0, 5),
        ...tvResult.movies.slice(0, 5)
      ];
      
      setSearchResults(combinedResults);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectMovie = (selectedMovie: Movie) => {
    setMovie(selectedMovie);
    setSearchResults([]);
    setMovieSearch("");
    // Reset TV progress when selecting a new TV show
    if (selectedMovie.mediaType === 'tv') {
      setCompletionPercentage([0]);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <H2>Add your log</H2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Movie search */}
          {isLoadingMovie ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !movie ? (
            <div className="space-y-3">
              <Label>Movie or TV Show</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a movie or TV show..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleMovieSearch())}
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleMovieSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-sm divide-y divide-border">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => selectMovie(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-10 aspect-[2/3] bg-muted rounded-sm overflow-hidden shrink-0">
                        {result.posterUrl && (
                          <img src={result.posterUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{result.title}</p>
                        <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{result.year}</p>
                          {result.mediaType === 'tv' && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">TV</span>
                          )}
                          {result.mediaType === 'movie' && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">Movie</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-sm border border-border">
              <div className="w-16 aspect-[2/3] bg-muted rounded-sm overflow-hidden shrink-0">
                {movie.posterUrl && (
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{movie.title}</p>
                <p className="text-sm text-muted-foreground">{movie.year}</p>
                {movie.mediaType === 'tv' && movie.createdBy && movie.createdBy.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">Created by {movie.createdBy.map(c => c.name).join(", ")}</p>
                )}
                {movie.mediaType !== 'tv' && movie.director && (
                  <p className="text-sm text-muted-foreground mt-1">Directed by {movie.director}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMovie(null)}
              >
                Change
              </Button>
            </div>
          )}

          {/* TV Progress - Completion Percentage */}
          {movie && movie.mediaType === 'tv' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Tv className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">How much have you completed?</Label>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Completion: {completionPercentage[0]}%</Label>
                    <span className="text-sm text-muted-foreground">
                      {completionPercentage[0] === 0 && "Not started"}
                      {completionPercentage[0] > 0 && completionPercentage[0] < 100 && "In progress"}
                      {completionPercentage[0] === 100 && "Completed"}
                    </span>
                  </div>
                  <Slider
                    value={completionPercentage}
                    onValueChange={setCompletionPercentage}
                    min={0}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="space-y-3">
            <Label>Watched on</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label>Rating</Label>
            <StarRating rating={rating} onChange={setRating} size="lg" />
          </div>

          {/* Rewatch */}
          <div className="flex items-center gap-3">
            <Switch checked={isRewatch} onCheckedChange={setIsRewatch} />
            <Label className="cursor-pointer" onClick={() => setIsRewatch(!isRewatch)}>
              This is a rewatch
            </Label>
          </div>

          <Divider />

          {/* Short review */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="review">Short review</Label>
              <span className="text-xs text-muted-foreground">{reviewShort.length}/500</span>
            </div>
            <Textarea
              id="review"
              placeholder="A few thoughts..."
              value={reviewShort}
              onChange={(e) => setReviewShort(e.target.value.slice(0, 500))}
              rows={3}
            />
          </div>

          {/* Diary entry */}
          <div className="space-y-3">
            <Label htmlFor="diary">Diary entry (optional)</Label>
            <Textarea
              id="diary"
              placeholder="Write more in-depth thoughts. Markdown supported."
              value={diaryLong}
              onChange={(e) => setDiaryLong(e.target.value)}
              rows={6}
              className="font-serif"
            />
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="noir, slow-cinema, favorites (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Mood & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="How did it feel?" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((m) => (
                    <SelectItem key={m || "none"} value={m || "none"}>
                      {m || "None"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Where watched</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l || "none"} value={l || "none"}>
                      {l || "None"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Divider />

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save entry"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
