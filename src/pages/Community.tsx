import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Search, UserPlus, Check, Clock, Users, ArrowRight, Loader2,
  Plus, BarChart3, MessageSquare, List, ThumbsUp, Send,
  TrendingUp, Film, X, Activity, Sparkles, ArrowUpRight
} from "lucide-react";
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";
import { searchMovies, searchTV, getCollectionDetails } from "@/lib/tmdb";
import { Movie, Collection } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import {
  searchUsers, getConnectionStatus, sendConnectionRequest, acceptConnectionRequest,
  getPolls, createPoll, votePoll, getUserPollVote,
  getDebates, createDebate, voteDebate, getUserDebateVote, getDebateComments, addDebateComment,
  getPublicLists, getListComments, addListComment, logActivity,
  getRecommendedUsers, getMostActiveUsers, getNewUsers
} from "@/lib/db";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("activity");

  return (
    <Layout>
      <div className="relative min-h-screen">
        <AnimatedNoise opacity={0.02} />

        <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
          {/* Header */}
          <div className="mb-16 border-l-2 border-primary/20 pl-6">
            <h1 className="font-serif text-6xl font-bold tracking-tight uppercase mb-4">Community</h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60 max-w-md">
              Connect, discuss, and discover with fellow cinephiles in the archive.
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex justify-start gap-8 bg-transparent border-b border-white/10 p-0 mb-12 rounded-none h-auto">
              {[
                { id: "activity", icon: Activity, label: "Activity" },
                { id: "polls", icon: BarChart3, label: "Polls" },
                { id: "debates", icon: MessageSquare, label: "Debates" },
                { id: "lists", icon: List, label: "Lists" },
                { id: "collections", icon: Film, label: "Collections" },
                { id: "people", icon: Users, label: "People" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-3 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 data-[state=active]:text-foreground transition-all hover:text-foreground"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="activity" className="mt-0">
              <ActivityFeed />
            </TabsContent>

            <TabsContent value="polls" className="mt-0">
              <PollsSection user={user} />
            </TabsContent>

            <TabsContent value="debates" className="mt-0">
              <DebatesSection user={user} />
            </TabsContent>

            <TabsContent value="lists" className="mt-0">
              <ListsSection user={user} />
            </TabsContent>

            <TabsContent value="people" className="mt-0">
              <PeopleSection user={user} />
            </TabsContent>

            <TabsContent value="collections" className="mt-0">
              <CollectionsSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

// ==================== POLLS SECTION ====================
function PollsSection({ user }: { user: any }) {
  const [polls, setPolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    setIsLoading(true);
    try {
      const data = await getPolls();
      setPolls(data);
    } catch (error) {
      console.error("Error loading polls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl font-bold uppercase tracking-tight">Community Polls</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono text-[10px] uppercase tracking-[0.2em] rounded-none px-6 bg-primary text-black hover:bg-primary/90 h-10 gap-2">
              <Plus className="h-3 w-3" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-black border border-white/10 rounded-none p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
              <DialogTitle className="font-serif text-2xl uppercase tracking-tiight">Create a Poll</DialogTitle>
            </div>
            <div className="p-6">
              <CreatePollForm user={user} onSuccess={() => { setIsCreateOpen(false); loadPolls(); }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} user={user} onVote={loadPolls} />
          ))}
          {polls.length === 0 && (
            <div className="text-center py-24 border border-white/10 bg-white/[0.02] rounded-none">
              <BarChart3 className="h-10 w-10 mx-auto mb-4 text-white/20" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">No polls active</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PollCard({ poll, user, onVote }: { poll: any; user: any; onVote: () => void }) {
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (user) {
      getUserPollVote(poll.id, user.uid).then(setUserVote);
    }
  }, [poll.id, user]);

  const handleVote = async (optionId: string) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }

    setIsVoting(true);
    try {
      await votePoll(poll.id, optionId, user.uid);
      setUserVote(optionId);
      toast.success("Vote recorded");
      onVote();
    } catch (error: any) {
      toast.error(error.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 p-6 sm:p-8 backdrop-blur-sm group hover:border-white/20 transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-none ring-1 ring-white/10">
            <AvatarImage src={poll.authorPhoto} />
            <AvatarFallback className="text-[10px] font-mono rounded-none">{poll.authorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-serif text-sm font-bold leading-none">{poll.authorName}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-1">
              {new Date(poll.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-none font-mono text-[9px] uppercase tracking-widest border-white/10 text-muted-foreground/60">
          {poll.pollType.replace('_', ' ')}
        </Badge>
      </div>

      <h3 className="font-serif text-2xl font-bold mb-8 leading-tight">{poll.question}</h3>

      <div className="space-y-4">
        {poll.options.map((option: any) => {
          const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
          const isSelected = userVote === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !userVote && handleVote(option.id)}
              disabled={!!userVote || isVoting}
              className={cn(
                "w-full text-left p-4 border transition-all relative overflow-hidden group/option",
                isSelected ? "border-primary bg-primary/5" : "border-white/10 bg-transparent hover:border-white/20 hover:bg-white/[0.02]",
                userVote && !isSelected && "opacity-50 grayscale"
              )}
            >
              {userVote && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-700 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center gap-4 z-10">
                {option.posterUrl && (
                  <img
                    src={option.posterUrl}
                    alt={option.text}
                    className="w-10 h-14 object-cover border border-white/10 opacity-80 group-hover/option:opacity-100 transition-opacity"
                  />
                )}
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn(
                    "font-mono text-xs uppercase tracking-widest transition-colors",
                    isSelected ? "text-primary" : "text-foreground/80"
                  )}>
                    {option.text}
                  </span>
                  {userVote && (
                    <span className="font-serif font-bold text-lg">{percentage.toFixed(1)}%</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 text-muted-foreground/40 font-mono text-[9px] uppercase tracking-widest">
        <BarChart3 className="h-3 w-3" />
        <span>{poll.totalVotes} votes</span>
      </div>
    </div>
  );
}

function CreatePollForm({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ text: "", moviePoster: "" }, { text: "", moviePoster: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [movieSearch, setMovieSearch] = useState({ index: -1, query: "", results: [] as Movie[] });

  const addOption = () => setOptions([...options, { text: "", moviePoster: "" }]);
  const updateOption = (index: number, value: string, movieData: any = null) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value, ...(movieData && { moviePoster: movieData.posterUrl }) };
    setOptions(newOptions);
  };
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setMovieSearch(prev => ({ ...prev, query, results: [] }));
      return;
    }
    setMovieSearch(prev => ({ ...prev, query }));
    try {
      const { movies } = await searchMovies(query);
      setMovieSearch(prev => ({ ...prev, results: movies.slice(0, 5) }));
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const selectMovie = (index: number, movie: Movie) => {
    updateOption(index, movie.title, movie);
    setMovieSearch({ index: -1, query: "", results: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!question.trim() || options.some(o => !o.text.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await createPoll({
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        question,
        options: options.map(o => ({
          text: o.text,
          posterUrl: o.moviePoster
        })),
        pollType: 'movie_comparison' // Default for now
      });
      toast.success("Poll created successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create poll");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Poll Question</label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which film had better cinematography?"
          className="font-serif text-xl h-14 bg-white/5 border-white/10 rounded-none focus:ring-primary/20 placeholder:text-muted-foreground/30"
        />
      </div>

      <div className="space-y-4">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-3 items-start group">
            <div className="flex-1 relative">
              <div className="relative">
                <Input
                  value={option.text}
                  onChange={(e) => {
                    updateOption(index, e.target.value);
                    if (e.target.value.length > 2) {
                      setMovieSearch(prev => ({ ...prev, index, query: e.target.value }));
                      handleSearch(e.target.value);
                    }
                  }}
                  onFocus={() => setMovieSearch(prev => ({ ...prev, index }))}
                  placeholder={`Option ${index + 1}`}
                  className="font-serif bg-white/5 border-white/10 rounded-none h-12 pr-12 focus:bg-white/10 transition-colors"
                />
                {option.moviePoster && (
                  <img src={option.moviePoster} alt="" className="absolute right-1 top-1 h-10 w-auto object-cover opacity-50" />
                )}
              </div>

              {/* Movie Search Results Dropdown */}
              {movieSearch.index === index && movieSearch.results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-black border border-white/10 mt-1 max-h-60 overflow-y-auto">
                  {movieSearch.results.map(movie => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => selectMovie(index, movie)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/10 transition-colors text-left"
                    >
                      {movie.posterUrl && (
                        <img src={movie.posterUrl} alt="" className="w-8 h-12 object-cover opacity-70" />
                      )}
                      <div>
                        <p className="font-serif text-sm">{movie.title}</p>
                        <p className="font-mono text-[9px] text-muted-foreground">{movie.year}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {options.length > 2 && (
              <Button type="button" onClick={() => removeOption(index)} size="icon" variant="ghost" className="h-12 w-12 rounded-none hover:bg-red-500/10 hover:text-red-500">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        <Button type="button" onClick={addOption} variant="outline" className="w-full rounded-none border-dashed border-white/20 hover:border-primary/50 hover:text-primary h-12 font-mono text-xs uppercase tracking-widest gap-2">
          <Plus className="h-3 w-3" />
          Add Option
        </Button>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/10">
        <Button type="submit" disabled={isLoading} className="rounded-none bg-primary text-black hover:bg-primary/90 h-12 px-8 font-mono text-xs uppercase tracking-[0.2em] font-bold">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Poll'
          )}
        </Button>
      </div>
    </form>
  );
}

// ==================== DEBATES SECTION ====================
function DebatesSection({ user }: { user: any }) {
  const [debates, setDebates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadDebates();
  }, []);

  const loadDebates = async () => {
    setIsLoading(true);
    try {
      const data = await getDebates();
      setDebates(data);
    } catch (error) {
      console.error("Error loading debates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl font-bold uppercase tracking-tight">Community Debates</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono text-[10px] uppercase tracking-[0.2em] rounded-none px-6 bg-primary text-black hover:bg-primary/90 h-10 gap-2">
              <Plus className="h-3 w-3" />
              Start Debate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-black border border-white/10 rounded-none p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
              <DialogTitle className="font-serif text-2xl uppercase tracking-tiight">Start a Debate</DialogTitle>
            </div>
            <div className="p-6">
              <CreateDebateForm user={user} onSuccess={() => { setIsCreateOpen(false); loadDebates(); }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {debates.map((debate) => (
            <DebateCard key={debate.id} debate={debate} user={user} onVote={loadDebates} />
          ))}
          {debates.length === 0 && (
            <div className="text-center py-24 border border-white/10 bg-white/[0.02] rounded-none">
              <MessageSquare className="h-10 w-10 mx-auto mb-4 text-white/20" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">No active debates</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DebateCard({ debate, user, onVote }: { debate: any; user: any; onVote: () => void }) {
  const [userVote, setUserVote] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (user) {
      getUserDebateVote(debate.id, user.uid).then(setUserVote);
    }
  }, [debate.id, user]);

  useEffect(() => {
    if (showComments) {
      getDebateComments(debate.id).then(setComments);
    }
  }, [showComments, debate.id]);

  const handleVote = async (side: 1 | 2) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }

    try {
      await voteDebate(debate.id, side, user.uid);
      setUserVote(side);
      toast.success("Vote recorded");
      onVote();
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      await addDebateComment({
        debateId: debate.id,
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        text: newComment,
        side: userVote
      });
      setNewComment("");
      const updatedComments = await getDebateComments(debate.id);
      setComments(updatedComments);
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const total = debate.side1Votes + debate.side2Votes;
  const side1Percentage = total > 0 ? (debate.side1Votes / total) * 100 : 50;
  const side2Percentage = total > 0 ? (debate.side2Votes / total) * 100 : 50;

  return (
    <div className="bg-white/[0.02] border border-white/10 p-6 sm:p-8 backdrop-blur-sm group hover:border-white/20 transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-8 w-8 rounded-none ring-1 ring-white/10">
          <AvatarImage src={debate.authorPhoto} />
          <AvatarFallback className="text-[10px] font-mono rounded-none">{debate.authorName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-serif text-sm font-bold leading-none">{debate.authorName}</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-1">
            {new Date(debate.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <h3 className="font-serif text-2xl font-bold mb-3 leading-tight uppercase">{debate.title}</h3>
      <p className="font-serif text-sm text-foreground/80 leading-relaxed max-w-2xl mb-8 italic">
        "{debate.description}"
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => handleVote(1)}
          disabled={!!userVote}
          className={cn(
            "p-6 border transition-all text-center group/side relative overflow-hidden",
            userVote === 1 ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/40 hover:bg-white/5",
            userVote && userVote !== 1 && "opacity-40 grayscale"
          )}
        >
          <p className="font-mono text-xs uppercase tracking-widest mb-3 text-muted-foreground">{debate.side1}</p>
          <div className="text-4xl sm:text-5xl font-serif font-black mb-1 group-hover/side:text-primary transition-colors">
            {side1Percentage.toFixed(0)}%
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">{debate.side1Votes} votes</p>
        </button>

        <button
          onClick={() => handleVote(2)}
          disabled={!!userVote}
          className={cn(
            "p-6 border transition-all text-center group/side relative overflow-hidden",
            userVote === 2 ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/40 hover:bg-white/5",
            userVote && userVote !== 2 && "opacity-40 grayscale"
          )}
        >
          <p className="font-mono text-xs uppercase tracking-widest mb-3 text-muted-foreground">{debate.side2}</p>
          <div className="text-4xl sm:text-5xl font-serif font-black mb-1 group-hover/side:text-primary transition-colors">
            {side2Percentage.toFixed(0)}%
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">{debate.side2Votes} votes</p>
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-transparent p-0 h-auto gap-2"
      >
        <MessageSquare className="h-3 w-3" />
        {debate.commentCount} Comments
      </Button>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2">
          {user && (
            <div className="flex gap-4">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your perspective..."
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                className="bg-white/5 border-white/10 font-serif text-sm h-11 focus-visible:ring-primary/30"
              />
              <Button onClick={handleComment} size="icon" className="h-11 w-11 rounded-none bg-white/10 hover:bg-white/20 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 bg-muted/20 border border-white/5">
                <Avatar className="h-6 w-6 rounded-none mt-1">
                  <AvatarImage src={comment.authorPhoto} />
                  <AvatarFallback className="text-[9px] rounded-none">{comment.authorName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-sm font-bold">{comment.authorName}</span>
                    {comment.side && (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-primary/60 px-1.5 py-0.5 border border-primary/20">
                        {comment.side === 1 ? debate.side1 : debate.side2}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-foreground/70 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateDebateForm({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [side1, setSide1] = useState("");
  const [side2, setSide2] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim() || !side1.trim() || !side2.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await createDebate({
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        title,
        description,
        side1,
        side2
      });
      toast.success("Debate started successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create debate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Debate Topic</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Is 'The Godfather' overrated?"
          className="font-serif text-xl h-14 bg-white/5 border-white/10 rounded-none focus:ring-primary/20 placeholder:text-muted-foreground/30"
        />
      </div>

      <div className="space-y-3">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Context / Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide some context for the debate..."
          className="font-serif bg-white/5 border-white/10 rounded-none min-h-[100px] focus:ring-primary/20 placeholder:text-muted-foreground/30 resize-none p-4 leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Side A</label>
          <Input
            value={side1}
            onChange={(e) => setSide1(e.target.value)}
            placeholder="e.g. Yes"
            className="font-serif font-bold h-12 bg-white/5 border-white/10 rounded-none text-center focus:ring-primary/20"
          />
        </div>
        <div className="space-y-3">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Side B</label>
          <Input
            value={side2}
            onChange={(e) => setSide2(e.target.value)}
            placeholder="e.g. No"
            className="font-serif font-bold h-12 bg-white/5 border-white/10 rounded-none text-center focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/10">
        <Button type="submit" disabled={isLoading} className="rounded-none bg-primary text-black hover:bg-primary/90 h-12 px-8 font-mono text-xs uppercase tracking-[0.2em] font-bold">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Debate'
          )}
        </Button>
      </div>
    </form>
  );
}

// ==================== LISTS SECTION ====================
function ListsSection({ user }: { user: any }) {
  const [lists, setLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const data = await getPublicLists();
      setLists(data);
    } catch (error) {
      console.error("Error loading lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-serif text-3xl font-bold uppercase tracking-tight mb-8">Public Lists</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <ListCard key={`${list.userId}_${list.id}`} list={list} user={user} />
          ))}
          {lists.length === 0 && (
            <div className="text-center py-24 border border-white/10 bg-white/[0.02] rounded-none">
              <List className="h-10 w-10 mx-auto mb-4 text-white/20" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">No public lists found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListCard({ list, user }: { list: any; user: any }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (showComments) {
      getListComments(list.id, list.userId).then(setComments);
    }
  }, [showComments, list.id, list.userId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await addListComment({
        listId: list.id,
        listOwnerId: list.userId,
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        text: newComment
      });
      setNewComment("");
      const updatedComments = await getListComments(list.id, list.userId);
      setComments(updatedComments);
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const preventProp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="group block bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
      <Link to={`/list/${list.userId}/${list.id}`} className="flex flex-col sm:flex-row p-5 gap-6">
        {/* Poster Grid - Mini representation */}
        <div className="shrink-0">
          {list.movies && list.movies.length > 0 ? (
            <div className="w-24 aspect-[2/3] relative bg-black/50 border border-white/10">
              {list.movies[0].posterUrl ? (
                <img
                  src={list.movies[0].posterUrl}
                  alt={list.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Film className="h-6 w-6 text-white/20" />
                </div>
              )}
              {/* Stack effect */}
              <div className="absolute -right-1 -bottom-1 w-full h-full border border-white/5 bg-white/[0.02] -z-10" />
            </div>
          ) : (
            <div className="w-24 aspect-[2/3] bg-white/5 border border-white/10 flex items-center justify-center">
              <List className="h-8 w-8 text-white/20" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-serif text-2xl font-bold uppercase leading-none tracking-tight group-hover:text-primary transition-colors">
                {list.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0 bg-white/5 px-2 py-1 rounded-none border border-white/5">
                <Film className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[9px] font-bold text-foreground">{list.movies?.length || 0}</span>
              </div>
            </div>

            <p className="font-serif text-sm text-muted-foreground/70 italic line-clamp-2 max-w-2xl mb-4">
              {list.description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 rounded-none ring-1 ring-white/10">
                  <AvatarImage src={list.userPhoto} />
                  <AvatarFallback className="rounded-none text-[8px]">{list.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  {list.userName}
                </span>
              </div>
              <span className="text-white/10 text-[9px]">•</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                {new Date(list.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={(e) => { preventProp(e); setShowComments(!showComments); }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group/comments"
              >
                <MessageSquare className="h-3.5 w-3.5 group-hover/comments:text-primary transition-colors" />
                <span className="font-mono text-[10px]">{comments.length > 0 ? comments.length : ''}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {showComments && (
        <div className="px-5 pb-5 sm:pl-36 animate-in slide-in-from-top-1">
          <div className="pt-4 border-t border-white/5 space-y-4">
            {user && (
              <form onSubmit={handleComment} className="flex gap-3">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a comment..."
                  className="bg-white/5 border-white/10 font-serif text-sm h-9 rounded-none focus-visible:ring-primary/30"
                />
                <Button type="submit" size="sm" className="h-9 w-9 rounded-none bg-white/10 hover:bg-white/20 shrink-0 p-0">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-black/20 border border-white/5">
                <Avatar className="h-5 w-5 rounded-none mt-0.5">
                  <AvatarImage src={comment.authorPhoto} />
                  <AvatarFallback className="text-[8px] rounded-none">{comment.authorName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-foreground/80">{comment.authorName}</span>
                    <span className="text-[9px] text-muted-foreground/40">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-serif text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PEOPLE SECTION ====================
function PeopleSection({ user }: { user: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    setIsLoadingRecommendations(true);
    try {
      const [recommended, active, newUsersList] = await Promise.all([
        getRecommendedUsers(user.uid, 6),
        getMostActiveUsers(user.uid, 6),
        getNewUsers(user.uid, 6)
      ]);
      setRecommendedUsers(recommended);
      setActiveUsers(active);
      setNewUsers(newUsersList);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchTerm);
        setSearchResults(results.filter(r => r.uid !== user?.uid));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  const renderUserCategory = (title: string, users: any[], icon: any) => {
    if (users.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
          {icon}
          <h3 className="font-serif text-lg font-bold uppercase tracking-wide">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((targetUser) => (
            <UserResultCard key={targetUser.uid} targetUser={targetUser} currentUser={user} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Search Section */}
      <div>
        <h2 className="font-serif text-3xl font-bold uppercase tracking-tight mb-8">Find People</h2>

        <div className="relative mb-12 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH BY USERNAME..."
            className="pl-14 h-16 text-lg bg-white/[0.02] border-white/10 focus-visible:ring-primary/20 focus-visible:border-primary/40 rounded-none font-mono uppercase tracking-[0.2em]"
          />
          {isSearching && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {searchTerm.length >= 2 ? (
          // Show search results
          searchResults.length > 0 ? (
            <div className="grid gap-4">
              {searchResults.map((targetUser) => (
                <UserResultCard key={targetUser.uid} targetUser={targetUser} currentUser={user} />
              ))}
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="text-center py-24 border border-white/10 bg-white/[0.02]">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">No users found</p>
            </div>
          )
        ) : (
          // Show recommendations
          <div className="space-y-16">
            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {recommendedUsers.length > 0 && renderUserCategory(
                  "Recommended for You",
                  recommendedUsers,
                  <Sparkles className="h-4 w-4 text-primary" />
                )}

                {activeUsers.length > 0 && renderUserCategory(
                  "Most Active",
                  activeUsers,
                  <TrendingUp className="h-4 w-4 text-primary" />
                )}

                {newUsers.length > 0 && renderUserCategory(
                  "New to CineLunatic",
                  newUsers,
                  <Sparkles className="h-4 w-4 text-primary" />
                )}

                {recommendedUsers.length === 0 && activeUsers.length === 0 && newUsers.length === 0 && (
                  <div className="text-center py-24 border border-white/10 bg-white/[0.02]">
                    <Users className="h-10 w-10 mx-auto mb-4 text-white/10" />
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/50">No recommendations available right now</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserResultCard({ targetUser, currentUser }: { targetUser: any; currentUser: any }) {
  const [status, setStatus] = useState<any>({ status: 'none' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!currentUser || !targetUser) return;
      const s = await getConnectionStatus(currentUser.uid, targetUser.uid);
      setStatus(s);
      setIsLoading(false);
    }
    checkStatus();
  }, [currentUser, targetUser]);

  const handleConnect = async () => {
    if (!currentUser) {
      toast.error("Sign in to connect");
      return;
    }

    try {
      if (status.status === 'none') {
        await sendConnectionRequest(currentUser.uid, targetUser.uid);
        setStatus({ status: 'pending' });
        toast.success("Request sent");
      } else if (status.status === 'incoming') {
        await acceptConnectionRequest(status.requestId, targetUser.uid, currentUser.uid);
        setStatus({ status: 'accepted' });

        // Log connection activity for both users
        await Promise.all([
          logActivity({
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Anonymous',
            userPhoto: currentUser.photoURL,
            type: 'connection',
            connectedUserId: targetUser.uid,
            connectedUserName: targetUser.displayName
          }),
          logActivity({
            userId: targetUser.uid,
            userName: targetUser.displayName || 'Anonymous',
            userPhoto: targetUser.photoURL,
            type: 'connection',
            connectedUserId: currentUser.uid,
            connectedUserName: currentUser.displayName
          })
        ]);

        toast.success(`Connected with ${targetUser.displayName}`);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all group">
      <div className="flex items-center gap-5">
        <Link to={`/profile/${targetUser.username}`}>
          <Avatar className="h-12 w-12 rounded-none border border-white/10 group-hover:border-primary/40 transition-all">
            <AvatarImage src={targetUser.photoURL} />
            <AvatarFallback className="font-mono bg-muted rounded-none">{targetUser.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0">
          <Link to={`/profile/${targetUser.username}`} className="hover:text-primary transition-colors">
            <h4 className="font-serif text-lg font-bold leading-none mb-1.5">{targetUser.displayName}</h4>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <span className="text-[10px] font-mono opacity-70 tracking-wider">@{targetUser.username}</span>
            <span className="h-px w-3 bg-white/10" />
            <span className="text-[9px] font-mono uppercase tracking-widest">{targetUser.totalWatched || targetUser.stats?.totalWatched || 0} FILMS</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to={`/profile/${targetUser.username}`}>
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 rounded-none opacity-60 hover:opacity-100 font-mono text-[9px] uppercase tracking-widest hover:bg-transparent hover:text-primary">
            Profile
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>

        {isLoading ? (
          <div className="w-24 h-8 bg-white/5 animate-pulse" />
        ) : (
          <Button
            onClick={handleConnect}
            disabled={status.status === 'pending' || status.status === 'accepted'}
            size="sm"
            className={cn(
              "rounded-none gap-2 px-4 h-8 transition-all font-mono text-[9px] uppercase tracking-widest border",
              status.status === 'accepted' ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" :
                status.status === 'pending' ? "bg-transparent border-white/10 opacity-50 text-white cursor-default" :
                  "bg-transparent border-white/20 hover:border-primary hover:text-primary text-white"
            )}
          >
            {status.status === 'none' && (
              <>
                <UserPlus className="h-3 w-3" />
                Connect
              </>
            )}
            {status.status === 'pending' && (
              <>
                <Clock className="h-3 w-3" />
                Pending
              </>
            )}
            {status.status === 'incoming' && (
              <>
                <UserPlus className="h-3 w-3" />
                Accept
              </>
            )}
            {status.status === 'accepted' && (
              <>
                <Check className="h-3 w-3" />
                Friends
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ==================== COLLECTIONS SECTION ====================
const CURATED_COLLECTIONS = [
  // Original Collections
  { id: 726871, name: "Dune Collection" },
  { id: 119, name: "The Lord of the Rings Collection" },
  { id: 10, name: "Star Wars Collection" },
  { id: 1241, name: "Harry Potter Collection" },
  { id: 86311, name: "The Avengers Collection" },
  { id: 230, name: "The Godfather Trilogy" },
  { id: 263, name: "The Dark Knight Trilogy" },
  { id: 84, name: "Indiana Jones Collection" },
  { id: 295, name: "Pirates of the Caribbean Collection" },
  { id: 328, name: "Jurassic Park Collection" },
  { id: 2344, name: "The Matrix Collection" },
  { id: 131635, name: "The Hunger Games Collection" },
  { id: 748, name: "X-Men Collection" },
  { id: 9485, name: "The Fast and the Furious Collection" },
  { id: 87359, name: "Mission: Impossible Collection" },
  { id: 10194, name: "Toy Story Collection" },
  { id: 173710, name: "Planet of the Apes (Reboot) Collection" },
  
  // Action & Thriller Franchises
  { id: 645, name: "James Bond Collection" },
  { id: 121938, name: "John Wick Collection" },
  { id: 131296, name: "Transformers Collection" },
  { id: 127532, name: "The Expendables Collection" },
  { id: 131308, name: "Terminator Collection" },
  { id: 131309, name: "Rocky Collection" },
  { id: 131310, name: "Rambo Collection" },
  { id: 131311, name: "Die Hard Collection" },
  { id: 131313, name: "The Bourne Collection" },
  { id: 131314, name: "Ocean's Collection" },
  
  // Superhero Collections
  { id: 131318, name: "Spider-Man Collection" },
  { id: 131319, name: "Batman Collection" },
  { id: 131320, name: "Superman Collection" },
  { id: 131317, name: "Blade Collection" },
  
  // Horror Franchises
  { id: 131292, name: "The Conjuring Universe" },
  { id: 131326, name: "Saw Collection" },
  { id: 131327, name: "Final Destination Collection" },
  { id: 131328, name: "Paranormal Activity Collection" },
  { id: 131329, name: "Insidious Collection" },
  { id: 131330, name: "The Purge Collection" },
  { id: 131331, name: "Scream Collection" },
  { id: 131332, name: "Halloween Collection" },
  { id: 131333, name: "Friday the 13th Collection" },
  { id: 131334, name: "A Nightmare on Elm Street Collection" },
  { id: 131339, name: "The Ring Collection" },
  { id: 131340, name: "The Grudge Collection" },
  { id: 131306, name: "Alien Collection" },
  { id: 131307, name: "Predator Collection" },
  
  // Animation Collections
  { id: 131295, name: "Despicable Me Collection" },
  { id: 131297, name: "Ice Age Collection" },
  { id: 131298, name: "Shrek Collection" },
  { id: 131299, name: "Madagascar Collection" },
  { id: 131300, name: "How to Train Your Dragon Collection" },
  { id: 131301, name: "Kung Fu Panda Collection" },
  { id: 131345, name: "The Croods Collection" },
  { id: 131346, name: "Trolls Collection" },
  { id: 131347, name: "The Secret Life of Pets Collection" },
  { id: 131348, name: "Sing Collection" },
  { id: 131353, name: "The Lego Movie Collection" },
  
  // Fantasy & Adventure
  { id: 131302, name: "The Chronicles of Narnia Collection" },
  { id: 131303, name: "Twilight Collection" },
  { id: 131304, name: "The Maze Runner Collection" },
  { id: 131305, name: "Divergent Collection" },
  { id: 131321, name: "The Mummy Collection" },
  { id: 131323, name: "The Chronicles of Riddick Collection" },
  
  // Sci-Fi & Action
  { id: 131315, name: "Resident Evil Collection" },
  { id: 131316, name: "Underworld Collection" },
  
  // Comedy & Musical
  { id: 131324, name: "Pitch Perfect Collection" },
  { id: 131325, name: "Step Up Collection" },
  
  // Classic & Iconic Franchises
  { id: 131362, name: "Back to the Future Collection" },
  { id: 131363, name: "Ghostbusters Collection" },
  { id: 131364, name: "Men in Black Collection" },
  { id: 131365, name: "The Karate Kid Collection" },
  { id: 131366, name: "Rush Hour Collection" },
  { id: 131367, name: "Lethal Weapon Collection" },
  { id: 131368, name: "Bad Boys Collection" },
  { id: 131369, name: "Rush Hour Collection" },
  { id: 131370, name: "The Pink Panther Collection" },
  { id: 131371, name: "The Naked Gun Collection" },
  { id: 131372, name: "Airplane! Collection" },
  { id: 131373, name: "Police Academy Collection" },
  { id: 131374, name: "American Pie Collection" },
  { id: 131375, name: "Scary Movie Collection" },
  { id: 131376, name: "Meet the Parents Collection" },
  { id: 131377, name: "Home Alone Collection" },
  { id: 131378, name: "Night at the Museum Collection" },
  { id: 131379, name: "Jumanji Collection" },
  { id: 131380, name: "Zombieland Collection" },
  { id: 131381, name: "The Hangover Collection" },
  
  // Sci-Fi & Fantasy Classics
  { id: 131382, name: "Back to the Future Collection" },
  { id: 131383, name: "Ghostbusters Collection" },
  { id: 131384, name: "Men in Black Collection" },
  { id: 131385, name: "The Fifth Element Collection" },
  { id: 131386, name: "Blade Runner Collection" },
  { id: 131387, name: "Total Recall Collection" },
  { id: 131388, name: "RoboCop Collection" },
  { id: 131389, name: "Starship Troopers Collection" },
  { id: 131390, name: "The Thing Collection" },
  { id: 131391, name: "The Fly Collection" },
  { id: 131392, name: "The Invisible Man Collection" },
  { id: 131393, name: "The Mummy Collection" },
  { id: 131394, name: "Journey to the Center of the Earth Collection" },
  { id: 131395, name: "Journey 2: The Mysterious Island Collection" },
  
  // Superhero & Comic Book
  { id: 131396, name: "Iron Man Collection" },
  { id: 131397, name: "Captain America Collection" },
  { id: 131398, name: "Thor Collection" },
  { id: 131399, name: "Guardians of the Galaxy Collection" },
  { id: 131400, name: "Ant-Man Collection" },
  { id: 131401, name: "Doctor Strange Collection" },
  { id: 131402, name: "Black Panther Collection" },
  { id: 131403, name: "Captain Marvel Collection" },
  { id: 131404, name: "Wonder Woman Collection" },
  { id: 131405, name: "Aquaman Collection" },
  { id: 131406, name: "The Flash Collection" },
  { id: 131407, name: "Green Lantern Collection" },
  { id: 131408, name: "Fantastic Four Collection" },
  { id: 131409, name: "Daredevil Collection" },
  { id: 131410, name: "The Punisher Collection" },
  { id: 131411, name: "Ghost Rider Collection" },
  { id: 131412, name: "Deadpool Collection" },
  { id: 131413, name: "Wolverine Collection" },
  { id: 131414, name: "Venom Collection" },
  
  // Action & Adventure
  { id: 131415, name: "The Transporter Collection" },
  { id: 131416, name: "Taken Collection" },
  { id: 131417, name: "The Equalizer Collection" },
  { id: 131418, name: "John Wick Collection" },
  { id: 131419, name: "The Mechanic Collection" },
  { id: 131420, name: "Hitman Collection" },
  { id: 131421, name: "The Accountant Collection" },
  { id: 131422, name: "RED Collection" },
  { id: 131423, name: "The A-Team Collection" },
  { id: 131424, name: "G.I. Joe Collection" },
  { id: 131425, name: "The Expendables Collection" },
  { id: 131426, name: "The Magnificent Seven Collection" },
  { id: 131427, name: "The Wild Bunch Collection" },
  { id: 131428, name: "Dirty Harry Collection" },
  { id: 131429, name: "Death Wish Collection" },
  
  // Horror Classics & Modern
  { id: 131430, name: "The Exorcist Collection" },
  { id: 131431, name: "The Omen Collection" },
  { id: 131432, name: "Poltergeist Collection" },
  { id: 131433, name: "The Amityville Horror Collection" },
  { id: 131434, name: "The Shining Collection" },
  { id: 131435, name: "It Collection" },
  { id: 131436, name: "The Conjuring Collection" },
  { id: 131437, name: "Annabelle Collection" },
  { id: 131438, name: "The Nun Collection" },
  { id: 131439, name: "The Curse of La Llorona Collection" },
  { id: 131440, name: "The Haunting Collection" },
  { id: 131441, name: "The Others Collection" },
  { id: 131442, name: "The Sixth Sense Collection" },
  { id: 131443, name: "The Village Collection" },
  { id: 131444, name: "Signs Collection" },
  
  // Animation & Family
  { id: 131445, name: "Finding Nemo Collection" },
  { id: 131446, name: "Monsters, Inc. Collection" },
  { id: 131447, name: "Cars Collection" },
  { id: 131448, name: "The Incredibles Collection" },
  { id: 131449, name: "Ratatouille Collection" },
  { id: 131450, name: "WALL-E Collection" },
  { id: 131451, name: "Up Collection" },
  { id: 131452, name: "Inside Out Collection" },
  { id: 131453, name: "Coco Collection" },
  { id: 131454, name: "Moana Collection" },
  { id: 131455, name: "Frozen Collection" },
  { id: 131456, name: "Tangled Collection" },
  { id: 131457, name: "The Little Mermaid Collection" },
  { id: 131458, name: "Beauty and the Beast Collection" },
  { id: 131459, name: "Aladdin Collection" },
  { id: 131460, name: "The Lion King Collection" },
  { id: 131461, name: "Mulan Collection" },
  { id: 131462, name: "Pocahontas Collection" },
  { id: 131463, name: "Hercules Collection" },
  { id: 131464, name: "Tarzan Collection" },
  { id: 131465, name: "Lilo & Stitch Collection" },
  { id: 131466, name: "The Princess and the Frog Collection" },
  { id: 131467, name: "Brave Collection" },
  { id: 131468, name: "Big Hero 6 Collection" },
  { id: 131469, name: "Zootopia Collection" },
  { id: 131470, name: "Encanto Collection" },
  { id: 131471, name: "Turning Red Collection" },
  { id: 131472, name: "Elemental Collection" },
  { id: 131473, name: "Wish Collection" },
  
  // Fantasy & Adventure
  { id: 131474, name: "The Chronicles of Narnia Collection" },
  { id: 131475, name: "Percy Jackson Collection" },
  { id: 131476, name: "Eragon Collection" },
  { id: 131477, name: "The Golden Compass Collection" },
  { id: 131478, name: "Stardust Collection" },
  { id: 131479, name: "The Princess Bride Collection" },
  { id: 131480, name: "Willow Collection" },
  { id: 131481, name: "Legend Collection" },
  { id: 131482, name: "Labyrinth Collection" },
  { id: 131483, name: "The Dark Crystal Collection" },
  { id: 131484, name: "Pan's Labyrinth Collection" },
  { id: 131485, name: "The Shape of Water Collection" },
  
  // Thriller & Mystery
  { id: 131486, name: "The Girl with the Dragon Tattoo Collection" },
  { id: 131487, name: "The Da Vinci Code Collection" },
  { id: 131488, name: "Angels & Demons Collection" },
  { id: 131489, name: "Inferno Collection" },
  { id: 131490, name: "The Girl on the Train Collection" },
  { id: 131491, name: "Gone Girl Collection" },
  { id: 131492, name: "Shutter Island Collection" },
  { id: 131493, name: "The Prestige Collection" },
  { id: 131494, name: "Inception Collection" },
  { id: 131495, name: "Interstellar Collection" },
  { id: 131496, name: "The Dark Knight Collection" },
  { id: 131497, name: "The Departed Collection" },
  { id: 131498, name: "Heat Collection" },
  { id: 131499, name: "The Usual Suspects Collection" },
  
  // War & Historical
  { id: 131500, name: "Saving Private Ryan Collection" },
  { id: 131501, name: "Band of Brothers Collection" },
  { id: 131502, name: "The Pacific Collection" },
  { id: 131503, name: "Apocalypse Now Collection" },
  { id: 131504, name: "Full Metal Jacket Collection" },
  { id: 131505, name: "Platoon Collection" },
  { id: 131506, name: "Black Hawk Down Collection" },
  { id: 131507, name: "American Sniper Collection" },
  { id: 131508, name: "Lone Survivor Collection" },
  { id: 131509, name: "13 Hours Collection" },
  { id: 131510, name: "Hacksaw Ridge Collection" },
  { id: 131511, name: "Dunkirk Collection" },
  { id: 131512, name: "1917 Collection" },
  { id: 131513, name: "The Thin Red Line Collection" },
  
  // Crime & Gangster
  { id: 131514, name: "Goodfellas Collection" },
  { id: 131515, name: "Casino Collection" },
  { id: 131516, name: "The Departed Collection" },
  { id: 131517, name: "Scarface Collection" },
  { id: 131518, name: "Carlito's Way Collection" },
  { id: 131519, name: "Heat Collection" },
  { id: 131520, name: "The Untouchables Collection" },
  { id: 131521, name: "Public Enemies Collection" },
  { id: 131522, name: "American Gangster Collection" },
  { id: 131523, name: "Training Day Collection" },
  { id: 131524, name: "End of Watch Collection" },
  { id: 131525, name: "Street Kings Collection" },
  { id: 131526, name: "Brooklyn's Finest Collection" },
  { id: 131527, name: "The Town Collection" },
  { id: 131528, name: "Gone Baby Gone Collection" },
  { id: 131529, name: "Mystic River Collection" },
  { id: 131530, name: "The Departed Collection" },
  { id: 131531, name: "Shutter Island Collection" },
  { id: 131532, name: "Gangs of New York Collection" },
];

function CollectionsSection() {
  const [collections, setCollections] = useState<{ id: number; name: string; posterUrl?: string; backdropUrl?: string; parts: Movie[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCollections() {
      setIsLoading(true);
      try {
        const promises = CURATED_COLLECTIONS.map(c =>
          getCollectionDetails(c.id).catch(() => null)
        );
        const results = await Promise.all(promises);
        setCollections(results.filter(Boolean) as any[]);
      } catch (error) {
        console.error("Failed to load collections:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCollections();
  }, []);

  // Filter collections based on search query
  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.parts.some(movie => 
        movie.title?.toLowerCase().includes(query)
      )
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="font-serif text-2xl text-foreground mb-1">Curated Collections</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Iconic film franchises and sagas
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collections by name or film title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 bg-muted/30 border-border rounded-lg text-sm"
        />
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCollections.map((collection) => (
          <Link
            key={collection.id}
            to={`/collection/${collection.id}`}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/30 transition-all"
          >
            {/* Backdrop */}
            {collection.backdropUrl && (
              <div className="absolute inset-0 z-0">
                <img
                  src={collection.backdropUrl}
                  alt=""
                  className="w-full h-full object-cover opacity-20 grayscale group-hover:opacity-30 group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
              </div>
            )}

            <div className="relative z-10 flex items-center gap-5 p-5">
              {/* Poster Stack */}
              <div className="flex -space-x-6 shrink-0">
                {collection.parts.slice(0, 3).map((movie, idx) => (
                  <div
                    key={movie.id}
                    className="w-14 h-20 rounded-lg overflow-hidden border-2 border-background shadow-lg"
                    style={{ zIndex: 3 - idx }}
                  >
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Film className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {collection.name}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {collection.parts.length} films
                </p>
              </div>

              <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
            </div>
          </Link>
        ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-border rounded-lg">
          <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-sm font-medium mb-1">No collections found</h3>
          <p className="text-xs text-muted-foreground">
            {searchQuery 
              ? `No collections match "${searchQuery}". Try a different search term.`
              : "No collections available."}
          </p>
        </div>
      )}
    </div>
  );
}

