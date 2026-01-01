import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movies/MovieCard";
import { Loader2, ChevronLeft, Film } from "lucide-react";
import { Collection } from "@/types/movie";
import { getCollectionDetails } from "@/lib/tmdb";
import { AnimatedNoise } from "@/components/landing/AnimatedNoise";
import { cn } from "@/lib/utils";

export default function CollectionDetail() {
    const { id } = useParams();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadCollection() {
            if (!id) return;

            setIsLoading(true);
            setError(null);

            try {
                const data = await getCollectionDetails(parseInt(id));
                setCollection(data);
            } catch (err) {
                console.error("Failed to load collection:", err);
                setError("Failed to load collection details");
            } finally {
                setIsLoading(false);
            }
        }

        loadCollection();
    }, [id]);

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-6 py-24 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </Layout>
        );
    }

    if (error || !collection) {
        return (
            <Layout>
                <div className="container mx-auto px-6 py-16 text-center">
                    <p className="text-muted-foreground text-lg mb-4">{error || "Collection not found"}</p>
                    <Link to="/search">
                        <Button variant="outline">Back to search</Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Hero Backdrop */}
            {collection.backdropUrl && (
                <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[400px] overflow-hidden">
                    <img
                        src={collection.backdropUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-50 grayscale-[0.3]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <AnimatedNoise opacity={0.02} />
                </div>
            )}

            <div className={cn(
                "container mx-auto px-6 relative z-10",
                collection.backdropUrl ? "-mt-32 sm:-mt-48" : "pt-12"
            )}>
                {/* Back Button */}
                <Link to="/search" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="font-mono text-xs uppercase tracking-widest">Back to Search</span>
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-8 mb-16">
                    {/* Collection Poster */}
                    {collection.posterUrl && (
                        <div className="w-48 md:w-64 shrink-0">
                            <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden border border-border/50 shadow-2xl">
                                <img
                                    src={collection.posterUrl}
                                    alt={collection.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Collection Info */}
                    <div className="flex-1 pt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <Film className="h-5 w-5 text-primary" />
                            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                                Collection
                            </span>
                        </div>

                        <H1 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight mb-6">
                            {collection.name}
                        </H1>

                        {collection.overview && (
                            <p className="text-lg text-muted-foreground/90 max-w-2xl leading-relaxed font-serif italic">
                                {collection.overview}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border/50">
                            <div>
                                <span className="font-serif text-3xl text-foreground">{collection.parts.length}</span>
                                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground ml-2">
                                    Films
                                </span>
                            </div>
                            {collection.parts.length > 0 && (
                                <div>
                                    <span className="font-serif text-3xl text-foreground">
                                        {collection.parts[0].year}
                                    </span>
                                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mx-2">
                                        –
                                    </span>
                                    <span className="font-serif text-3xl text-foreground">
                                        {collection.parts[collection.parts.length - 1].year || "TBA"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Movies Grid */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                        <h2 className="font-serif text-2xl text-foreground">Films in Collection</h2>
                        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                            Ordered by Release
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {collection.parts.map((movie, index) => (
                            <div key={movie.id} className="relative group">
                                {/* Rank Number */}
                                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-lg">
                                    <span className="font-mono text-xs font-bold">{index + 1}</span>
                                </div>
                                <MovieCard movie={movie} size="md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
