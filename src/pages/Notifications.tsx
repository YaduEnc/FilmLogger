import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Loader2, UserPlus, Check, X, BellOff, ArrowRight,
    Heart, MessageSquare, Bookmark, User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
    getIncomingRequests, acceptConnectionRequest, rejectConnectionRequest,
    getNotifications, markNotificationAsRead
} from "@/lib/db";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Notification } from "@/types/movie";

export default function Notifications() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const [incoming, notifs] = await Promise.all([
                    getIncomingRequests(user.uid),
                    getNotifications(user.uid)
                ]);
                setRequests(incoming);
                setNotifications(notifs as Notification[]);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
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

    const handleMarkRead = async (notifId: string) => {
        if (!user) return;
        try {
            await markNotificationAsRead(user.uid, notifId);
            setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const renderNotificationIcon = (type: string) => {
        switch (type) {
            case 'like_list':
            case 'like_review':
                return <Heart className="h-4 w-4 text-destructive fill-destructive" />;
            case 'like_comment':
                return <Heart className="h-4 w-4 text-destructive" />;
            case 'comment_list':
            case 'comment_review':
                return <MessageSquare className="h-4 w-4 text-primary" />;
            case 'save_list':
                return <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
            case 'follow':
                return <User className="h-4 w-4 text-blue-500" />;
            default:
                return <BellOff className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getNotificationText = (n: Notification) => {
        switch (n.type) {
            case 'like_list': return `liked your list "${n.listName || 'Untitled'}"`;
            case 'save_list': return `saved your list "${n.listName || 'Untitled'}"`;
            case 'comment_list': return `commented on your list: "${n.text?.substring(0, 30)}${n.text && n.text.length > 30 ? '...' : ''}"`;
            case 'like_review': return `liked your review of ${n.movieTitle || 'a film'}`;
            case 'like_comment': return `liked your comment on ${n.movieTitle || 'a film'}`;
            case 'comment_review': return `commented on your review of ${n.movieTitle || 'a film'}`;
            case 'follow': return `started following you`;
            default: return `interacted with your profile`;
        }
    };

    const getNotificationLink = (n: Notification) => {
        if (n.listId) return `/list/${user?.uid}/${n.listId}`;
        if (n.reviewId) return `/movie/${n.movieId}`; // Or a review detail page if it exists
        return `/profile/${n.senderName}`;
    };

    const totalCount = requests.length + notifications.length;

    return (
        <Layout>
            <div className="container mx-auto px-6 py-24 max-w-2xl">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <H1 className="mb-2">Notifications</H1>
                        <p className="text-muted-foreground">Keep track of your social cinematic footprint.</p>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary/80"
                            onClick={() => notifications.filter(n => !n.read).forEach(n => handleMarkRead(n.id))}
                        >
                            Mark all as read
                        </Button>
                    )}
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : totalCount > 0 ? (
                    <div className="space-y-4">
                        {/* Status Requests */}
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="group p-4 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative">
                                            <Avatar className="h-10 w-10 border-2 border-background">
                                                <AvatarImage src={request.fromUser?.photoURL || ""} />
                                                <AvatarFallback>{request.fromUser?.displayName?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-background">
                                                <UserPlus className="h-2 w-2 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-tight mb-1">
                                                <span className="font-semibold">{request.fromUser?.displayName}</span> sent you a connection request
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            disabled={processingId === request.id}
                                            onClick={() => handleReject(request.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 h-8 text-xs"
                                            disabled={processingId === request.id}
                                            onClick={() => handleAccept(request.id, request.from)}
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                "Accept"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Social Notifications */}
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleMarkRead(n.id)}
                                className={cn(
                                    "group p-4 rounded-xl border transition-all cursor-pointer relative",
                                    n.read
                                        ? "border-border/20 bg-card/10 opacity-70"
                                        : "border-primary/20 bg-primary/5 shadow-sm"
                                )}
                            >
                                {!n.read && <div className="absolute top-4 right-4 h-2 w-2 bg-primary rounded-full" />}
                                <Link to={getNotificationLink(n)} className="flex items-start gap-4">
                                    <div className="relative pt-1">
                                        <Avatar className="h-10 w-10 border border-border/30">
                                            <AvatarImage src={n.senderPhoto} />
                                            <AvatarFallback className="text-xs bg-muted font-serif">{n.senderName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border/50 shadow-sm">
                                            {renderNotificationIcon(n.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed mb-1 text-foreground/90">
                                            <span className="font-semibold hover:underline">{n.senderName}</span> {getNotificationText(n)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 border-2 border-dashed border-border/40 rounded-3xl bg-card/10">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted/30 mb-6">
                            <BellOff className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <H3 className="mb-2 font-medium">Clear skies</H3>
                        <p className="text-muted-foreground text-sm max-w-[240px] mx-auto mb-8">
                            No notifications to show. Go explore some cinema!
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

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
