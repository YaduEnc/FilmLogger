import { useState, useEffect } from "react";
import { Review, Movie } from "@/types/movie";
import { H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReviewCard } from "./ReviewCard";
import { getMovieReviews, submitReview } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, PenLine, Loader2, Star, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface ReviewSectionProps {
    movie: Movie;
}

export function ReviewSection({ movie }: ReviewSectionProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);

    useEffect(() => {
        async function loadReviews() {
            try {
                const fetched = await getMovieReviews(movie.id);
                setReviews(fetched);
            } catch (error) {
                console.error("Failed to load reviews:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadReviews();
    }, [movie.id]);

    const handleSubmit = async () => {
        if (!user) return;
        if (text.length < 10) {
            toast.error("Review must be at least 10 characters.");
            return;
        }

        setIsPosting(true);
        try {
            const reviewId = await submitReview({
                movieId: movie.id,
                mediaType: movie.mediaType || 'movie',
                authorUid: user.uid,
                authorName: user.displayName || "Anonymous",
                authorPhoto: user.photoURL || undefined,
                rating,
                text,
                spoilerFlag: isSpoiler,
                visibility: 'public'
            });

            const newReview: Review = {
                id: reviewId,
                movieId: movie.id,
                mediaType: movie.mediaType || 'movie',
                authorUid: user.uid,
                authorName: user.displayName || "Anonymous",
                authorPhoto: user.photoURL || undefined,
                rating,
                text,
                spoilerFlag: isSpoiler,
                visibility: 'public',
                likeCount: 0,
                commentCount: 0,
                createdAt: new Date().toISOString()
            };

            setReviews([newReview, ...reviews]);
            setText("");
            setIsSpoiler(false);
            setShowForm(false);
            toast.success("Review published to the archive.");
        } catch (error) {
            toast.error("Failed to publish review.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <section className="mt-12 sm:mt-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-10 pb-4 border-b border-border/30">
                <div className="flex items-center gap-2 sm:gap-3">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <H3 className="text-xl sm:text-2xl tracking-tight">Community Discussions</H3>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 px-1.5 sm:px-2 py-0.5 rounded-full border border-border/50">
                        {reviews.length}
                    </span>
                </div>
                {!showForm && user && (
                    <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2 rounded-full h-8 sm:h-9 px-4 sm:px-5 border-border/50 hover:bg-muted text-xs sm:text-sm w-full sm:w-auto">
                        <PenLine className="h-3 w-3 sm:h-4 sm:w-4" />
                        Write a review
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="mb-8 sm:mb-12 bg-muted/5 border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                        <h4 className="font-serif text-base sm:text-lg font-medium">Drafting Review</h4>
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="flex flex-col items-start sm:items-end sm:mr-2">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Impact Rating</p>
                                <div className="flex items-center gap-1 sm:gap-1.5 pt-1">
                                    {[...Array(10)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setRating(i + 1)}
                                            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border transition-all active:scale-90 ${rating > i ? 'bg-primary border-primary' : 'bg-transparent border-border hover:border-muted-foreground'
                                                }`}
                                        />
                                    ))}
                                    <span className="ml-1.5 sm:ml-2 font-serif font-bold text-base sm:text-lg min-w-[1ch]">{rating}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Textarea
                            placeholder="Reflect on your experience with this cinematic work..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[120px] sm:min-h-[160px] bg-background border-border focus:ring-primary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-sm sm:text-base leading-relaxed resize-none"
                        />

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-full w-full sm:w-auto justify-center sm:justify-start">
                                <ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500 shrink-0" />
                                <Label htmlFor="spoiler" className="text-[11px] sm:text-xs font-medium text-yellow-600/80 cursor-pointer">Contains Spoilers</Label>
                                <Switch
                                    id="spoiler"
                                    checked={isSpoiler}
                                    onCheckedChange={setIsSpoiler}
                                    className="data-[state=checked]:bg-yellow-500 shrink-0"
                                />
                            </div>

                            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setShowForm(false)} 
                                    className="rounded-full h-10 sm:h-11 px-4 sm:px-6 flex-1 sm:flex-none text-sm sm:text-base"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isPosting || text.length < 10}
                                    className="rounded-full h-10 sm:h-11 px-6 sm:px-8 gap-2 shadow-lg shadow-primary/20 flex-1 sm:flex-none text-sm sm:text-base"
                                >
                                    {isPosting ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <PenLine className="h-3 w-3 sm:h-4 sm:w-4" />}
                                    <span className="hidden sm:inline">Publish to Archive</span>
                                    <span className="sm:hidden">Publish</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-6">
                    <div className="h-32 bg-muted/20 animate-pulse rounded-2xl border border-border/30" />
                    <div className="h-32 bg-muted/20 animate-pulse rounded-2xl border border-border/30" />
                </div>
            ) : reviews.length > 0 ? (
                <div className="grid gap-6">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl">
                    <MessageCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-10" />
                    <p className="text-muted-foreground italic font-serif">No reviews yet. Be the first to start the discussion.</p>
                </div>
            )}
        </section>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
