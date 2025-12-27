import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getUserLists, addMovieToList } from "@/lib/db";
import { Movie, MovieList } from "@/types/movie";
import { toast } from "sonner";
import { Loader2, Plus, List } from "lucide-react";

interface AddToListModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
    onCreateNew: () => void;
}

export function AddToListModal({ movie, isOpen, onClose, onCreateNew }: AddToListModalProps) {
    const { user } = useAuth();
    const [lists, setLists] = useState<MovieList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingToListId, setAddingToListId] = useState<string | null>(null);

    useEffect(() => {
        async function loadLists() {
            if (!user || !isOpen) return;
            setIsLoading(true);
            try {
                const data = await getUserLists(user.uid);
                setLists(data);
            } catch (error) {
                console.error("Failed to load lists:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadLists();
    }, [user, isOpen]);

    const handleAddToList = async (listId: string, listName: string) => {
        if (!user) return;

        setAddingToListId(listId);
        try {
            await addMovieToList(user.uid, listId, movie);
            toast.success(`${movie.title} added to ${listName}`);
            onClose();
        } catch (error) {
            console.error("Failed to add movie to list:", error);
            toast.error("Failed to add movie to list");
        } finally {
            setAddingToListId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Add to collection</DialogTitle>
                    <DialogDescription>
                        Choose a collection for "{movie.title}"
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-[300px] overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : lists.length > 0 ? (
                        lists.map((list) => (
                            <button
                                key={list.id}
                                onClick={() => handleAddToList(list.id, list.name)}
                                disabled={addingToListId === list.id}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted/50 rounded-md group-hover:bg-background transition-colors">
                                        <List className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{list.name}</p>
                                        <p className="text-xs text-muted-foreground">{list.movies ? list.movies.length : 0} films</p>
                                    </div>
                                </div>
                                {addingToListId === list.id && <Loader2 className="h-4 w-4 animate-spin" />}
                            </button>
                        ))
                    ) : (
                        <div className="py-8 text-center bg-muted/10 rounded-lg border border-dashed border-border/50">
                            <p className="text-sm text-muted-foreground">No collections created yet.</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-border mt-2">
                    <Button
                        variant="outline"
                        className="w-full gap-2 rounded-full font-medium"
                        onClick={() => {
                            onClose();
                            onCreateNew();
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        Create new collection
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
