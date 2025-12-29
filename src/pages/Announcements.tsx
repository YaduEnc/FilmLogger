import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { H1 } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { getActiveAnnouncements } from '@/lib/db';
import { Announcement } from '@/types/movie';
import { 
  Loader2, Megaphone, Newspaper, Film, PartyPopper, 
  Bell, Sparkles, Filter 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'All', icon: Megaphone },
  { value: 'news', label: 'News', icon: Newspaper },
  { value: 'trailer', label: 'Trailers', icon: Film },
  { value: 'release', label: 'Releases', icon: PartyPopper },
  { value: 'update', label: 'Updates', icon: Bell },
  { value: 'event', label: 'Events', icon: Sparkles },
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await getActiveAnnouncements(50);
      setAnnouncements(data as Announcement[]);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = selectedCategory === 'all'
    ? announcements
    : announcements.filter(a => a.category === selectedCategory);

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <H1 className="text-3xl md:text-4xl tracking-tight">Cinema News</H1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Stay updated with the latest movie news, trailers, releases, and events from the world of cinema.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.value;
              
              return (
                <Button
                  key={category.value}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "gap-2 rounded-full transition-all",
                    isSelected && "shadow-md"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Announcements */}
        {!isLoading && (
          <div className="space-y-8">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    Featured
                  </Badge>
                </div>
                <div className="space-y-6">
                  {pinnedAnnouncements.map((announcement) => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement}
                      variant="full"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div className="space-y-4">
                {pinnedAnnouncements.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 px-3 py-1">
                      <Newspaper className="h-3 w-3" />
                      Latest
                    </Badge>
                  </div>
                )}
                <div className="space-y-4">
                  {regularAnnouncements.map((announcement) => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredAnnouncements.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed border-border/50 rounded-2xl">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {selectedCategory === 'all' 
                    ? "Check back later for the latest cinema news and updates."
                    : `No ${selectedCategory} announcements at the moment.`
                  }
                </p>
                {selectedCategory !== 'all' && (
                  <Button 
                    variant="ghost" 
                    className="mt-4"
                    onClick={() => setSelectedCategory('all')}
                  >
                    View all announcements
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
