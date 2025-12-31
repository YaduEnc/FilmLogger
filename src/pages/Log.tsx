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
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";

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
      <div className="relative min-h-screen">
        <AnimatedNoise opacity={0.02} />

        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[80vh] relative z-10">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-l-2 border-primary/20 pl-6">
            <Link to="/home" className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60 hover:text-foreground transition-all flex items-center gap-3 group/back">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover/back:-translate-x-1" />
              Archive
            </Link>
            <h1 className="font-serif text-5xl font-bold tracking-tight uppercase">New Log Entry</h1>
          </div>

          <div className="bg-white/[0.02] border border-white/10 p-6 sm:p-8 relative z-10 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Search or Selected Movie */}
              {!movie ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                      placeholder="SEARCH FOR A FILM OR SERIES..."
                      value={movieSearch}
                      onChange={(e) => setMovieSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleMovieSearch())}
                      className="pl-12 h-14 bg-white/[0.02] border-white/10 rounded-none font-mono text-xs uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all"
                    />
                    {movieSearch && (
                      <Button
                        type="button"
                        onClick={handleMovieSearch}
                        disabled={isSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 border-white/10 text-xs font-mono tracking-widest uppercase hover:bg-white/5 bg-transparent"
                        size="sm"
                        variant="outline"
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "FIND"}
                      </Button>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-white/10 rounded-none overflow-hidden divide-y divide-white/5 bg-black/40 backdrop-blur-md">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => selectMovie(result)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all text-left group"
                        >
                          <div className="w-12 aspect-[2/3] bg-muted/20 border border-white/5 overflow-hidden shrink-0">
                            {result.posterUrl && <img src={result.posterUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-base font-bold uppercase tracking-tight truncate group-hover:text-primary transition-colors">{result.title}</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-1">{result.year} • {result.mediaType === 'tv' ? 'Series' : 'Film'}</p>
                          </div>
                          <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 relative group transition-all hover:bg-white/[0.04]">
                  <div className="w-20 aspect-[2/3] border border-white/10 overflow-hidden shadow-2xl shrink-0">
                    {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-full h-full object-cover transition-all duration-[1.5s] grayscale group-hover:grayscale-0" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-2xl font-bold uppercase tracking-tighter leading-none mb-2">{movie.title}</h3>
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary font-bold">{movie.year} • {movie.mediaType === 'tv' ? 'Series' : 'Film'}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMovie(null)}
                    className="rounded-none h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Core Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-primary/60 font-bold block">Date Watched</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-mono text-[11px] uppercase tracking-widest border-white/10 bg-white/[0.01] hover:bg-white/5 rounded-none h-14 transition-all">
                        <CalendarIcon className="mr-3 h-4 w-4 text-primary/40" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-black/95 border-white/10 rounded-none shadow-2xl" align="start">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="rounded-none border-0" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-4">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-primary/60 font-bold block">Rating</Label>
                  <div className="flex items-center justify-center bg-white/[0.01] border border-white/10 rounded-none h-14 px-6">
                    <StarRating rating={rating} onChange={setRating} size="md" />
                  </div>
                </div>
              </div>

              {/* TV Progress */}
              {movie?.mediaType === 'tv' && (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-none space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-primary font-bold flex items-center gap-3">
                      <Tv className="h-3.5 w-3.5" /> Progress
                    </Label>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-primary">{completionPercentage[0]}% COMPLETE</span>
                  </div>
                  <Slider value={completionPercentage} onValueChange={setCompletionPercentage} min={0} max={100} step={1} className="py-2" />
                </div>
              )}

              {/* Analysis */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 font-bold block">Short Review</Label>
                  <Input
                    placeholder="ONE SENTENCE SUMMARY..."
                    value={reviewShort}
                    onChange={(e) => setReviewShort(e.target.value)}
                    className="h-14 bg-white/[0.01] border-white/10 rounded-none font-serif italic text-base tracking-tight focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 font-bold block">Log Entry</Label>
                  <Textarea
                    placeholder="YOUR THOUGHTS, ANALYSIS, OR MEMORIES..."
                    value={diaryLong}
                    onChange={(e) => setDiaryLong(e.target.value)}
                    className="min-h-[160px] bg-white/[0.01] border-white/10 rounded-none font-serif text-lg leading-relaxed tracking-tight p-6 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Tags & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="col-span-1 sm:col-span-2 space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 font-bold block">Tags</Label>
                  <Input
                    placeholder="MASTERPIECE, NOIR, PERIOD PIECE..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="h-12 bg-white/[0.01] border-white/10 rounded-none font-mono text-[10px] uppercase tracking-widest focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 font-bold block">Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="h-12 bg-white/[0.01] border-white/10 rounded-none font-mono text-[10px] uppercase tracking-[0.2em] focus:ring-primary/20 focus:border-primary/40">
                      <SelectValue placeholder="SELECT MOOD" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-white/10 rounded-none">
                      {moods.map(m => (
                        <SelectItem key={m || 'none'} value={m || 'none'} className="font-mono text-[10px] uppercase tracking-widest focus:bg-primary/20 focus:text-primary rounded-none">
                          {m || 'NONE'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 font-bold block">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="h-12 bg-white/[0.01] border-white/10 rounded-none font-mono text-[10px] uppercase tracking-[0.2em] focus:ring-primary/20 focus:border-primary/40">
                      <SelectValue placeholder="SELECT LOCATION" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-white/10 rounded-none">
                      {locations.map(l => (
                        <SelectItem key={l || 'none'} value={l || 'none'} className="font-mono text-[10px] uppercase tracking-widest focus:bg-primary/20 focus:text-primary rounded-none">
                          {l || 'NONE'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-white/10">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Switch checked={isRewatch} onCheckedChange={setIsRewatch} id="rewatch" className="data-[state=checked]:bg-primary" />
                    <Label htmlFor="rewatch" className="font-mono text-[10px] uppercase tracking-[0.3em] cursor-pointer text-muted-foreground/60 peer-data-[state=checked]:text-primary">Rewatch</Label>
                  </div>
                </div>

                <div className="flex gap-4 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 sm:flex-none h-14 font-mono text-[10px] uppercase tracking-[0.4em] hover:bg-white/5 rounded-none border border-transparent hover:border-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !movie}
                    className="flex-1 sm:flex-none h-14 px-12 rounded-none font-mono text-[10px] uppercase tracking-[0.4em] bg-primary text-black font-black hover:bg-primary/90 transition-all duration-500 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : null}
                    Save Entry
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
