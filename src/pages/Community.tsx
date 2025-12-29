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
  TrendingUp, Film, X, Activity, Sparkles
} from "lucide-react";
import { searchMovies, searchTV } from "@/lib/tmdb";
import { Movie } from "@/types/movie";
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
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <H1 className="tracking-tight mb-2">Community</H1>
          <p className="text-muted-foreground">
            Connect, discuss, and discover with fellow cinephiles
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 h-12 bg-muted/30">
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Polls
            </TabsTrigger>
            <TabsTrigger value="debates" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Debates
            </TabsTrigger>
            <TabsTrigger value="lists" className="gap-2">
              <List className="h-4 w-4" />
              Lists
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <ActivityFeed />
          </TabsContent>

          <TabsContent value="polls">
            <PollsSection user={user} />
          </TabsContent>

          <TabsContent value="debates">
            <DebatesSection user={user} />
          </TabsContent>

          <TabsContent value="lists">
            <ListsSection user={user} />
          </TabsContent>

          <TabsContent value="people">
            <PeopleSection user={user} />
          </TabsContent>
        </Tabs>
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
      <div className="flex items-center justify-between mb-6">
        <H2 className="text-2xl">Community Polls</H2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create a Poll</DialogTitle>
            </DialogHeader>
            <CreatePollForm user={user} onSuccess={() => { setIsCreateOpen(false); loadPolls(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} user={user} onVote={loadPolls} />
          ))}
          {polls.length === 0 && (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No polls yet. Be the first to create one!</p>
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
      toast.error("Please sign in to vote");
      return;
    }

    setIsVoting(true);
    try {
      await votePoll(poll.id, optionId, user.uid);
      setUserVote(optionId);
      toast.success("Vote recorded!");
      onVote();
    } catch (error: any) {
      toast.error(error.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={poll.authorPhoto} />
          <AvatarFallback>{poll.authorName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{poll.authorName}</p>
          <p className="text-sm text-muted-foreground">{new Date(poll.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge variant="secondary">{poll.pollType.replace('_', ' ')}</Badge>
      </div>

      <H3 className="text-xl mb-4">{poll.question}</H3>

      <div className="space-y-3">
        {poll.options.map((option: any) => {
          const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
          const isSelected = userVote === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !userVote && handleVote(option.id)}
              disabled={!!userVote || isVoting}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all relative overflow-hidden",
                isSelected && "border-primary bg-primary/5",
                !userVote && "hover:border-primary/50 hover:bg-muted/50 cursor-pointer",
                userVote && "cursor-default"
              )}
            >
              {userVote && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center gap-3">
                {option.posterUrl && (
                  <img
                    src={option.posterUrl}
                    alt={option.text}
                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{option.text}</span>
                  {userVote && (
                    <span className="text-sm font-bold ml-4">{percentage.toFixed(1)}%</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{poll.totalVotes} votes</span>
      </div>
    </Card>
  );
}

function CreatePollForm({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<'custom' | 'movie' | 'actor' | 'director'>('custom');
  const [options, setOptions] = useState<any[]>([{ text: "", movieData: null }, { text: "", movieData: null }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchingFor, setSearchingFor] = useState<number | null>(null);

  const addOption = () => setOptions([...options, { text: "", movieData: null }]);
  const updateOption = (index: number, value: string, movieData: any = null) => {
    const newOptions = [...options];
    newOptions[index] = { text: value, movieData };
    setOptions(newOptions);
  };
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { movies } = await searchMovies(query);
      setSearchResults(movies.slice(0, 5));
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const selectMovie = (index: number, movie: Movie) => {
    updateOption(index, movie.title, { id: movie.id, poster: movie.posterUrl });
    setSearchingFor(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validOptions = options.filter(o => o.text.trim());
    if (validOptions.length < 2) {
      toast.error("Please add at least 2 options");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPoll({
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        question,
        pollType,
        options: validOptions.map((opt, i) => ({
          id: `opt_${i}`,
          text: opt.text,
          votes: 0,
          movieId: opt.movieData?.id,
          posterUrl: opt.movieData?.poster
        }))
      });
      toast.success("Poll created!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Question</label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your question?"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Poll Type</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'custom', label: 'Custom' },
            { value: 'movie', label: 'Movie' },
            { value: 'actor', label: 'Actor' },
            { value: 'director', label: 'Director' }
          ].map((type) => (
            <Button
              key={type.value}
              type="button"
              variant={pollType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPollType(type.value as any)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Options</label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="space-y-2">
              <div className="flex gap-2">
                {pollType === 'movie' ? (
                  <div className="flex-1">
                    {option.movieData ? (
                      <div className="flex items-center gap-2 p-2 border rounded-lg">
                        {option.movieData.poster && (
                          <img src={option.movieData.poster} alt="" className="w-10 h-14 object-cover rounded" />
                        )}
                        <span className="flex-1">{option.text}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateOption(index, "", null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setSearchingFor(index)}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search for movie...
                      </Button>
                    )}
                  </div>
                ) : (
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                )}
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {searchingFor === index && (
                <div className="border rounded-lg p-3 space-y-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder="Search movies..."
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {searchResults.map((movie) => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => selectMovie(index, movie)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded text-left"
                        >
                          {movie.posterUrl && (
                            <img src={movie.posterUrl} alt="" className="w-8 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{movie.title}</p>
                            <p className="text-xs text-muted-foreground">{movie.year}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Poll"}
      </Button>
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
      <div className="flex items-center justify-between mb-6">
        <H2 className="text-2xl">Community Debates</H2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Start Debate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Start a Debate</DialogTitle>
            </DialogHeader>
            <CreateDebateForm user={user} onSuccess={() => { setIsCreateOpen(false); loadDebates(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6">
          {debates.map((debate) => (
            <DebateCard key={debate.id} debate={debate} user={user} onVote={loadDebates} />
          ))}
          {debates.length === 0 && (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No debates yet. Start the conversation!</p>
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
      toast.error("Please sign in to vote");
      return;
    }

    try {
      await voteDebate(debate.id, side, user.uid);
      setUserVote(side);
      toast.success("Vote recorded!");
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
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const total = debate.side1Votes + debate.side2Votes;
  const side1Percentage = total > 0 ? (debate.side1Votes / total) * 100 : 50;
  const side2Percentage = total > 0 ? (debate.side2Votes / total) * 100 : 50;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={debate.authorPhoto} />
          <AvatarFallback>{debate.authorName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{debate.authorName}</p>
          <p className="text-sm text-muted-foreground">{new Date(debate.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <H3 className="text-xl mb-2">{debate.title}</H3>
      <p className="text-muted-foreground mb-6">{debate.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleVote(1)}
          disabled={!!userVote}
          className={cn(
            "p-6 rounded-lg border-2 transition-all text-center",
            userVote === 1 && "border-primary bg-primary/5",
            !userVote && "hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <p className="font-bold text-lg mb-2">{debate.side1}</p>
          <div className="text-3xl font-serif font-bold mb-2">{side1Percentage.toFixed(0)}%</div>
          <p className="text-sm text-muted-foreground">{debate.side1Votes} votes</p>
        </button>

        <button
          onClick={() => handleVote(2)}
          disabled={!!userVote}
          className={cn(
            "p-6 rounded-lg border-2 transition-all text-center",
            userVote === 2 && "border-primary bg-primary/5",
            !userVote && "hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <p className="font-bold text-lg mb-2">{debate.side2}</p>
          <div className="text-3xl font-serif font-bold mb-2">{side2Percentage.toFixed(0)}%</div>
          <p className="text-sm text-muted-foreground">{debate.side2Votes} votes</p>
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        {debate.commentCount} Comments
      </Button>

      {showComments && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {user && (
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add your thoughts..."
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button onClick={handleComment} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.authorPhoto} />
                <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.authorName}</span>
                  {comment.side && (
                    <Badge variant="outline" className="text-xs">
                      {comment.side === 1 ? debate.side1 : debate.side2}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CreateDebateForm({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [side1, setSide1] = useState("");
  const [side2, setSide2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
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
      toast.success("Debate started!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create debate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the debate about?"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide some context..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Side 1</label>
          <Input
            value={side1}
            onChange={(e) => setSide1(e.target.value)}
            placeholder="e.g., Marvel"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Side 2</label>
          <Input
            value={side2}
            onChange={(e) => setSide2(e.target.value)}
            placeholder="e.g., DC"
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Debate"}
      </Button>
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
      <H2 className="text-2xl mb-6">Public Lists</H2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ListCard key={`${list.userId}_${list.id}`} list={list} user={user} />
          ))}
          {lists.length === 0 && (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No public lists yet</p>
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

  const handleComment = async () => {
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
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  return (
    <Link
      to={`/list/${list.userId}/${list.id}`}
      className="block border rounded-lg p-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Movie Poster */}
        {list.movies && list.movies.length > 0 && list.movies[0].posterUrl && (
          <img
            src={list.movies[0].posterUrl}
            alt={list.name}
            className="w-16 h-24 object-cover rounded flex-shrink-0"
          />
        )}

        {/* List Info */}
        <div className="flex-1 min-w-0">
          <H3 className="text-lg font-semibold truncate">{list.name}</H3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage src={list.userPhoto} />
              <AvatarFallback className="text-xs">{list.userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{list.userName}</span>
            <span>•</span>
            <span>{new Date(list.createdAt).toLocaleDateString()}</span>
          </div>
          {list.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{list.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            <span>{list.movies?.length || 0}</span>
          </div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ThumbsUp className="h-4 w-4" />
            <span>0</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t space-y-3">
          {user && (
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                className="h-9"
              />
              <Button onClick={handleComment} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 text-sm">
              <Avatar className="h-7 w-7">
                <AvatarImage src={comment.authorPhoto} />
                <AvatarFallback className="text-xs">{comment.authorName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Link>
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <H3 className="text-xl">{title}</H3>
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
    <div className="space-y-8">
      {/* Search Section */}
      <div>
        <H2 className="text-2xl mb-6">Find People</H2>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or display name..."
            className="pl-12 h-14 text-lg bg-muted/5 border-border/50 focus:ring-primary rounded-2xl"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
            <div className="text-center py-16 border border-dashed rounded-xl">
              <p className="text-muted-foreground">No users found matching "{searchTerm}"</p>
            </div>
          )
        ) : (
          // Show recommendations when no search
          <div className="space-y-12">
            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {recommendedUsers.length > 0 && renderUserCategory(
                  "Recommended for You",
                  recommendedUsers,
                  <Sparkles className="h-5 w-5 text-primary" />
                )}

                {activeUsers.length > 0 && renderUserCategory(
                  "Most Active",
                  activeUsers,
                  <TrendingUp className="h-5 w-5 text-primary" />
                )}

                {newUsers.length > 0 && renderUserCategory(
                  "New to CineLunatic",
                  newUsers,
                  <Sparkles className="h-5 w-5 text-primary" />
                )}

                {recommendedUsers.length === 0 && activeUsers.length === 0 && newUsers.length === 0 && (
                  <div className="text-center py-16 border border-dashed rounded-xl">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">No recommendations available</p>
                    <p className="text-sm text-muted-foreground mt-2">Start watching movies to get personalized recommendations!</p>
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
      toast.error("Please sign in to connect");
      return;
    }

    try {
      if (status.status === 'none') {
        await sendConnectionRequest(currentUser.uid, targetUser.uid);
        setStatus({ status: 'pending' });
        toast.success("Connection request sent");
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

        toast.success(`You are now connected with ${targetUser.displayName}`);
      }
    } catch (error) {
      toast.error("Failed to update connection");
    }
  };

  return (
    <div className="flex items-center justify-between p-5 bg-background border border-border/50 rounded-2xl hover:border-primary/30 transition-all group">
      <div className="flex items-center gap-5">
        <Link to={`/profile/${targetUser.username}`}>
          <Avatar className="h-14 w-14 border-2 border-border/50 group-hover:border-primary/20 transition-all">
            <AvatarImage src={targetUser.photoURL} />
            <AvatarFallback className="font-serif bg-muted">{targetUser.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0">
          <Link to={`/profile/${targetUser.username}`} className="hover:underline underline-offset-4">
            <h4 className="font-serif text-lg leading-none mb-1">{targetUser.displayName}</h4>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs font-mono opacity-70">@{targetUser.username}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{targetUser.totalWatched || targetUser.stats?.totalWatched || 0} films</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to={`/profile/${targetUser.username}`}>
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 rounded-full opacity-60 hover:opacity-100 hover:bg-muted">
            View Profile
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>

        {isLoading ? (
          <div className="w-28 h-9 bg-muted animate-pulse rounded-full" />
        ) : (
          <Button
            onClick={handleConnect}
            disabled={status.status === 'pending' || status.status === 'accepted'}
            variant={status.status === 'accepted' ? "secondary" : "outline"}
            className={cn(
              "rounded-full gap-2 px-6 h-9 transition-all",
              status.status === 'accepted' && "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 shadow-none",
              status.status === 'pending' && "opacity-50 grayscale cursor-default"
            )}
          >
            {status.status === 'none' && (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                Connect
              </>
            )}
            {status.status === 'pending' && (
              <>
                <Clock className="h-3.5 w-3.5" />
                Pending
              </>
            )}
            {status.status === 'incoming' && (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                Accept
              </>
            )}
            {status.status === 'accepted' && (
              <>
                <Check className="h-3.5 w-3.5" />
                Connected
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
