import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movies/MovieCard";
import { Plus, Clock, Loader2, Bookmark } from "lucide-react";
import { MovieList, Movie } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getWatchlist } from "@/lib/db";

export default function Lists() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom lists will be implemented as a full feature later, 
  // currently we focus on the core Watchlist requirement.
  const customLists: MovieList[] = [];

  useEffect(() => {
    async function loadWatchlist() {
      if (!user) return;
      try {
        const data = await getWatchlist(user.uid);
        setWatchlist(data);
      } catch (error) {
        console.error("Failed to load watchlist:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadWatchlist();
  }, [user]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-10">
          <H1 className="tracking-tight">Lists</H1>
          <Button className="gap-2 rounded-full px-6">
            <Plus className="h-4 w-4" />
            New list
          </Button>
        </div>

        {/* Watchlist */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <H3 className="text-xl">Watchlist</H3>
            <span className="text-sm font-medium text-muted-foreground ml-1">
              {watchlist.length} {watchlist.length === 1 ? "film" : "films"}
            </span>
          </div>

          {watchlist.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-5">
              {watchlist.map((movie) => (
                <MovieCard key={movie.id} movie={movie} size="sm" />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-border rounded-xl">
              <Bookmark className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-4">Your watchlist represents the films you intend to experience.</p>
              <Link to="/search">
                <Button variant="outline" size="sm">Explore films</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Custom lists */}
        <section>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border/50">
            <H3 className="text-xl">Your collections</H3>
          </div>

          {customLists.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="group block p-5 border border-border rounded-xl hover:bg-muted/50 transition-all hover:shadow-lg hover:shadow-black/5"
                >
                  <div className="flex gap-1.5 mb-4">
                    {list.movies.slice(0, 4).map((movie) => (
                      <div
                        key={movie.id}
                        className="w-full aspect-[2/3] bg-muted rounded-md overflow-hidden border border-border/30 shadow-sm"
                      >
                        {movie.posterUrl && (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <h4 className="font-serif text-lg group-hover:text-primary transition-colors">
                    {list.name}
                  </h4>
                  {list.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 opacity-80">
                      {list.description}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-4">
                    {list.movies.length} films
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-muted/20 border-2 border-dashed border-border/40 rounded-xl">
              <Plus className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">Curate your own thematic lists to organize the archive.</p>
              <Button variant="ghost" className="mt-4 text-sm font-medium hover:bg-transparent hover:underline underline-offset-4">
                Create your first list
              </Button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
