import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Divider } from "@/components/ui/divider";
import { useAuth } from "@/hooks/useAuth";
import { getUserLogs, getUserStats, getUserLists } from "@/lib/db";
import { Loader2, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const COLORS = ["hsl(0, 0%, 15%)", "hsl(0, 0%, 30%)", "hsl(0, 0%, 45%)", "hsl(0, 0%, 60%)", "hsl(0, 0%, 75%)"];

export default function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const [logs, lists] = await Promise.all([
          getUserLogs(user.uid, { limitCount: 500 }),
          getUserLists(user.uid)
        ]);
        const calculatedStats = await getUserStats(logs, lists.length);
        setStats(calculatedStats);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
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

  if (!stats || stats.totalWatched === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-24 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <H1 className="mb-2">Stats</H1>
          <p className="text-muted-foreground">Log some films to see your viewing patterns and statistics.</p>
        </div>
      </Layout>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <H1 className="mb-2 tracking-tight">Stats</H1>
        <p className="text-muted-foreground mb-10">Your {currentYear} in film</p>

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-16">
          <div className="p-4 md:p-8 border border-border/50 rounded-xl bg-muted/5 text-center shadow-sm flex flex-col justify-center">
            <p className="text-2xl md:text-4xl font-serif font-medium">{stats.totalWatched}</p>
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">films watched</p>
          </div>
          <div className="p-4 md:p-8 border border-border/50 rounded-xl bg-muted/5 text-center shadow-sm flex flex-col justify-center">
            <p className="text-2xl md:text-4xl font-serif font-medium">{stats.avgRating}</p>
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">average rating</p>
          </div>
          <div className="p-4 md:p-8 border border-border/50 rounded-xl bg-muted/5 text-center shadow-sm flex flex-col justify-center col-span-2 md:col-span-1">
            <p className="text-2xl md:text-4xl font-serif font-medium">{stats.totalHours}</p>
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">hours watched</p>
          </div>
        </div>

        {/* Films per month */}
        <section className="mb-16">
          <H3 className="text-xl mb-6">Films per month</H3>
          <div className="h-64 border border-border/50 rounded-xl p-6 bg-muted/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.filmsPerMonth}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="films" fill="hsl(0, 0%, 20%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <Divider className="mb-16 opacity-50" />

        <div className="grid md:grid-cols-2 gap-16">
          {/* Genre breakdown */}
          <section>
            <H3 className="text-xl mb-8">Genres</H3>
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topGenres}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="count"
                    strokeWidth={0}
                    animationDuration={1000}
                  >
                    {stats.topGenres.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-6">
              {stats.topGenres.map((genre: any, index: number) => (
                <div key={genre.name} className="flex items-center gap-2 text-sm bg-muted/30 px-3 py-1 rounded-full border border-border/30">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground font-medium">{genre.name}</span>
                  <span className="text-xs opacity-50">{genre.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Top directors */}
          <section>
            <H3 className="text-xl mb-8">Top directors</H3>
            <div className="space-y-4">
              {stats.topDirectors.map((director: any, index: number) => (
                <div key={director.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground w-4 opacity-50">0{index + 1}</span>
                    <span className="font-medium">{director.name}</span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{director.count} films</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <Divider className="my-16 opacity-50" />

        {/* Countries */}
        <section className="pb-12">
          <H3 className="text-xl mb-8">World Cinema</H3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stats.topCountries.map((country: any) => (
              <div key={country.name} className="p-5 border border-border/50 rounded-xl bg-muted/5 text-center shadow-sm hover:border-border transition-colors">
                <p className="font-serif text-base mb-1">{country.name}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{country.count} films</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
