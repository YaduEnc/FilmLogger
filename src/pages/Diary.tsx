import { useState, useEffect, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { LogEntryCard } from "@/components/movies/LogEntryCard";
import { LogEntry } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getConnectionStatus, getUserByUsername, getUserLogs } from "@/lib/db";
import { Loader2, Film, Lock, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ActivityHeatmap } from "@/components/diary/ActivityHeatmap";
import { format } from "date-fns";

export default function Diary() {
  const { username } = useParams();
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("Diary");
  const [isPrivateDiary, setIsPrivateDiary] = useState(false);
  const [isMissingProfile, setIsMissingProfile] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      if (!username && !user) {
        setLogs([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsPrivateDiary(false);
        setIsMissingProfile(false);

        let targetUserId = user?.uid || "";
        let targetOwnerName = user?.displayName || "Diary";
        let currentUserId = user?.uid;
        let isConnection = false;

        if (username) {
          const profileUser = await getUserByUsername(username);

          if (!profileUser) {
            setIsMissingProfile(true);
            setLogs([]);
            return;
          }

          targetUserId = profileUser.uid;
          targetOwnerName = profileUser.displayName || username;

          if (currentUserId && currentUserId !== targetUserId) {
            const connection = await getConnectionStatus(currentUserId, targetUserId);
            isConnection = connection.status === "accepted";
          }

          const isOwnDiary = currentUserId === targetUserId;
          if (!isOwnDiary && profileUser.isPublic === false && !isConnection) {
            setIsPrivateDiary(true);
            setLogs([]);
            setOwnerName(`${targetOwnerName}'s Diary`);
            return;
          }
        }

        // Fetch more logs to populate the heatmap meaningfully
        const fetchedLogs = await getUserLogs(targetUserId, {
          currentUserId,
          isConnection,
          limitCount: 500
        });

        setLogs(fetchedLogs);
        setOwnerName(username ? `${targetOwnerName}'s Diary` : "Diary");
      } catch (error) {
        console.error("Failed to fetch diary logs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, [user, username]);

  // Aggregate daily activity for heatmap
  const activityData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const dateStr = format(new Date(log.watchedDate), "yyyy-MM-dd");
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [logs]);

  // Group logs by month - memoized to prevent recomputation
  const groupedLogs = useMemo(() => {
    return logs.reduce((acc, log) => {
      const date = new Date(log.watchedDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(log);
      return acc;
    }, {} as Record<string, LogEntry[]>);
  }, [logs]);

  const sortedMonths = useMemo(() => Object.keys(groupedLogs).sort().reverse(), [groupedLogs]);
  const [visibleMonths, setVisibleMonths] = useState<Set<string>>(new Set());
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Lazy load months using Intersection Observer (virtualization-like behavior)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const monthKey = entry.target.getAttribute('data-month-key');
          if (monthKey) {
            setVisibleMonths((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(monthKey);
              }
              return next;
            });
          }
        });
      },
      { rootMargin: '200px' } // Load 200px before entering viewport
    );

    sortedMonths.forEach((monthKey) => {
      const element = monthRefs.current.get(monthKey);
      if (element) {
        observer.observe(element);
      }
    });

    // Initially show first 2 months
    setVisibleMonths(new Set(sortedMonths.slice(0, 2)));

    return () => observer.disconnect();
  }, [sortedMonths]);

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
        <H1 className="mb-4 tracking-tight">{ownerName}</H1>

        {isMissingProfile ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-xl">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium mb-1">Archive not found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              This diary does not belong to an existing profile.
            </p>
          </div>
        ) : isPrivateDiary ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-xl">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium mb-1">Private diary</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              This member only shares their diary with connected followers.
            </p>
          </div>
        ) : (
          <>

            {logs.length > 0 && (
              <ActivityHeatmap logs={activityData} className="mb-12" />
            )}

            {logs.length > 0 ? (
              sortedMonths.map((monthKey) => {
                const isVisible = visibleMonths.has(monthKey);
                const entries = groupedLogs[monthKey];
                
                return (
                  <div
                    key={monthKey}
                    ref={(el) => {
                      if (el) monthRefs.current.set(monthKey, el);
                    }}
                    data-month-key={monthKey}
                    className="mb-12"
                  >
                    <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-6 pb-2 border-b border-border/50">
                      {formatMonth(monthKey)}
                    </h2>
                    {isVisible ? (
                      <div className="space-y-4">
                        {entries.map((entry) => (
                          <LogEntryCard key={entry.id} entry={entry} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 min-h-[200px] flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-30" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-border rounded-xl">
                <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-medium mb-1">{username ? "No public entries yet" : "Your diary is quiet"}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                  {username
                    ? "This diary has no visible log entries yet."
                    : "Start logging your film journey to build your personal archive."}
                </p>
                {!username && (
                  <Link to="/search">
                    <button className="px-6 py-2 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-opacity">
                      Find a film to log
                    </button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
