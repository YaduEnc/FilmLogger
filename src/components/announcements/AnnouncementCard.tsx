import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Announcement } from '@/types/movie';
import { 
  Play, ExternalLink, Calendar, Pin, Newspaper, 
  Film, Sparkles, Bell, PartyPopper 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AnnouncementCardProps {
  announcement: Announcement;
  variant?: 'full' | 'compact' | 'preview';
}

const categoryConfig = {
  news: { icon: Newspaper, label: 'News', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  trailer: { icon: Film, label: 'Trailer', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  release: { icon: PartyPopper, label: 'Release', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  update: { icon: Bell, label: 'Update', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  event: { icon: Sparkles, label: 'Event', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' }
};

export function AnnouncementCard({ announcement, variant = 'full' }: AnnouncementCardProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  
  const CategoryIcon = categoryConfig[announcement.category]?.icon || Newspaper;
  const categoryLabel = categoryConfig[announcement.category]?.label || 'News';
  const categoryColor = categoryConfig[announcement.category]?.color || 'bg-muted';
  
  // YouTube thumbnail URL
  const youtubeThumbnail = announcement.youtubeVideoId 
    ? `https://img.youtube.com/vi/${announcement.youtubeVideoId}/maxresdefault.jpg`
    : null;
  
  // Fallback thumbnail if maxresdefault doesn't exist
  const youtubeThumbnailFallback = announcement.youtubeVideoId 
    ? `https://img.youtube.com/vi/${announcement.youtubeVideoId}/hqdefault.jpg`
    : null;

  // Preview variant - compact card for home page horizontal scroll
  if (variant === 'preview') {
    return (
      <Link to="/announcements" className="block h-full">
        <Card className="h-full overflow-hidden hover:border-primary/50 transition-all group cursor-pointer border-border/50 hover:shadow-md">
          {/* Thumbnail */}
          {youtubeThumbnail ? (
            <div className="w-full aspect-video relative bg-muted">
              <img 
                src={youtubeThumbnail} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  if (youtubeThumbnailFallback) {
                    (e.target as HTMLImageElement).src = youtubeThumbnailFallback;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Play className="h-5 w-5 text-white fill-white translate-x-0.5" />
                </div>
              </div>
              {/* Category badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 backdrop-blur-sm bg-black/40 border-0">
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {categoryLabel}
                </Badge>
              </div>
              {announcement.isPinned && (
                <div className="absolute top-2 right-2">
                  <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
                </div>
              )}
            </div>
          ) : announcement.imageUrl ? (
            <div className="w-full aspect-video relative bg-muted">
              <img 
                src={announcement.imageUrl} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 backdrop-blur-sm bg-black/40 border-0">
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {categoryLabel}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <CategoryIcon className="h-8 w-8 text-primary opacity-50" />
            </div>
          )}
          
          {/* Content */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              {announcement.isPinned && !youtubeThumbnail && !announcement.imageUrl && (
                <Pin className="h-3 w-3 text-primary shrink-0" />
              )}
              <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {announcement.title}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Card>
      </Link>
    );
  }

  // Compact variant - for list view
  if (variant === 'compact') {
    return (
      <>
        <Card className="p-4 hover:bg-muted/30 transition-all border-border/50">
          <div className="flex gap-4">
            {/* Thumbnail */}
            {youtubeThumbnail ? (
              <button 
                onClick={() => setIsVideoOpen(true)}
                className="w-32 h-20 rounded-lg overflow-hidden bg-muted shrink-0 relative group"
              >
                <img 
                  src={youtubeThumbnail} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    if (youtubeThumbnailFallback) {
                      (e.target as HTMLImageElement).src = youtubeThumbnailFallback;
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white translate-x-0.5" />
                  </div>
                </div>
              </button>
            ) : announcement.imageUrl ? (
              <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                <img 
                  src={announcement.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-[10px] ${categoryColor}`}>
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {categoryLabel}
                </Badge>
                {announcement.isPinned && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
              </div>
              
              <h3 className="font-medium mb-1 line-clamp-1">{announcement.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
              
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                </span>
                {announcement.articleUrl && (
                  <a 
                    href={announcement.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Read more
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Video Modal */}
        <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${announcement.youtubeVideoId}?autoplay=1`}
                title={announcement.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full variant - detailed card
  return (
    <>
      <Card className="overflow-hidden border-border/50 hover:border-border transition-all">
        {/* Thumbnail */}
        {youtubeThumbnail ? (
          <button 
            onClick={() => setIsVideoOpen(true)}
            className="w-full aspect-video bg-muted relative group"
          >
            <img 
              src={youtubeThumbnail} 
              alt="" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                if (youtubeThumbnailFallback) {
                  (e.target as HTMLImageElement).src = youtubeThumbnailFallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-90 group-hover:scale-100 transition-transform">
                <Play className="h-8 w-8 text-white fill-white translate-x-0.5" />
              </div>
            </div>
            {/* Category badge on thumbnail */}
            <div className="absolute top-4 left-4">
              <Badge className={`${categoryColor} backdrop-blur-sm`}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryLabel}
              </Badge>
            </div>
            {announcement.isPinned && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="backdrop-blur-sm gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              </div>
            )}
          </button>
        ) : announcement.imageUrl ? (
          <div className="w-full aspect-video bg-muted relative">
            <img 
              src={announcement.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-4 left-4">
              <Badge className={`${categoryColor} backdrop-blur-sm`}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryLabel}
              </Badge>
            </div>
          </div>
        ) : null}
        
        {/* Content */}
        <div className="p-6">
          {/* Category badge if no image */}
          {!youtubeThumbnail && !announcement.imageUrl && (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={categoryColor}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryLabel}
              </Badge>
              {announcement.isPinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
            </div>
          )}
          
          <h2 className="text-xl font-serif font-medium mb-3">{announcement.title}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">{announcement.content}</p>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-2">
              {announcement.youtubeUrl && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsVideoOpen(true)}
                  className="gap-2 rounded-full"
                >
                  <Play className="h-3.5 w-3.5" />
                  Watch
                </Button>
              )}
              {announcement.articleUrl && (
                <a 
                  href={announcement.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="gap-2 rounded-full">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Read Article
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Video Modal */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${announcement.youtubeVideoId}?autoplay=1`}
              title={announcement.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
