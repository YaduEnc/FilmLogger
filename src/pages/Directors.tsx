import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { H2, H3 } from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { getAllDirectors, getDirectorFilmography } from '@/lib/db';
import { Film, Search, Clapperboard, Loader2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Directors() {
  const { user } = useAuth();
  const [directors, setDirectors] = useState<any[]>([]);
  const [selectedDirector, setSelectedDirector] = useState<any>(null);
  const [directorFilms, setDirectorFilms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDirectors();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDirector && user) {
      loadDirectorFilms(selectedDirector.name);
    }
  }, [selectedDirector, user]);

  const loadDirectors = async () => {
    try {
      const data = await getAllDirectors(user!.uid);
      setDirectors(data);
    } catch (error) {
      console.error('Error loading directors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDirectorFilms = async (directorName: string) => {
    try {
      const data = await getDirectorFilmography(user!.uid, directorName);
      setDirectorFilms(data);
    } catch (error) {
      console.error('Error loading director films:', error);
    }
  };

  const filteredDirectors = directors.filter(director =>
    director.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-muted-foreground">Please sign in to view your directors</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (directors.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-12 text-center">
          <Clapperboard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <H2 className="mb-2">No Directors Yet</H2>
          <p className="text-muted-foreground mb-6">
            Start logging movies to track your favorite directors!
          </p>
          <Link
            to="/log"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Log Your First Movie
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <H2 className="mb-6">Directors</H2>

        <div className="grid md:grid-cols-[350px_1fr] gap-6">
          {/* Directors List */}
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search directors..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {filteredDirectors.map((director) => (
                <button
                  key={director.name}
                  onClick={() => setSelectedDirector(director)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedDirector?.name === director.name
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{director.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {director.count} {director.count === 1 ? 'film' : 'films'}
                      </p>
                    </div>
                    <Clapperboard className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Director Details */}
          <div>
            {selectedDirector ? (
              <div>
                <Card className="p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <H3 className="text-2xl mb-2">{selectedDirector.name}</H3>
                      <p className="text-muted-foreground">
                        {selectedDirector.count} {selectedDirector.count === 1 ? 'film' : 'films'} watched
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-serif font-bold text-primary">
                        {selectedDirector.count}
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Films</p>
                    </div>
                  </div>
                </Card>

                <H3 className="text-xl mb-4">Filmography</H3>
                <div className="grid gap-4">
                  {directorFilms.map((log: any) => (
                    <Link
                      key={log.id}
                      to={`/${log.movie.mediaType || 'movie'}/${log.movie.id}`}
                      className="group"
                    >
                      <Card className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex gap-4">
                          {log.movie.posterUrl && (
                            <img
                              src={log.movie.posterUrl}
                              alt={log.movie.title}
                              className="w-16 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium group-hover:underline truncate">
                              {log.movie.title}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {log.movie.year}
                            </p>
                            {log.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                <span className="font-medium">{log.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {log.review && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {log.review}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Watched on {new Date(log.watchedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <Clapperboard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Select a director to view their filmography</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

