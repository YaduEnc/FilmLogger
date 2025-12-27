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
        <section className="mt-20">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    <H3 className="text-2xl tracking-tight">Community Discussions</H3>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border/50">
                        {reviews.length}
                    </span>
                </div>
                {!showForm && user && (
                    <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2 rounded-full h-9 px-5 border-border/50 hover:bg-muted">
                        <PenLine className="h-4 w-4" />
                        Write a review
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="mb-12 bg-muted/5 border border-primary/20 rounded-3xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="font-serif text-lg font-medium">Drafting Review</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Impact Rating</p>
                                <div className="flex items-center gap-1.5 pt-1">
                                    {[...Array(10)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setRating(i + 1)}
                                            className={`w-4 h-4 rounded-full border transition-all ${rating > i ? 'bg-primary border-primary' : 'bg-transparent border-border hover:border-muted-foreground'
                                                }`}
                                        />
                                    ))}
                                    <span className="ml-2 font-serif font-bold text-lg min-w-[1ch]">{rating}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Textarea
                            placeholder="Reflect on your experience with this cinematic work..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[160px] bg-background border-border focus:ring-primary rounded-2xl p-6 text-base leading-relaxed resize-none"
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-full">
                                <ShieldAlert className="h-3.5 w-3.5 text-yellow-500" />
                                <Label htmlFor="spoiler" className="text-xs font-medium text-yellow-600/80 cursor-pointer">Contains Spoilers</Label>
                                <Switch
                                    id="spoiler"
                                    checked={isSpoiler}
                                    onCheckedChange={setIsSpoiler}
                                    className="data-[state=checked]:bg-yellow-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-full h-11 px-6">Cancel</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isPosting || text.length < 10}
                                    className="rounded-full h-11 px-8 gap-2 shadow-lg shadow-primary/20"
                                >
                                    {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                                    Publish to Archive
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
