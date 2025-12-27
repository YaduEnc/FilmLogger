import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { voteGenre } from "@/lib/db";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";

interface GenreTaggerProps {
    mediaId: string;
    mediaType: 'movie' | 'tv';
    topGenres: string[];
    userGenres: string[];
    onVoteComplete?: () => void;
    className?: string;
}

const COMMON_GENRES = [
    "Noir", "Slow Cinema", "Mind-bending", "Gothic", "Surrealist",
    "Cyberpunk", "Coming of Age", "Psychological", "Disturbing",
    "Feel-good", "Minimalist", "Epic", "Cult Classic"
];

export function GenreTagger({
    mediaId,
    mediaType,
    topGenres,
    userGenres: initialUserGenres,
    onVoteComplete,
    className
}: GenreTaggerProps) {
    const { user } = useAuth();
    const [userGenres, setUserGenres] = useState<string[]>(initialUserGenres);
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setUserGenres(initialUserGenres);
    }, [initialUserGenres]);

    const handleVote = async () => {
        if (isSubmitting) return; // Prevent double taps without disabling UI prematurely

        if (!user) {
            toast({ title: "Sign in required", description: "You must be logged in to vote on genres.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await voteGenre(user.uid, mediaId, mediaType, userGenres);
            toast({ title: "Votes saved", description: "Your genre tags have been recorded." });
            setIsOpen(false);
            onVoteComplete?.();
        } catch (error) {
            console.error("Failed to vote:", error);
            toast({ title: "Error", description: "Failed to save votes.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleGenre = (genre: string) => {
        if (userGenres.includes(genre)) {
            setUserGenres(prev => prev.filter(g => g !== genre));
        } else {
            if (userGenres.length >= 5) {
                toast({ title: "Limit reached", description: "You can only vote for up to 5 genres.", variant: "destructive" });
                return;
            }
            setUserGenres(prev => [...prev, genre]);
        }
    };

    const addCustomGenre = () => {
        if (!input.trim()) return;
        const normalized = input.trim(); // Capitalization could be handled better
        // Simple case-insensitive check
        if (userGenres.some(g => g.toLowerCase() === normalized.toLowerCase())) {
            setInput("");
            return;
        }
        toggleGenre(normalized);
        setInput("");
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {/* Display Top Genres */}
            {topGenres.map(genre => (
                <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] sm:text-xs font-normal px-2 py-0.5"
                >
                    {genre}
                </Badge>
            ))}

            {/* Voting Trigger */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1">
                        <Plus className="h-3 w-3" />
                        Tag Genres
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none">Tag Genres</h4>
                            <span className="text-xs text-muted-foreground">{userGenres.length}/5</span>
                        </div>

                        {/* Selected User Genres */}
                        <div className="flex flex-wrap gap-2 min-h-[2rem]">
                            {userGenres.length > 0 ? (
                                userGenres.map(g => (
                                    <Badge key={g} variant="default" className="gap-1 pr-1">
                                        {g}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleGenre(g)} />
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No genres selected</p>
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomGenre()}
                                placeholder="Add custom genre..."
                                className="h-8 text-sm"
                            />
                            <Button size="sm" variant="secondary" className="h-8" onClick={addCustomGenre}>Add</Button>
                        </div>

                        {/* Suggestions */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Popular</p>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_GENRES.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => toggleGenre(g)}
                                        className={cn(
                                            "text-xs border px-2 py-1 rounded-sm transition-colors",
                                            userGenres.includes(g)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background hover:bg-muted border-border text-muted-foreground"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleVote} disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Votes"}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}


