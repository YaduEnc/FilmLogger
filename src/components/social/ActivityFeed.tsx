import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecentActivities } from '@/lib/db';
import { Film, Heart, List, Users, MessageSquare, BarChart3, Loader2, Star } from 'lucide-react';
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
      case 'log': return <Film className="h-4 w-4" />;
      case 'review': return <MessageSquare className="h-4 w-4" />;
      case 'list_created': return <List className="h-4 w-4" />;
      case 'favorite': return <Heart className="h-4 w-4 fill-current" />;
      case 'connection': return <Users className="h-4 w-4" />;
      case 'poll_created': return <BarChart3 className="h-4 w-4" />;
      case 'debate_created': return <MessageSquare className="h-4 w-4" />;
      default: return <Film className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'log':
        return (
          <>
            watched{' '}
            <Link to={`/${activity.mediaType}/${activity.movieId}`} className="font-medium hover:underline">
              {activity.movieTitle}
            </Link>
            {activity.mediaType === 'tv' && activity.tvProgress && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded ml-2">
                {activity.tvProgress}
              </span>
            )}
            {activity.rating && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-sm">{activity.rating}/10</span>
              </span>
            )}
          </>
        );
      case 'review':
        return (
          <>
            reviewed{' '}
            <Link to={`/${activity.mediaType}/${activity.movieId}`} className="font-medium hover:underline">
              {activity.movieTitle}
            </Link>
            {activity.mediaType === 'tv' && activity.tvProgress && (
              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded ml-2">
                {activity.tvProgress}
              </span>
            )}
            {activity.reviewText && (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">"{activity.reviewText}"</div>
            )}
          </>
        );
      case 'list_created':
        return (
          <>
            created a list{' '}
            <Link to={`/lists`} className="font-medium hover:underline">
              {activity.listName}
            </Link>
          </>
        );
      case 'favorite':
        return (
          <>
            added{' '}
            <Link to={`/${activity.mediaType}/${activity.movieId}`} className="font-medium hover:underline">
              {activity.movieTitle}
            </Link>{' '}
            to favorites
          </>
        );
      case 'connection':
        return (
          <>
            connected with{' '}
            <Link to={`/profile/${activity.connectedUserName}`} className="font-medium hover:underline">
              {activity.connectedUserName}
            </Link>
          </>
        );
      case 'poll_created':
        return (
          <>
            created a poll: <span className="font-medium">{activity.pollQuestion}</span>
          </>
        );
      case 'debate_created':
        return (
          <>
            started a debate: <span className="font-medium">{activity.debateTitle}</span>
          </>
        );
      default:
        return 'did something';
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('all')}
        >
          All Activity
        </Badge>
        <Badge
          variant={filter === 'log' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('log')}
        >
          <Film className="h-3 w-3 mr-1" />
          Watched
        </Badge>
        <Badge
          variant={filter === 'review' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('review')}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Reviews
        </Badge>
        <Badge
          variant={filter === 'list_created' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('list_created')}
        >
          <List className="h-3 w-3 mr-1" />
          Lists
        </Badge>
        <Badge
          variant={filter === 'favorite' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('favorite')}
        >
          <Heart className="h-3 w-3 mr-1" />
          Favorites
        </Badge>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {filteredActivities.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground bg-muted/5 border-dashed">
            <p>No activities yet</p>
            <p className="text-sm mt-1">Start watching movies and connecting with people!</p>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="p-3 hover:bg-muted/30 transition-colors border-border/40 group relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* User Avatar - Slightly smaller */}
                <Link to={`/profile/${activity.userName}`} className="shrink-0 pt-0.5 sm:pt-0">
                  <Avatar className="h-8 w-8 border border-border/50">
                    <AvatarImage src={activity.userPhoto} />
                    <AvatarFallback className="text-[10px]">{activity.userName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>

                {/* Activity Content - Flex-1 to push poster to right */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm leading-snug">
                        <Link to={`/profile/${activity.userName}`} className="font-semibold hover:underline">
                          {activity.userName}
                        </Link>{' '}
                        <span className="text-foreground/90">{getActivityText(activity)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <div className="text-muted-foreground opacity-60">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                    </div>

                    {/* Compact Poster on the right */}
                    {activity.moviePoster && (
                      <Link
                        to={`/${activity.mediaType}/${activity.movieId}`}
                        className="shrink-0 transition-transform group-hover:scale-105"
                      >
                        <img
                          src={activity.moviePoster}
                          alt={activity.movieTitle}
                          className="w-10 h-14 object-cover rounded shadow-sm border border-border/50"
                        />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
