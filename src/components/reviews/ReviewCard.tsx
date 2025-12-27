import { useState } from "react";
import { Review, ReviewComment } from "@/types/movie";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, AlertTriangle, Eye, EyeOff, Loader2, Send } from "lucide-react";
import { toggleEntityLike, submitComment, getReviewComments } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
    review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
    const { user } = useAuth();
    const [isSpoilerVisible, setIsSpoilerVisible] = useState(!review.spoilerFlag);
    const [likes, setLikes] = useState(review.likeCount);
    const [isLiking, setIsLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<ReviewComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handleToggleLike = async () => {
        if (!user) {
            toast.error("Please sign in to like reviews");
            return;
        }
        setIsLiking(true);
        try {
            const added = await toggleEntityLike(user.uid, review.id, 'review');
            setLikes(prev => added ? prev + 1 : prev - 1);
        } catch (error) {
            toast.error("Action failed");
        } finally {
            setIsLiking(false);
        }
    };

    const handleToggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setIsLoadingComments(true);
            try {
                const fetched = await getReviewComments(review.id);
                setComments(fetched);
            } catch (error) {
                toast.error("Failed to load comments");
            } finally {
                setIsLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleSubmitComment = async () => {
        if (!user || !newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const commentId = await submitComment({
                reviewId: review.id,
                authorUid: user.uid,
                authorName: user.displayName || "Anonymous",
                authorPhoto: user.photoURL || undefined,
                text: newComment,
                spoilerFlag: false, // Default to false for quick comments
            });

            const newlySent: ReviewComment = {
                id: commentId,
                reviewId: review.id,
                authorUid: user.uid,
                authorName: user.displayName || "Anonymous",
                authorPhoto: user.photoURL || undefined,
                text: newComment,
                spoilerFlag: false,
                likeCount: 0,
                createdAt: new Date().toISOString()
            };

            setComments([...comments, newlySent]);
            setNewComment("");
            toast.success("Comment added");
        } catch (error) {
            toast.error("Failed to send comment");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <div className="bg-muted/10 border border-border/50 rounded-2xl p-6 transition-all hover:bg-muted/20">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={review.authorPhoto} />
                        <AvatarFallback className="font-serif bg-muted/50">{review.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h5 className="font-serif text-sm font-medium leading-none mb-1">{review.authorName}</h5>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : "just now"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20">
                    <Heart className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-serif font-bold text-primary">{review.rating}</span>
                </div>
            </div>

            <div className="relative mb-6">
                {review.spoilerFlag && !isSpoilerVisible && (
                    <div
                        className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 flex flex-col items-center justify-center rounded-lg border border-border/50 cursor-pointer group"
                        onClick={() => setIsSpoilerVisible(true)}
                    >
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Contains Spoilers</span>
                        <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 text-primary hover:bg-transparent">Reveal Content</Button>
                    </div>
                )}

                <p className={`text-base leading-relaxed text-foreground/90 whitespace-pre-wrap ${review.spoilerFlag && !isSpoilerVisible ? 'select-none blur-sm grayscale' : ''}`}>
                    {review.text}
                </p>

                {review.spoilerFlag && isSpoilerVisible && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-transparent"
                        onClick={() => setIsSpoilerVisible(false)}
                    >
                        <EyeOff className="h-3 w-3" />
                        Hide spoilers
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-border/30">
                <button
                    onClick={handleToggleLike}
                    disabled={isLiking}
                    className="flex items-center gap-2 group transition-colors"
                >
                    <Heart className={`h-4 w-4 transition-all ${isLiking ? 'scale-110' : 'group-hover:scale-110'} text-muted-foreground group-hover:text-destructive`} />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{likes}</span>
                </button>
                <button
                    onClick={handleToggleComments}
                    className="flex items-center gap-2 group transition-colors"
                >
                    <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{review.commentCount}</span>
                </button>
            </div>

            {showComments && (
                <div className="mt-6 space-y-6 pl-4 border-l-2 border-border/50">
                    {isLoadingComments ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {comments.map((comment) => (
                                <div key={comment.id} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={comment.authorPhoto} />
                                            <AvatarFallback className="text-[8px]">{comment.authorName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[11px] font-serif font-medium">{comment.authorName}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "just now"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 pl-8 leading-relaxed">{comment.text}</p>
                                </div>
                            ))}

                            {user ? (
                                <div className="flex gap-3 pt-2">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback className="text-xs">{user.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 relative">
                                        <Input
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Contribute to the discussion..."
                                            className="pr-10 bg-transparent border-t-0 border-x-0 border-b border-border/50 rounded-none focus:ring-0 focus:border-primary h-10 px-0 text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                                        />
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={isSubmittingComment || !newComment.trim()}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-0"
                                        >
                                            {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic pl-8">Sign in to join the conversation.</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function Input(props: any) {
    return <input {...props} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", props.className)} />;
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
