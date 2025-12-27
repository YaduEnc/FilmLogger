import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Search, UserPlus, Check, Clock, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { searchUsers, getConnectionStatus, sendConnectionRequest, acceptConnectionRequest } from "@/lib/db";
import { toast } from "sonner";

export default function Community() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchUsers(searchTerm);
                // Filter out current user
                setSearchResults(results.filter(r => r.uid !== user?.uid));
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, user]);

    return (
        <Layout>
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="mb-12">
                    <H1 className="tracking-tight mb-2">Community</H1>
                    <p className="text-muted-foreground font-serif italic">Find fellow cinephiles and expand your cinematic circle.</p>
                </div>

                <div className="relative mb-16">
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

                <div className="space-y-12">
                    {searchResults.length > 0 && (
                        <section>
                            <H3 className="text-xl mb-6 flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Discovered Users
                            </H3>
                            <div className="grid gap-4">
                                {searchResults.map((targetUser) => (
                                    <UserResultCard key={targetUser.uid} targetUser={targetUser} currentUser={user} />
                                ))}
                            </div>
                        </section>
                    )}

                    {!searchTerm && (
                        <div className="text-center py-24 border-2 border-dashed border-border/40 rounded-3xl">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-10" />
                            <p className="text-muted-foreground font-medium">Start typing to find archives from across the globe.</p>
                        </div>
                    )}

                    {searchTerm && !isSearching && searchResults.length === 0 && (
                        <div className="text-center py-20 bg-muted/5 rounded-3xl border border-border/30">
                            <p className="text-muted-foreground">No archives found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

function UserResultCard({ targetUser, currentUser }: { targetUser: any, currentUser: any }) {
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
                        <span className="text-[10px] font-bold uppercase tracking-widest">{targetUser.stats?.totalWatched || 0} films</span>
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

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
