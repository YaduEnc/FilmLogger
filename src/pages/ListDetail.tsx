import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/movies/MovieCard";
import {
    Loader2, Calendar, Film, MessageSquare, ThumbsUp,
    Send, UserPlus, ArrowLeft, Bookmark, Globe
} from "lucide-react";
import {
    getList, getListComments, addListComment,
    toggleListLike, toggleSaveList, getListInteractions
} from "@/lib/db";
import { MovieList, Movie } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ListDetail() {
    const { userId, listId } = useParams();
    const { user } = useAuth();
    const [list, setList] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isSaveLoading, setIsSaveLoading] = useState(false);

    useEffect(() => {
        if (userId && listId) {
            loadList();
            loadComments();
            if (user) {
                loadInteractions();
            }
        }
    }, [userId, listId, user?.uid]);

    const loadList = async () => {
        setIsLoading(true);
        try {
            const data = await getList(userId!, listId!);
            setList(data);
        } catch (error) {
            console.error("Error loading list:", error);
            toast.error("Failed to load list");
        } finally {
            setIsLoading(false);
        }
    };

    const loadInteractions = async () => {
        if (user && listId && userId) {
            const interaction = await getListInteractions(user.uid, listId, userId);
            setIsLiked(interaction.isLiked);
            setIsSaved(interaction.isSaved);
        }
    };

    const loadComments = async () => {
        if (listId && userId) {
            try {
                const data = await getListComments(listId, userId);
                setComments(data);
            } catch (error) {
                console.error("Error loading comments:", error);
            }
        }
    };

    const handleAddComment = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!user || !newComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        try {
            await addListComment({
                listId: listId!,
                listOwnerId: userId!,
                authorUid: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL,
                text: newComment.trim()
            });
            setNewComment("");
            await loadComments();
            toast.success("Comment added");
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleToggleLike = async () => {
        if (!user) {
            toast.error("Please sign in to like lists");
            return;
        }
        if (isLikeLoading) return;

        setIsLikeLoading(true);
        try {
            const liked = await toggleListLike(user.uid, userId!, listId!, list?.name, user.displayName || 'Someone', user.photoURL || undefined);
            setIsLiked(liked);
            setList((prev: any) => ({
                ...prev,
                likeCount: liked ? (prev.likeCount || 0) + 1 : Math.max(0, (prev.likeCount || 0) - 1)
            }));
            toast.success(liked ? "List liked" : "Like removed");
        } catch (error) {
            toast.error("Failed to update like");
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleToggleSave = async () => {
        if (!user) {
            toast.error("Please sign in to save lists");
            return;
        }
        if (isSaveLoading) return;

        setIsSaveLoading(true);
        try {
            const saved = await toggleSaveList(user.uid, userId!, listId!, list?.name, user.displayName || 'Someone', user.photoURL || undefined);
            setIsSaved(saved);
            setList((prev: any) => ({
                ...prev,
                saveCount: saved ? (prev.saveCount || 0) + 1 : Math.max(0, (prev.saveCount || 0) - 1)
            }));
            toast.success(saved ? "List saved to your profile" : "List unsaved");
        } catch (error) {
            toast.error("Failed to update save status");
        } finally {
            setIsSaveLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-6 py-24 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </Layout>
        );
    }

    if (!list) {
        return (
            <Layout>
                <div className="container mx-auto px-6 py-24 text-center">
                    <H2 className="mb-4">List not found</H2>
                    <p className="text-muted-foreground mb-8">The list you are looking for doesn't exist or is private.</p>
                    <Link to="/community">
                        <Button variant="outline">Back to Community</Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-background text-foreground">
                {/* Hero / Header Section */}
                <div className="bg-muted/10 border-b border-border/50">
                    <div className="container mx-auto px-6 py-12 max-w-7xl">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* List Preview (Stack of posters) */}
                            <div className="w-full md:w-64 h-96 bg-muted/20 rounded-2xl border border-border/50 overflow-hidden relative shadow-2xl shrink-0">
                                {list.movies && list.movies.length > 0 ? (
                                    <>
                                        {/* Create a layered effect if more than one movie */}
                                        {list.movies.slice(0, 3).map((movie: Movie, idx: number) => (
                                            <div
                                                key={movie.id}
                                                className="absolute inset-x-0 w-full h-full transition-transform duration-500"
                                                style={{
                                                    top: `${idx * 15}px`,
                                                    zIndex: 10 - idx,
                                                    transform: `scale(${1 - idx * 0.05})`,
                                                    opacity: 1 - idx * 0.3
                                                }}
                                            >
                                                <img
                                                    src={movie.posterUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                                                />
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                                        <Film className="h-12 w-12 mb-4" />
                                        <p className="font-serif italic">Empty List</p>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-6">
                                <Link
                                    to="/community"
                                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Community
                                </Link>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <H1 className="text-4xl md:text-5xl tracking-tight leading-tight">{list.name}</H1>
                                        <Badge variant="outline" className="h-fit py-0.5 px-2 bg-muted/30">
                                            <Globe className="h-3 w-3 mr-1 opacity-60" />
                                            Public
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={list.userPhoto} />
                                                <AvatarFallback>{list.userName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">Created by <span className="text-primary hover:underline cursor-pointer">{list.userName}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(list.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <ThumbsUp className="h-4 w-4" />
                                            <span>{list.likeCount || 0} {list.likeCount === 1 ? 'like' : 'likes'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Bookmark className="h-4 w-4" />
                                            <span>{list.saveCount || 0} {list.saveCount === 1 ? 'save' : 'saves'}</span>
                                        </div>
                                    </div>
                                </div>

                                {list.description && (
                                    <p className="text-xl text-muted-foreground font-serif italic max-w-3xl leading-relaxed">
                                        "{list.description}"
                                    </p>
                                )}

                                {/* Tags */}
                                {list.tags && list.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {list.tags.map((tag: string) => (
                                            <Link
                                                key={tag}
                                                to={`/lists/community?tag=${encodeURIComponent(tag)}`}
                                                className="px-3 py-1 text-xs font-medium bg-muted rounded-full text-muted-foreground hover:bg-amber-500/20 hover:text-amber-500 transition-colors"
                                            >
                                                {tag}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* Ranked List Indicator */}
                                {list.isRanked && (
                                    <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full w-fit">
                                        <span className="font-bold">🏆</span>
                                        <span className="font-medium">Ranked List</span>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        onClick={handleToggleSave}
                                        disabled={isSaveLoading}
                                        variant={isSaved ? "secondary" : "default"}
                                        className="rounded-full px-8 gap-2"
                                    >
                                        {isSaveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />}
                                        {isSaved ? "Saved" : "Save List"}
                                    </Button>
                                    <Button
                                        onClick={handleToggleLike}
                                        disabled={isLikeLoading}
                                        variant={isLiked ? "secondary" : "outline"}
                                        size="icon"
                                        className="rounded-full"
                                    >
                                        {isLikeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-current")} />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="container mx-auto px-6 py-16 max-w-7xl">
                    <div className="grid lg:grid-cols-4 gap-16">
                        {/* Movie Grid */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-10 border-b border-border/50 pb-4">
                                <H2 className="text-2xl font-medium tracking-tight">The Collection</H2>
                            </div>

                            {list.movies && list.movies.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-12">
                                    {list.movies.map((movie: Movie, index: number) => (
                                        <div key={movie.id} className="relative">
                                            {/* Ranked Position Badge */}
                                            {list.isRanked && (
                                                <div className={cn(
                                                    "absolute -top-4 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg",
                                                    index === 0 ? "bg-amber-500 text-black" :
                                                        index === 1 ? "bg-gray-300 text-black" :
                                                            index === 2 ? "bg-amber-700 text-white" :
                                                                "bg-muted text-foreground"
                                                )}>
                                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                                </div>
                                            )}
                                            <MovieCard movie={movie} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-border/40">
                                    <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground italic font-serif">No films added to this collection yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar: Comments & Social info */}
                        <aside className="space-y-10">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <H3 className="text-lg font-medium flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                        Comments
                                        <span className="text-xs font-sans text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {comments.length}
                                        </span>
                                    </H3>
                                </div>

                                {user ? (
                                    <form onSubmit={handleAddComment} className="mb-8 space-y-3">
                                        <div className="relative group">
                                            <Input
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="pr-12 bg-muted/5 border-border/60 focus:ring-primary h-12 rounded-xl transition-all"
                                            />
                                            <Button
                                                type="submit"
                                                size="icon"
                                                className="absolute right-1.5 top-1.5 h-9 w-9 opacity-0 group-focus-within:opacity-100 transition-opacity"
                                                disabled={isSubmittingComment || !newComment.trim()}
                                            >
                                                {isSubmittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl italic mb-8">
                                        Sign in to join the conversation.
                                    </p>
                                )}

                                <div className="space-y-6">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="group pb-6 border-b border-border/30 last:border-0">
                                            <div className="flex gap-4 items-start">
                                                <Avatar className="h-10 w-10 border-2 border-border/30">
                                                    <AvatarImage src={comment.authorPhoto} />
                                                    <AvatarFallback className="bg-muted text-xs font-serif">{comment.authorName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-sm font-semibold truncate hover:underline cursor-pointer">{comment.authorName}</h4>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-60">
                                                            {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 leading-relaxed break-words">
                                                        {comment.text}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <button className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                                            <ThumbsUp className="h-2.5 w-2.5" />
                                                            {comment.likeCount || 0}
                                                        </button>
                                                        <button className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                                            Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {comments.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground italic text-sm opacity-50">
                                            No comments yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

const Badge = ({ children, variant, className }: any) => (
    <span className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        variant === 'outline' ? "border border-border text-foreground" : "bg-primary text-primary-foreground",
        className
    )}>
        {children}
    </span>
);
