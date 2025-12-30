import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { createCustomList } from "@/lib/db";
import { toast } from "sonner";
import { Loader2, ListOrdered, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const GENRE_TAGS = [
    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
    "Drama", "Family", "Fantasy", "Horror", "Mystery", "Romance",
    "Sci-Fi", "Thriller", "War", "Western", "Cult Classics", "Indie",
    "Foreign", "Musical", "Sports", "Biography", "Noir"
];

export function CreateListModal({ isOpen, onClose, onSuccess }: CreateListModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isRanked, setIsRanked] = useState(false);
    const [visibility, setVisibility] = useState<'public' | 'private' | 'followers'>('public');
    const [isLoading, setIsLoading] = useState(false);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!name.trim()) {
            toast.error("Please provide a list name");
            return;
        }

        setIsLoading(true);
        try {
            await createCustomList(user.uid, name, description, {
                tags: selectedTags,
                listType: isRanked ? 'ranked' : 'standard',
                isRanked,
                visibility
            });
            toast.success("List created successfully");
            // Reset form
            setName("");
            setDescription("");
            setSelectedTags([]);
            setIsRanked(false);
            setVisibility('public');
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create list:", error);
            toast.error("Failed to create list");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px] bg-background border-border max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">New Collection</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Create a thematic list to organize your cinematic archive.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        {/* List Name */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                List Name
                            </label>
                            <Input
                                id="name"
                                placeholder="e.g. Neo-Noir Favorites, Summer of 79"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-muted/30 border-border focus:ring-primary"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Description (Optional)
                            </label>
                            <Textarea
                                id="description"
                                placeholder="What defines this collection?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-muted/30 border-border focus:ring-primary min-h-[80px] resize-none"
                            />
                        </div>

                        {/* Genre Tags */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Genre Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {GENRE_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                                            selectedTags.includes(tag)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            {selectedTags.length > 0 && (
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs text-muted-foreground">Selected:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                                            >
                                                {tag}
                                                <X
                                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => toggleTag(tag)}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List Options */}
                        <div className="space-y-4 pt-2">
                            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                List Options
                            </label>

                            {/* Ranked List Toggle */}
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                                <div className="flex items-center gap-3">
                                    <ListOrdered className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <Label htmlFor="ranked" className="font-medium cursor-pointer">Ranked List</Label>
                                        <p className="text-xs text-muted-foreground">Enable numbered positions (#1, #2, #3...)</p>
                                    </div>
                                </div>
                                <Switch
                                    id="ranked"
                                    checked={isRanked}
                                    onCheckedChange={setIsRanked}
                                />
                            </div>

                            {/* Visibility */}
                            <div className="flex gap-2">
                                {(['public', 'followers', 'private'] as const).map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setVisibility(v)}
                                        className={cn(
                                            "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all",
                                            visibility === v
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-full px-8 gap-2"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create List
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
