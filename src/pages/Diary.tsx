import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { LogEntry } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getUserLogs } from "@/lib/db";
import { Loader2, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { ActivityHeatmap } from "@/components/diary/ActivityHeatmap";
import { format } from "date-fns";

export default function Diary() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      if (!user) return;
      try {
        // Fetch more logs to populate the heatmap meaningfully
        const fetchedLogs = await getUserLogs(user.uid, { limitCount: 500 });
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Failed to fetch diary logs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, [user]);

  // Aggregate daily activity for heatmap
  const activityData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const dateStr = format(new Date(log.watchedDate), "yyyy-MM-dd");
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [logs]);

  // Group logs by month
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.watchedDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  const sortedMonths = Object.keys(groupedLogs).sort().reverse();

  const formatMonth = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

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
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <H1 className="mb-4 tracking-tight">Diary</H1>

        {logs.length > 0 && (
          <ActivityHeatmap logs={activityData} className="mb-12" />
        )}

        {logs.length > 0 ? (
          sortedMonths.map((monthKey) => (
            <div key={monthKey} className="mb-12">
              <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-6 pb-2 border-b border-border/50">
                {formatMonth(monthKey)}
              </h2>
              <div className="space-y-4">
                {groupedLogs[monthKey].map((entry) => (
                  <LogEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-xl">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium mb-1">Your diary is quiet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-8">
              Start logging your film journey to build your personal archive.
            </p>
            <Link to="/search">
              <button className="px-6 py-2 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity">
                Find a film to log
              </button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
