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
    subtitle: "Signals from the people already shaping your archive.",
    icon: HeartHandshake
  },
  {
    key: "similarTaste",
    title: "People With Similar Taste Also Watched",
    subtitle: "Crossovers from members whose ratings move like yours.",
    icon: Users
  },
  {
    key: "networkTopThisWeek",
    title: "Top Films In Your Network This Week",
    subtitle: "Fresh conversation starters from your circle.",
    icon: Flame
  },
  {
    key: "hiddenGems",
    title: "Hidden Gems Based On Your Ratings",
    subtitle: "Low-noise discoveries that still match your taste profile.",
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
      <div className="flex items-end justify-between mb-8 gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary">Social Discovery</span>
          </div>
          <h2 className="font-serif text-4xl font-bold tracking-tight uppercase">Recommendations</h2>
          <p className="max-w-2xl font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60 leading-relaxed">
            Watch patterns, shared ratings, and your network&apos;s recent activity distilled into a discovery desk.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {sections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <div key={section.key} className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-primary">
                    <SectionIcon className="h-4 w-4" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em]">{section.title}</span>
                  </div>
                  <p className="font-serif text-lg text-foreground/80 max-w-2xl">{section.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {section.items.slice(0, 4).map((item) => (
                  <div key={`${section.key}-${item.movie.mediaType || "movie"}-${item.movie.id}`} className="space-y-3">
                    <MovieCard movie={item.movie} size="md" />
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 leading-relaxed min-h-[2.5rem]">
                        {item.reason}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50">
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
