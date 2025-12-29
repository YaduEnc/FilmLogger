import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { MovieCard } from "@/components/movies/MovieCard";
import { Loader2, ChevronLeft, ChevronRight, ExternalLink, Globe } from "lucide-react";
import { Movie } from "@/types/movie";
import { getNetworkDetails, getNetworkTVShows } from "@/lib/tmdb";

// Horizontal Scroll Component
const HorizontalScroll = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [children]);

  return (
    <div className="mb-6 sm:mb-8">
      <H3 className="text-lg sm:text-xl mb-3">{title}</H3>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 sm:p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 sm:p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-background active:scale-95"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 sm:mx-0 px-4 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default function NetworkDetail() {
  const { id } = useParams();
  const [network, setNetwork] = useState<any>(null);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const [networkData, showsData] = await Promise.all([
          getNetworkDetails(parseInt(id)),
          getNetworkTVShows(parseInt(id), 1)
        ]);

        setNetwork(networkData);
        setTvShows(showsData.movies);
        setTotalPages(showsData.totalPages);
      } catch (err) {
        console.error("Failed to load network data:", err);
        setError("Network not found");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const loadMoreShows = async (page: number) => {
    try {
      const showsData = await getNetworkTVShows(parseInt(id!), page);
      setTvShows(prev => [...prev, ...showsData.movies]);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to load more shows:", error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-6 py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !network) {
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg mb-4">{error || "Network not found"}</p>
          <Link to="/search">
            <Button variant="outline">Back to search</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Network Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            {network.logoPath && (
              <div className="w-32 sm:w-40 h-32 sm:h-40 bg-muted rounded-lg p-4 sm:p-6 flex items-center justify-center border border-border/50">
                <img
                  src={network.logoPath}
                  alt={network.name}
                  loading="lazy"
                  className="w-full h-full object-contain filter brightness-0 invert opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <H1 className="text-3xl sm:text-4xl lg:text-5xl mb-4 tracking-tight">{network.name}</H1>
              
              {network.headquarters && (
                <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground mb-2">
                  <span className="font-medium">Headquarters:</span>
                  <span>{network.headquarters}</span>
                </div>
              )}

              {network.originCountry && (
                <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground mb-4">
                  <span className="font-medium">Country:</span>
                  <span>{network.originCountry}</span>
                </div>
              )}

              {network.homepage && (
                <a
                  href={network.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm sm:text-base text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Visit Official Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <Divider className="my-8 sm:my-12 opacity-50" />

        {/* TV Shows Section */}
        <div>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <H2 className="text-2xl sm:text-3xl">TV Shows</H2>
            <span className="text-sm sm:text-base text-muted-foreground">
              {tvShows.length} {tvShows.length === 1 ? 'show' : 'shows'}
            </span>
          </div>

          {tvShows.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
                {tvShows.map((show) => (
                  <div key={show.id} className="w-full">
                    <MovieCard movie={show} size="md" />
                  </div>
                ))}
              </div>

              {currentPage < totalPages && (
                <div className="text-center">
                  <Button
                    onClick={() => loadMoreShows(currentPage + 1)}
                    variant="outline"
                    className="gap-2"
                  >
                    Load More Shows
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-border/40 rounded-3xl">
              <p className="text-muted-foreground italic font-serif">No TV shows found for this network.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
