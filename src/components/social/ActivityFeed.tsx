import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/movies/StarRating";
import { formatDistanceToNow } from "date-fns";
import { Film, User, Loader2, RotateCcw } from "lucide-react";
import { getConnectionUids, getConnectionActivity } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { H3 } from "@/components/ui/typography";

export function ActivityFeed() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadActivity() {
            if (!user) return;
            try {
                const uids = await getConnectionUids(user.uid);
                if (uids.length > 0) {
                    const feed = await getConnectionActivity(uids);
                    setActivities(feed);
                }
            } catch (error) {
                console.error("Failed to load activity feed:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadActivity();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="py-12 text-center bg-muted/5 border border-dashed border-border/40 rounded-2xl">
                <Film className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground italic font-serif opacity-70">
                    No recent connection activity. <br />
                    Find fellow cinephiles in the <Link to="/community" className="underline hover:text-foreground">Community</Link>.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activities.map((activity) => (
                <div key={activity.id} className="group relative flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm transition-all hover:bg-card/40">
                    {/* User Info & Action */}
                    <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                        <Link to={`/profile/${activity.user?.username || ""}`}>
                            <Avatar className="h-10 w-10 border border-border/50">
                                <AvatarImage src={activity.user?.photoURL || ""} />
                                <AvatarFallback className="bg-muted text-xs font-serif">{activity.user?.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                        </Link>
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Link to={`/profile/${activity.user?.username || ""}`} className="font-serif font-medium text-sm hover:underline underline-offset-4">
                                {activity.user?.displayName || "Anonymous Archivist"}
                            </Link>
                            <span className="text-xs text-muted-foreground lowercase opacity-70">watched</span>
                            <span className="text-[10px] text-muted-foreground opacity-50 ml-auto whitespace-nowrap">
                                {formatDistanceToNow(new Date(activity.watchedDate), { addSuffix: true })}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            {/* Movie Poster */}
                            <Link to={`/movie/${activity.movieId}`} className="shrink-0">
                                <div className="w-14 aspect-[2/3] bg-muted rounded-md overflow-hidden border border-border/30 shadow-sm transition-transform group-hover:scale-105">
                                    {activity.movie?.posterUrl ? (
                                        <img
                                            src={activity.movie.posterUrl}
                                            alt={activity.movie.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] p-1 text-center italic">
                                            {activity.movie?.title}
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Log Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <Link to={`/movie/${activity.movieId}`} className="font-medium text-sm hover:underline decoration-border underline-offset-4 leading-tight mb-1 truncate block">
                                    {activity.movie?.title}
                                </Link>
                                <div className="flex items-center gap-2">
                                    <StarRating rating={activity.rating} readonly size="sm" />
                                    {activity.isRewatch && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/40">
                                            <RotateCcw className="h-2.5 w-2.5" />
                                            <span>Rewatch</span>
                                        </div>
                                    )}
                                </div>
                                {activity.reviewShort && (
                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic leading-relaxed font-serif">
                                        “{activity.reviewShort}”
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
