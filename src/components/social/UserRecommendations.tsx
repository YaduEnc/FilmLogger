import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecommendedUsers, sendConnectionRequest, getConnectionStatus } from '@/lib/db';
import { UserPlus, Check, Loader2, Film, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendedUser {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  commonMovies: number;
  activityScore: number;
  isNewUser: boolean;
  totalWatched: number;
  reviewCount: number;
  recommendationScore: number;
}

interface UserRecommendationsProps {
  currentUserId: string;
}

export function UserRecommendations({ currentUserId }: UserRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecommendations();
  }, [currentUserId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await getRecommendedUsers(currentUserId, 8);
      setRecommendations(data as RecommendedUser[]);
      
      // Check connection status for each user
      const connected = new Set<string>();
      for (const user of data) {
        const status = await getConnectionStatus(currentUserId, user.uid);
        if (status.status === 'accepted' || status.status === 'pending') {
          connected.add(user.uid);
        }
      }
      setConnectedUsers(connected);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (userId: string, userName: string) => {
    setConnectingUsers(prev => new Set(prev).add(userId));
    try {
      await sendConnectionRequest(currentUserId, userId);
      setConnectedUsers(prev => new Set(prev).add(userId));
      toast.success(`Connection request sent to ${userName}`);
    } catch (error) {
      toast.error('Failed to send connection request');
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No recommendations yet</p>
        <p className="text-sm mt-1">Watch more movies to get personalized recommendations!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Recommended for You</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((user) => (
          <Card key={user.uid} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              {/* User Avatar */}
              <Link to={`/profile/${user.username}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${user.username}`} className="font-medium hover:underline block truncate">
                      {user.displayName}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                  </div>

                  {/* Connect Button */}
                  {connectedUsers.has(user.uid) ? (
                    <Button size="sm" variant="outline" disabled className="shrink-0">
                      <Check className="h-4 w-4 mr-1" />
                      Connected
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(user.uid, user.displayName)}
                      disabled={connectingUsers.has(user.uid)}
                      className="shrink-0"
                    >
                      {connectingUsers.has(user.uid) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
                )}

                {/* Stats & Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.isNewUser && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New User
                    </Badge>
                  )}
                  {user.commonMovies > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Film className="h-3 w-3 mr-1" />
                      {user.commonMovies} in common
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {user.totalWatched} watched
                  </Badge>
                  {user.reviewCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {user.reviewCount} reviews
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
