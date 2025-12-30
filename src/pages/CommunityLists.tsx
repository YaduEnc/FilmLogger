import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovieList, Movie } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getTrendingLists, getMostLikedLists, getListsByTag, getRecentPublicLists, toggleListLike } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Flame, Heart, Clock, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GENRE_TAGS = [
    "All", "Action", "Drama", "Horror", "Sci-Fi", "Comedy", "Thriller",
    "Romance", "Animation", "Documentary", "Indie", "Cult Classics", "Foreign"
];

type TabType = 'trending' | 'liked' | 'new';

export default function CommunityLists() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('trending');
    const [selectedTag, setSelectedTag] = useState("All");
    const [lists, setLists] = useState<MovieList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [likingId, setLikingId] = useState<string | null>(null);

    useEffect(() => {
        loadLists();
    }, [activeTab, selectedTag]);

    async function loadLists() {
        setIsLoading(true);
        try {
            let fetchedLists: MovieList[] = [];

            if (selectedTag !== "All") {
                fetchedLists = await getListsByTag(selectedTag, 30);
            } else {
                switch (activeTab) {
                    case 'trending':
                        fetchedLists = await getTrendingLists(30);
                        break;
                    case 'liked':
                        fetchedLists = await getMostLikedLists(30);
                        break;
                    case 'new':
                        fetchedLists = await getRecentPublicLists(30);
                        break;
                }
            }

            setLists(fetchedLists);
        } catch (error) {
            console.error("Failed to load community lists:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleQuickLike = async (e: React.MouseEvent, list: MovieList) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Please sign in to like lists");
            return;
        }
        if (!list.userId || !list.id) return;

        setLikingId(list.id);
        try {
            const liked = await toggleListLike(user.uid, list.userId, list.id, list.name, user.displayName || 'Someone', user.photoURL || undefined);
            setLists(prev => prev.map(l =>
                l.id === list.id
                    ? { ...l, likeCount: liked ? (l.likeCount || 0) + 1 : Math.max(0, (l.likeCount || 0) - 1) }
                    : l
            ));
            toast.success(liked ? "List liked!" : "Like removed");
        } catch (error) {
            toast.error("Failed to like list");
        } finally {
            setLikingId(null);
        }
    };

    const filteredLists = lists.filter(list =>
        searchQuery === "" ||
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const tabs = [
        { id: 'trending' as TabType, label: 'Trending', icon: Flame },
        { id: 'liked' as TabType, label: 'Most Liked', icon: Heart },
        { id: 'new' as TabType, label: 'New', icon: Clock },
    ];

    return (
        <Layout>
            <div className="container mx-auto px-6 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <H1 className="tracking-tight">Community Lists</H1>
                        <p className="text-muted-foreground text-sm mt-1">Discover curated film collections from the community</p>
                    </div>
                    <Link to="/lists">
                        <Button variant="outline" className="rounded-full">Your Lists</Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search lists by name, description, or tag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-muted/30 border-border rounded-lg text-sm"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedTag("All"); }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                activeTab === tab.id && selectedTag === "All"
                                    ? "bg-foreground text-background"
                                    : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Genre Tags */}
                <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide mb-6">
                    {GENRE_TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border whitespace-nowrap transition-all",
                                selectedTag === tag
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Lists Grid */}
                {isLoading ? (
                    <div className="py-16 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredLists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredLists.map((list) => (
                            <Link
                                key={`${list.userId}-${list.id}`}
                                to={`/lists/${list.userId}/${list.id}`}
                                className="group block p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-all hover:border-primary/30"
                            >
                                {/* Movie Posters Preview */}
                                <div className="flex gap-1 mb-3 h-20 bg-muted/20 rounded-md p-1.5 overflow-hidden">
                                    {list.movies && list.movies.length > 0 ? (
                                        list.movies.slice(0, 3).map((movie: Movie) => (
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

                                {/* List Info */}
                                <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                                    {list.isRanked && <TrendingUp className="h-3 w-3 text-amber-500 shrink-0" />}
                                    {list.name}
                                </h4>
                                {list.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 opacity-70">
                                        {list.description}
                                    </p>
                                )}

                                {/* Author & Stats */}
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                                    <div className="flex items-center gap-1.5">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={list.userPhoto} />
                                            <AvatarFallback className="text-[6px]">{list.userName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                                            {list.userName || 'Anon'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => handleQuickLike(e, list)}
                                        disabled={likingId === list.id}
                                        className={cn(
                                            "flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all",
                                            "hover:bg-rose-500/10 hover:text-rose-500",
                                            likingId === list.id && "opacity-50"
                                        )}
                                    >
                                        <Heart className={cn("h-3 w-3", likingId === list.id && "animate-pulse")} />
                                        {list.likeCount || 0}
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center border border-dashed border-border rounded-lg">
                        <h3 className="text-sm font-medium mb-1">No lists found</h3>
                        <p className="text-xs text-muted-foreground">
                            {selectedTag !== "All"
                                ? `No lists tagged "${selectedTag}" yet.`
                                : "Be the first to create a public list!"}
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
