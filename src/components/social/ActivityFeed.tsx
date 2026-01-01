import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getRecentActivities } from '@/lib/db';
import { Film, Heart, List, Users, MessageSquare, BarChart3, Loader2, Star, Timer, Quote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  type: string;
  createdAt: string;
  movieId?: number;
  movieTitle?: string;
  moviePoster?: string;
  mediaType?: 'movie' | 'tv';
  rating?: number;
  reviewText?: string;
  listId?: string;
  listName?: string;
  pollId?: string;
  pollQuestion?: string;
  debateId?: string;
  debateTitle?: string;
  connectedUserId?: string;
  connectedUserName?: string;
  tvProgress?: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const data = await getRecentActivities(50);
      setActivities(data as Activity[]);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'log': return <Film className="h-3 w-3" />;
      case 'review': return <Quote className="h-3 w-3" />;
      case 'list_created': return <List className="h-3 w-3" />;
      case 'favorite': return <Heart className="h-3 w-3 fill-current" />;
      case 'connection': return <Users className="h-3 w-3" />;
      case 'poll_created': return <BarChart3 className="h-3 w-3" />;
      case 'debate_created': return <MessageSquare className="h-3 w-3" />;
      default: return <Film className="h-3 w-3" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'log':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">watched</span>
            <Link to={`/${activity.mediaType}/${activity.movieId}`} className="font-serif text-lg font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1 leading-none">
              {activity.movieTitle}
            </Link>
            {activity.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-mono text-[9px] font-bold text-foreground">{activity.rating}/10</span>
                {activity.mediaType === 'tv' && activity.tvProgress && (
                  <>
                    <span className="text-white/10 mx-1">•</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{activity.tvProgress}</span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      case 'review':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">reviewed</span>
            <Link to={`/${activity.mediaType}/${activity.movieId}`} className="font-serif text-lg font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1 leading-none">
              {activity.movieTitle}
            </Link>
            {activity.reviewText && (
              <p className="font-serif text-sm text-muted-foreground/80 italic mt-1 line-clamp-2">"{activity.reviewText}"</p>
            )}
          </div>
        );
      case 'list_created':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">created list</span>
            <Link to={`/lists`} className="font-serif text-lg font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1 leading-none">
              {activity.listName}
            </Link>
          </div>
        );
      case 'favorite':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">favorited</span>
            <Link to={`/${activity.mediaType}/${activity.movieId}`} className="font-serif text-lg font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1 leading-none">
              {activity.movieTitle}
            </Link>
          </div>
        );
      case 'connection':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">connected with</span>
            <Link to={`/profile/${activity.connectedUserName}`} className="font-serif text-lg font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1 leading-none">
              {activity.connectedUserName}
            </Link>
          </div>
        );
      case 'poll_created':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">poll</span>
            <span className="font-serif text-lg font-bold uppercase tracking-tight leading-none line-clamp-1">{activity.pollQuestion}</span>
          </div>
        );
      case 'debate_created':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">debate</span>
            <span className="font-serif text-lg font-bold uppercase tracking-tight leading-none line-clamp-1">{activity.debateTitle}</span>
          </div>
        );
      default:
        return <span className="font-mono text-xs text-muted-foreground">Active in community</span>;
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
        {[
          { id: 'all', label: 'All' },
          { id: 'log', label: 'Watched', icon: Film },
          { id: 'review', label: 'Reviews', icon: MessageSquare },
          { id: 'list_created', label: 'Lists', icon: List },
          { id: 'favorite', label: 'Likes', icon: Heart }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              "px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all border",
              filter === item.id
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-0">
        {filteredActivities.length === 0 ? (
          <div className="py-24 text-center border border-white/10 bg-white/[0.02]">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">No activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="group flex gap-6 p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors relative">
              {/* Timeline Connector */}
              <div className="absolute left-9 top-0 bottom-0 w-px bg-white/5 group-last:bottom-auto group-last:h-1/2 -z-10" />

              {/* User Avatar */}
              <Link to={`/profile/${activity.userName}`} className="shrink-0 z-10">
                <Avatar className="h-8 w-8 rounded-none ring-4 ring-black">
                  <AvatarImage src={activity.userPhoto} />
                  <AvatarFallback className="rounded-none font-mono text-[10px] bg-muted text-foreground">{activity.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to={`/profile/${activity.userName}`} className="font-serif text-sm font-bold hover:text-primary transition-colors">
                      {activity.userName}
                    </Link>
                    <span className="text-white/10 text-[9px]">•</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {getActivityText(activity)}
                </div>

                {/* Poster on the right for relevant types */}
                {activity.moviePoster && (
                  <Link
                    to={`/${activity.mediaType}/${activity.movieId}`}
                    className="shrink-0 group/poster"
                  >
                    <div className="w-16 h-24 bg-muted/20 border border-white/10 overflow-hidden relative">
                      <img
                        src={activity.moviePoster}
                        alt={activity.movieTitle}
                        className="w-full h-full object-cover grayscale opacity-60 group-hover/poster:grayscale-0 group-hover/poster:opacity-100 transition-all duration-500"
                      />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
