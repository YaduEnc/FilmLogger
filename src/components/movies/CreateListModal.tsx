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
import { useAuth } from "@/hooks/useAuth";
import { createCustomList } from "@/lib/db";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateListModal({ isOpen, onClose, onSuccess }: CreateListModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!name.trim()) {
            toast.error("Please provide a list name");
            return;
        }

        setIsLoading(true);
        try {
            await createCustomList(user.uid, name, description);
            toast.success("List created successfully");
            setName("");
            setDescription("");
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
            <DialogContent className="sm:max-w-[425px] bg-background border-border">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">New Collection</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Create a thematic list to organize your cinematic archive.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
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
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Description (Optional)
                            </label>
                            <Textarea
                                id="description"
                                placeholder="What defines this collection?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-muted/30 border-border focus:ring-primary min-h-[100px] resize-none"
                            />
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
