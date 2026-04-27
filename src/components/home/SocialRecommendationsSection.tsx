import { Sparkles, Users, HeartHandshake, Gem, Flame } from "lucide-react";
import { SocialRecommendations } from "@/types/movie";
import { MovieCard } from "@/components/movies/MovieCard";

interface SocialRecommendationsSectionProps {
  recommendations: SocialRecommendations;
}

const recommendationMeta = [
  {
    key: "becauseFriendsLiked",
    title: "Because Your Friends Liked...",
    icon: HeartHandshake
  },
  {
    key: "similarTaste",
    title: "People With Similar Taste Also Watched",
    icon: Users
  },
  {
    key: "networkTopThisWeek",
    title: "Top Films In Your Network This Week",
    icon: Flame
  },
  {
    key: "hiddenGems",
    title: "Hidden Gems Based On Your Ratings",
    icon: Gem
  }
] as const;

export function SocialRecommendationsSection({ recommendations }: SocialRecommendationsSectionProps) {
  const sections = recommendationMeta
    .map((meta) => ({
      ...meta,
      items: recommendations[meta.key]
    }))
    .filter((section) => section.items.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="mb-24">
      <div className="flex items-end justify-between mb-7 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Social Discovery</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-[2.1rem] font-bold tracking-tight uppercase">Recommendations</h2>
          <p className="max-w-xl font-serif text-sm text-foreground/58">
            Discovery shaped by your circle, not just the global feed.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <div key={section.key} className="border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-primary">
                    <SectionIcon className="h-4 w-4" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{section.title}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-7 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {section.items.slice(0, 4).map((item) => (
                  <div
                    key={`${section.key}-${item.movie.mediaType || "movie"}-${item.movie.id}`}
                    className="space-y-2.5 max-w-[176px]"
                  >
                    <MovieCard movie={item.movie} size="md" />
                    <div className="space-y-1.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/58 leading-relaxed line-clamp-1 min-h-[1rem]">
                        {item.reason}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground/46">
                        <span>{item.userCount} source{item.userCount === 1 ? "" : "s"}</span>
                        {item.averageRating > 0 && <span>{item.averageRating.toFixed(1)}/10 avg</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
