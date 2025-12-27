import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H2 } from "@/components/ui/typography";
import { MovieCard } from "@/components/movies/MovieCard";
import { getPersonDetails, getPersonCredits } from "@/lib/tmdb";
import { Movie } from "@/types/movie";
import { Loader2, Calendar, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonDetails {
    id: number;
    name: string;
    biography: string;
    birthday: string;
    place_of_birth: string;
    profile_path?: string;
    known_for_department: string;
}

export default function PersonDetail() {
    const { id } = useParams();
    const [person, setPerson] = useState<PersonDetails | null>(null);
    const [credits, setCredits] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBioExpanded, setIsBioExpanded] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!id) return;
            try {
                const [details, movieCredits] = await Promise.all([
                    getPersonDetails(parseInt(id)),
                    getPersonCredits(parseInt(id))
                ]);
                setPerson(details);
                setCredits(movieCredits);
            } catch (error) {
                console.error("Failed to load person data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
        // Scroll to top on id change
        window.scrollTo(0, 0);
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

    if (!person) {
        return (
            <Layout>
                <div className="container mx-auto px-6 py-24 text-center">
                    <p className="text-muted-foreground">Person not found.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-background text-foreground">
                {/* Hero / Header */}
                <div className="relative pt-32 pb-12 bg-gradient-to-b from-muted/10 to-transparent">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            {/* Profile Image */}
                            <div className="w-48 h-72 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-muted/20 mx-auto md:mx-0">
                                {person.profile_path ? (
                                    <img
                                        src={person.profile_path}
                                        alt={person.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <span className="text-4xl font-serif text-muted-foreground opacity-50">
                                            {person.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-6 text-center md:text-left">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-2">
                                        {person.name}
                                    </h1>
                                    <p className="text-muted-foreground uppercase tracking-widest text-sm font-medium">
                                        {person.known_for_department}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-foreground/80">
                                    {person.birthday && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{new Date(person.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {person.place_of_birth && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{person.place_of_birth}</span>
                                        </div>
                                    )}
                                </div>

                                {person.biography && (
                                    <div className="max-w-prose">
                                        <div className={`relative ${!isBioExpanded ? 'max-h-32 overflow-hidden' : ''} transition-all duration-300`}>
                                            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                                                {person.biography}
                                            </p>
                                            {!isBioExpanded && person.biography.length > 300 && (
                                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
                                            )}
                                        </div>
                                        {person.biography.length > 300 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsBioExpanded(!isBioExpanded)}
                                                className="mt-2 text-muted-foreground hover:text-primary gap-1 pl-0 h-auto"
                                            >
                                                {isBioExpanded ? (
                                                    <>Read less <ChevronUp className="h-3 w-3" /></>
                                                ) : (
                                                    <>Read more <ChevronDown className="h-3 w-3" /></>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filmography */}
                <div className="container mx-auto px-6 py-12">
                    <div className="mb-10 flex items-center justify-between border-b border-border/50 pb-4">
                        <H2 className="text-2xl font-medium tracking-tight">Known For</H2>
                        <span className="text-muted-foreground font-serif italic text-sm">
                            {credits.length} {credits.length === 1 ? 'title' : 'titles'}
                        </span>
                    </div>

                    {credits.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
                            {credits.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground italic">
                            No filmography found.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
