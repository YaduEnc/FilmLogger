import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H2, DisplayH2 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/movies/StarRating";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Search, Loader2, Tv, Plus, X } from "lucide-react";
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
  const typeParam = searchParams.get("type");

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
  const [completionPercentage, setCompletionPercentage] = useState<number[]>([0]);

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
        toast({ title: "Error", description: "Failed to load movie details", variant: "destructive" });
      } finally {
        setIsLoadingMovie(false);
      }
    }
    loadMovie();
  }, [movieIdParam, typeParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in to log a film.", variant: "destructive" });
      return;
    }
    if (!movie) {
      toast({ title: "Select a film", description: "Please search and select a film to log.", variant: "destructive" });
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
        ...(movie.mediaType === 'tv' && {
          totalSeasons: movie.numberOfSeasons,
          totalEpisodes: movie.numberOfEpisodes,
        }),
      });

      if (movie.mediaType === 'tv' && movie.numberOfSeasons) {
        const completion = completionPercentage[0];
        const totalEpisodes = movie.numberOfEpisodes || (movie.numberOfSeasons * 10);
        const completedEpisodes = Math.round((completion / 100) * totalEpisodes);
        const avgEpisodesPerSeason = totalEpisodes / movie.numberOfSeasons;
        const approximateSeason = Math.min(Math.ceil(completedEpisodes / avgEpisodesPerSeason), movie.numberOfSeasons);
        const approximateEpisode = completedEpisodes % Math.ceil(avgEpisodesPerSeason) || Math.ceil(avgEpisodesPerSeason);

        await saveTVProgress(user.uid, movie.id, movie.title, movie.posterUrl, approximateSeason, approximateEpisode, movie.numberOfSeasons, totalEpisodes);
      }

      await Promise.all([
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
          ...(movie.mediaType === 'tv' && { tvProgress: `${completionPercentage[0]}%` })
        }),
        updateMovieStats(movie.id, movie.mediaType || 'movie', movie.title, movie.posterUrl, 'log', rating)
      ]);

      toast({ title: "Log Created", description: `Added ${movie.title} to your archive.` });
      navigate("/home");
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast({ title: "Error", description: "Failed to save your entry.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMovieSearch = async () => {
    if (!movieSearch.trim()) return;
    setIsSearching(true);
    try {
      const [moviesResult, tvResult] = await Promise.all([searchMovies(movieSearch), searchTV(movieSearch)]);
      setSearchResults([...moviesResult.movies.slice(0, 5), ...tvResult.movies.slice(0, 5)]);
    } catch (error) {
      console.error("Search failed:", error);
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const selectMovie = (selectedMovie: Movie) => {
    setMovie(selectedMovie);
    setSearchResults([]);
    setMovieSearch("");
    if (selectedMovie.mediaType === 'tv') setCompletionPercentage([0]);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[80vh]">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            Back to Archive
          </Link>
          <H2 className="text-2xl font-bold tracking-tight">New Log Entry</H2>
        </div>

        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search or Selected Movie */}
            {!movie ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a film or series..."
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleMovieSearch())}
                    className="pl-10 h-10 rounded-xl"
                  />
                  {movieSearch && (
                    <Button
                      type="button"
                      onClick={handleMovieSearch}
                      disabled={isSearching}
                      className="absolute right-1 top-1 bottom-1 h-8 rounded-lg"
                      size="sm"
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="border rounded-xl overflow-hidden divide-y bg-muted/20">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => selectMovie(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left group"
                      >
                        <div className="w-10 aspect-[2/3] bg-muted rounded overflow-hidden">
                          {result.posterUrl && <img src={result.posterUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground">{result.year} • {result.mediaType === 'tv' ? 'Series' : 'Film'}</p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-dashed relative group">
                <div className="w-16 aspect-[2/3] rounded-lg overflow-hidden shadow-sm">
                  {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-none mb-1">{movie.title}</h3>
                  <p className="text-sm text-muted-foreground">{movie.year} • {movie.mediaType === 'tv' ? 'Series' : 'Film'}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMovie(null)}
                  className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Core Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date Watched</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-medium rounded-xl h-11">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rating</Label>
                <div className="flex items-center justify-center bg-muted/30 rounded-xl h-11 px-4">
                  <StarRating rating={rating} onChange={setRating} size="md" />
                </div>
              </div>
            </div>

            {/* TV Progress */}
            {movie?.mediaType === 'tv' && (
              <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Tv className="h-3 w-3" /> Progress
                  </Label>
                  <span className="text-xs font-bold">{completionPercentage[0]}% Complete</span>
                </div>
                <Slider value={completionPercentage} onValueChange={setCompletionPercentage} min={0} max={100} step={5} />
              </div>
            )}

            {/* Analysis */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Short Review</Label>
                <Input
                  placeholder="One sentence summary..."
                  value={reviewShort}
                  onChange={(e) => setReviewShort(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Log Entry</Label>
                <Textarea
                  placeholder="Your thoughts, analysis, or memories..."
                  value={diaryLong}
                  onChange={(e) => setDiaryLong(e.target.value)}
                  className="min-h-[120px] rounded-xl resize-none"
                />
              </div>
            </div>

            {/* Tags & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</Label>
                <Input
                  placeholder="masterpiece, noir, period piece..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map(m => <SelectItem key={m || 'none'} value={m || 'none'}>{m || 'None'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => <SelectItem key={l || 'none'} value={l || 'none'}>{l || 'None'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex items-center justify-between border-t gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={isRewatch} onCheckedChange={setIsRewatch} id="rewatch" />
                <Label htmlFor="rewatch" className="text-sm cursor-pointer">Rewatch</Label>
              </div>

              <div className="flex gap-2 flex-1 justify-end">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => navigate(-1)}
                  className="hidden sm:inline-flex"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !movie}
                  className="px-8 rounded-xl font-bold bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Entry
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
