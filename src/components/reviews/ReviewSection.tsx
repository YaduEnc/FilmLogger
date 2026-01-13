import { useState, useEffect } from "react";
import { Review, Movie } from "@/types/movie";
import { H3, Paragraph } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReviewCard } from "./ReviewCard";
import { getMovieReviews, submitReview } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, PenLine, Loader2, Star, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewSectionProps {
    movie: Movie;
    onReviewSubmitted?: () => void;
}

const DISCUSSION_PROMPTS = [
    "Is {director} even trying here, or is this just for the fans?",
    "The first act of {title} is pure cinema. Does the rest hold up?",
    "Is {title} the best looking {genre} film we've seen in years?",
    "We need to talk about the ending of {title}. Pure genius or a total mess?",
    "Is this {director}'s most underrated work to date?",
    "Does {title} actually have anything to say, or is it just vibes?",
    "I'm still thinking about that one scene in {title}. You know the one.",
    "Is {title} a future classic or a product of its time?",
    "{title} is basically {genre} perfection. Agree or disagree?",
    "Honestly, {director} just gets it. Is this their best yet?"
];

function getDiscussionPrompt(movie: Movie) {
    const director = movie.director || "the filmmaker";
    const genre = movie.genres?.[0] || "cinema";
    const title = movie.title;

    // Use a hash of the movie ID to pick a consistent prompt for the same movie
    const promptIndex = (movie.id % DISCUSSION_PROMPTS.length);
    const prompt = DISCUSSION_PROMPTS[promptIndex];

    return prompt
        .replace(/{director}/g, director)
        .replace(/{genre}/g, genre.toLowerCase())
        .replace(/{title}/g, title);
}

export function ReviewSection({ movie, onReviewSubmitted }: ReviewSectionProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const getWritingState = (length: number) => {
        if (length === 0) return "";
        if (length < 50) return "Initial thoughts";
        if (length < 200) return "Standard review";
        if (length < 500) return "In-depth analysis";
        return "Cinematic essay";
    };

    const handleSaveDraft = () => {
        setIsSavingDraft(true);
        try {
            const draft = {
                text,
                rating,
                isSpoiler,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`review_draft_${movie.id}`, JSON.stringify(draft));
            setTimeout(() => {
                setIsSavingDraft(false);
                toast.success("Draft saved to local storage.");
            }, 600);
        } catch (error) {
            setIsSavingDraft(false);
            toast.error("Failed to save draft.");
        }
    };

    useEffect(() => {
        async function loadReviews() {
            try {
                const fetched = await getMovieReviews(movie.id);
                setReviews(fetched);

                // Load draft if exists
                const savedDraft = localStorage.getItem(`review_draft_${movie.id}`);
                if (savedDraft) {
                    try {
                        const { text: draftText, rating: draftRating, isSpoiler: draftSpoiler } = JSON.parse(savedDraft);
                        setText(draftText || "");
                        setRating(draftRating || 5);
                        setIsSpoiler(draftSpoiler || false);
                        // If there's non-empty text, maybe show the form automatically? 
                        // Or just wait for them to open it. Let's not force it open.
                    } catch (e) {
                        console.error("Failed to parse saved draft");
                    }
                }
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
            // Clear draft
            localStorage.removeItem(`review_draft_${movie.id}`);

            // Notify parent to refresh community data
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }

            toast.success("Review published.");
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
                <div className="mb-8 sm:mb-12 bg-muted/5 border border-primary/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-6 sm:gap-0">
                        <div className="space-y-1">
                            <h4 className="font-serif text-lg sm:text-xl font-medium text-foreground">Drafting Review</h4>
                            <p className="text-xs text-muted-foreground max-w-sm">No required length or specific format. Just your honest reflection.</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="flex flex-col items-start sm:items-end w-full">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact Rating</p>
                                    <Paragraph className="text-[10px] text-muted-foreground/50 lowercase italic leading-none">(Emotional & cinematic weight)</Paragraph>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                    {[...Array(10)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setRating(i + 1)}
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all active:scale-90 shrink-0 ${rating > i ? 'bg-primary border-primary' : 'bg-transparent border-border hover:border-muted-foreground'
                                                }`}
                                        />
                                    ))}
                                    <span className="ml-2 font-serif font-bold text-lg sm:text-xl min-w-[1.5ch]">{rating}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Textarea
                            placeholder="What lingers with you after the credits? Reflect on your experience..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[140px] sm:min-h-[200px] bg-background border-border focus:ring-primary/30 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-base sm:text-lg leading-relaxed resize-none shadow-inner"
                        />
                        {text.length > 0 && (
                            <div className="flex justify-end pr-1">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono animate-in fade-in slide-in-from-right-2 duration-500">
                                    {getWritingState(text.length)} · {text.length} chars
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 sm:gap-0">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-full w-fit">
                                <ShieldAlert className="h-3.5 w-3.5 text-yellow-500/80 shrink-0" />
                                <Label htmlFor="spoiler" className="text-[11px] sm:text-xs font-medium text-yellow-600/70 cursor-pointer">Contain Spoilers</Label>
                                <Switch
                                    id="spoiler"
                                    checked={isSpoiler}
                                    onCheckedChange={setIsSpoiler}
                                    className="data-[state=checked]:bg-yellow-500 scale-90 shrink-0"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground/50 pl-1">Selecting this will hide your text behind a visual veil for others.</p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                onClick={() => setShowForm(false)}
                                className="rounded-full h-11 px-6 text-muted-foreground/60 hover:text-foreground text-sm flex-none hidden sm:inline-flex"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft || text.length === 0}
                                className="rounded-full h-11 px-6 gap-2 border-border/50 text-sm flex-1 sm:flex-none"
                            >
                                {isSavingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                Save draft
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPosting || text.length < 10}
                                className="rounded-full h-11 sm:h-12 px-8 sm:px-10 gap-2 shadow-xl shadow-primary/20 flex-1 sm:flex-none text-sm sm:text-base font-medium"
                            >
                                {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                                Publish review
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {
                isLoading ? (
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
                    <div className="mt-8 py-16 sm:py-24 flex flex-col items-center text-center bg-muted/10 border border-border/30 rounded-lg px-6 relative overflow-hidden group">
                        <div className="relative z-10 max-w-lg">
                            <div className="mb-6 flex flex-col items-center gap-3">
                                <div className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
                                    <span className="uppercase tracking-widest text-[9px] font-bold">Hot Take</span>
                                </div>
                                <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight uppercase text-foreground">
                                    Start the conversation
                                </h2>
                            </div>

                            <div className="mb-8">
                                <p className="font-serif text-lg sm:text-xl text-foreground font-medium italic leading-relaxed mb-3">
                                    "{getDiscussionPrompt(movie)}"
                                </p>
                                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                                    No opinions yet. Yours sets the tone.
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowForm(true)}
                                className="rounded-full h-11 sm:h-12 px-8 sm:px-10 gap-2 shadow-lg shadow-primary/20 transition-all duration-300"
                            >
                                <PenLine className="h-4 w-4" />
                                Share your take
                            </Button>
                        </div>
                    </div>
                )
            }
        </section >
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
