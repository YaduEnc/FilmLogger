import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Loader2, UserPlus, Check, X, BellOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getIncomingRequests, acceptConnectionRequest, rejectConnectionRequest } from "@/lib/db";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRequests() {
            if (!user) return;
            try {
                const incoming = await getIncomingRequests(user.uid);
                setRequests(incoming);
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRequests();
    }, [user]);

    const handleAccept = async (requestId: string, fromUid: string) => {
        if (!user) return;
        setProcessingId(requestId);
        try {
            await acceptConnectionRequest(requestId, fromUid, user.uid);
            setRequests(requests.filter(r => r.id !== requestId));
            toast.success("Connection accepted");
        } catch (error) {
            toast.error("Failed to accept request");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            await rejectConnectionRequest(requestId);
            setRequests(requests.filter(r => r.id !== requestId));
            toast.success("Request ignored");
        } catch (error) {
            toast.error("Failed to ignore request");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-6 py-24 max-w-2xl">
                <header className="mb-12">
                    <H1 className="mb-2">Notifications</H1>
                    <p className="text-muted-foreground">Manage your cinematic connections and requests.</p>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="group p-4 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <Link
                                        to={`/profile/${request.fromUser?.username || ""}`}
                                        className="flex items-center gap-4 flex-1"
                                    >
                                        <Avatar className="h-12 w-12 border-2 border-background">
                                            <AvatarImage src={request.fromUser?.photoURL || ""} />
                                            <AvatarFallback>{request.fromUser?.displayName?.[0] || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <H3 className="text-base truncate leading-none mb-1">
                                                {request.fromUser?.displayName || "Anonymous Archivist"}
                                            </H3>
                                            <p className="text-xs text-muted-foreground">
                                                @{request.fromUser?.username || "unknown"} • {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </Link>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            disabled={processingId === request.id}
                                            onClick={() => handleReject(request.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
                                            disabled={processingId === request.id}
                                            onClick={() => handleAccept(request.id, request.from)}
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                "Accept"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 border-2 border-dashed border-border/40 rounded-3xl bg-card/10">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/30 mb-6">
                            <BellOff className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <H3 className="mb-2 font-medium">All caught up</H3>
                        <p className="text-muted-foreground text-sm max-w-[240px] mx-auto mb-8">
                            No new connection requests at the moment.
                        </p>
                        <Link to="/community">
                            <Button variant="outline" className="rounded-full group">
                                Find Archivists
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
}
