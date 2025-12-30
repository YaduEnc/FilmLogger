import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movies/MovieCard";
import { Plus, Clock, Loader2, Bookmark, FolderHeart } from "lucide-react";
import { MovieList, Movie } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getWatchlist, getUserLists, getSavedLists } from "@/lib/db";
import { CreateListModal } from "@/components/movies/CreateListModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Lists() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [customLists, setCustomLists] = useState<MovieList[]>([]);
  const [savedLists, setSavedLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadData() {
    if (!user) return;
    try {
      const [watchlistData, listsData, savedData] = await Promise.all([
        getWatchlist(user.uid),
        getUserLists(user.uid),
        getSavedLists(user.uid)
      ]);
      setWatchlist(watchlistData);
      setCustomLists(listsData);
      setSavedLists(savedData);
    } catch (error) {
      console.error("Failed to load lists:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
          <div className="flex items-center gap-3">
            <Link to="/lists/community">
              <Button variant="outline" className="gap-2 rounded-full px-5">
                Explore Community Lists
              </Button>
            </Link>
            <Button
              className="gap-2 rounded-full px-6"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New list
            </Button>
          </div>
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
                <MovieCard key={movie.id} movie={movie} size="md" />
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
            <FolderHeart className="h-4 w-4 text-muted-foreground" />
            <H3 className="text-xl">Your collections</H3>
            <span className="text-sm font-medium text-muted-foreground ml-1">
              {customLists.length} {customLists.length === 1 ? "list" : "lists"}
            </span>
          </div>

          {customLists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${user?.uid}/${list.id}`}
                  className="group block p-3 border border-border rounded-lg hover:bg-muted/50 transition-all hover:border-primary/30"
                >
                  <div className="flex gap-1 mb-3 h-20 bg-muted/20 rounded-md p-1.5 overflow-hidden">
                    {list.movies && list.movies.length > 0 ? (
                      list.movies.slice(0, 3).map((movie) => (
                        <div
                          key={movie.id}
                          className="w-12 aspect-[2/3] bg-muted rounded overflow-hidden shrink-0"
                        >
                          {movie.posterUrl && (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="w-full flex items-center justify-center text-muted-foreground/30 italic text-[10px]">
                        Empty
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {list.name}
                  </h4>
                  {list.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 opacity-70">
                      {list.description}
                    </p>
                  )}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-2">
                    {list.movies ? list.movies.length : 0} films
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-muted/20 border-2 border-dashed border-border/40 rounded-xl">
              <Plus className="h-8 w-8 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">Curate your own thematic lists to organize the archive.</p>
              <Button
                variant="ghost"
                className="mt-4 text-sm font-medium hover:bg-transparent hover:underline underline-offset-4"
                onClick={() => setIsModalOpen(true)}
              >
                Create your first list
              </Button>
            </div>
          )}
        </section>

        {/* Saved lists */}
        {savedLists.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border/50">
              <Bookmark className="h-4 w-4 text-muted-foreground" />
              <H3 className="text-xl">Saved collections</H3>
              <span className="text-sm font-medium text-muted-foreground ml-1">
                {savedLists.length} {savedLists.length === 1 ? "list" : "lists"}
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/list/${list.userId}/${list.id}`}
                  className="group block p-5 border border-border rounded-xl hover:bg-muted/50 transition-all hover:shadow-lg hover:shadow-black/5"
                >
                  <div className="flex gap-2 mb-4 min-h-[110px] bg-muted/20 rounded-lg p-2 overflow-hidden">
                    {list.movies && list.movies.length > 0 ? (
                      list.movies.slice(0, 4).map((movie: Movie) => (
                        <div
                          key={movie.id}
                          className="w-16 aspect-[2/3] bg-muted rounded-md overflow-hidden border border-border/30 shadow-sm shrink-0"
                        >
                          {movie.posterUrl && (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center text-muted-foreground/30 italic text-xs">
                        Empty collection
                      </div>
                    )}
                  </div>
                  <h4 className="font-serif text-lg group-hover:text-primary transition-colors">
                    {list.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={list.userPhoto} />
                      <AvatarFallback className="text-[8px]">{list.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">by {list.userName}</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-4">
                    {list.movies ? list.movies.length : 0} films
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </Layout>
  );
}
