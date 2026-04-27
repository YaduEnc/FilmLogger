import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/typography";
import { LogEntry } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { getConnectionStatus, getUserByUsername, getUserLogs } from "@/lib/db";
import { Loader2, Film, Lock, ShieldAlert, CalendarRange, Flame, Repeat2, Sparkles, Quote, Clock3, ScanSearch } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ActivityHeatmap } from "@/components/diary/ActivityHeatmap";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getUniqueWatchDays(logs: LogEntry[]) {
  return Array.from(
    new Set(logs.map((log) => format(new Date(log.watchedDate), "yyyy-MM-dd")))
  ).sort();
}

function calculateStreaks(logs: LogEntry[]) {
  const watchDays = getUniqueWatchDays(logs);
  if (watchDays.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 1;
  let running = 1;

  for (let index = 1; index < watchDays.length; index += 1) {
    const previous = new Date(watchDays[index - 1]).getTime();
    const current = new Date(watchDays[index]).getTime();

    if (current - previous === DAY_IN_MS) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  let current = 1;
  for (let index = watchDays.length - 1; index > 0; index -= 1) {
    const currentDay = new Date(watchDays[index]).getTime();
    const previousDay = new Date(watchDays[index - 1]).getTime();

    if (currentDay - previousDay === DAY_IN_MS) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

function formatMonthKey(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function Diary() {
  const { username } = useParams();
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerName, setOwnerName] = useState("Diary");
  const [isPrivateDiary, setIsPrivateDiary] = useState(false);
  const [isMissingProfile, setIsMissingProfile] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");

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

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => new Date(log.watchedDate).getFullYear().toString()))
    ).sort((left, right) => parseInt(right, 10) - parseInt(left, 10));
  }, [logs]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const yearLogs = useMemo(() => {
    if (!selectedYear) return logs;
    return logs.filter((log) => new Date(log.watchedDate).getFullYear().toString() === selectedYear);
  }, [logs, selectedYear]);

  const overviewActivityData = useMemo(() => {
    const counts: Record<string, number> = {};
    yearLogs.forEach((log) => {
      const dateStr = format(new Date(log.watchedDate), "yyyy-MM-dd");
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [yearLogs]);

  const groupedYearLogs = useMemo(() => {
    return yearLogs.reduce((accumulator, log) => {
      const date = new Date(log.watchedDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(log);
      return accumulator;
    }, {} as Record<string, LogEntry[]>);
  }, [yearLogs]);

  const sortedMonths = useMemo(() => Object.keys(groupedYearLogs).sort().reverse(), [groupedYearLogs]);

  const ratings = yearLogs.filter((log) => log.rating > 0).map((log) => log.rating);
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
    : 0;

  const streaks = useMemo(() => calculateStreaks(yearLogs), [yearLogs]);
  const allTimeStreaks = useMemo(() => calculateStreaks(logs), [logs]);

  const reviewCount = yearLogs.filter((log) => !!log.reviewShort || !!log.diaryLong).length;
  const totalMinutes = yearLogs.reduce((sum, log) => sum + (log.movie.runtime || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const firstWatchCount = yearLogs.filter((log) => !log.isRewatch).length;
  const rewatchCount = yearLogs.filter((log) => log.isRewatch).length;

  const moodMap = useMemo(() => {
    const moodCounts = new Map<string, { count: number; average: number; total: number }>();
    yearLogs.forEach((log) => {
      if (!log.mood) return;
      const existing = moodCounts.get(log.mood) || { count: 0, average: 0, total: 0 };
      existing.count += 1;
      existing.total += log.rating || 0;
      existing.average = existing.total / existing.count;
      moodCounts.set(log.mood, existing);
    });

    return Array.from(moodCounts.entries())
      .map(([mood, data]) => ({
        mood,
        count: data.count,
        averageRating: data.average
      }))
      .sort((left, right) => right.count - left.count);
  }, [yearLogs]);

  const monthlyRecaps = useMemo(() => {
    return sortedMonths.map((monthKey) => {
      const entries = groupedYearLogs[monthKey];
      const monthRatings = entries.filter((entry) => entry.rating > 0).map((entry) => entry.rating);
      const moodCounts: Record<string, number> = {};

      entries.forEach((entry) => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
      });

      const standoutEntry = [...entries].sort((left, right) => {
        if ((right.rating || 0) !== (left.rating || 0)) {
          return (right.rating || 0) - (left.rating || 0);
        }
        return new Date(right.watchedDate).getTime() - new Date(left.watchedDate).getTime();
      })[0];

      const favoriteMood = Object.entries(moodCounts).sort((left, right) => right[1] - left[1])[0]?.[0];

      return {
        key: monthKey,
        label: formatMonthKey(monthKey),
        count: entries.length,
        averageRating: monthRatings.length > 0
          ? monthRatings.reduce((sum, value) => sum + value, 0) / monthRatings.length
          : 0,
        reviewCount: entries.filter((entry) => !!entry.reviewShort || !!entry.diaryLong).length,
        favoriteMood,
        standoutEntry
      };
    });
  }, [groupedYearLogs, sortedMonths]);

  const favoriteMonth = monthlyRecaps[0]
    ? [...monthlyRecaps].sort((left, right) => (right.averageRating * right.count) - (left.averageRating * left.count))[0]
    : null;

  const genreHighlights = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    yearLogs.forEach((log) => {
      log.movie.genres?.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));
  }, [yearLogs]);

  const timelineEntries = useMemo(() => {
    return [...yearLogs].sort(
      (left, right) => new Date(right.watchedDate).getTime() - new Date(left.watchedDate).getTime()
    );
  }, [yearLogs]);

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
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="space-y-3">
            <H1 className="tracking-tight">{ownerName}</H1>
            {!isMissingProfile && !isPrivateDiary && (
              <p className="max-w-2xl font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60 leading-relaxed">
                A yearly review, monthly recaps, and a note-rich timeline built from the archive you&apos;ve already recorded.
              </p>
            )}
          </div>

          {availableYears.length > 0 && !isMissingProfile && !isPrivateDiary && (
            <div className="w-full lg:w-[220px]">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-12 border-white/10 bg-white/[0.02] font-mono text-[10px] uppercase tracking-[0.25em]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year} className="font-mono text-[10px] uppercase tracking-[0.2em]">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

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
        ) : yearLogs.length > 0 ? (
          <Tabs defaultValue="review" className="space-y-8">
            <TabsList className="bg-white/[0.02] border border-white/10 p-1 rounded-none">
              <TabsTrigger value="review" className="font-mono text-[10px] uppercase tracking-[0.2em] rounded-none">Yearly Review</TabsTrigger>
              <TabsTrigger value="timeline" className="font-mono text-[10px] uppercase tracking-[0.2em] rounded-none">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-10">
              <section className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5">
                      <CalendarRange className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">{selectedYear || "All Years"} Review</span>
                    </div>
                    <h2 className="font-serif text-4xl font-bold tracking-tight uppercase">Your Archive At A Glance</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                    {[
                      { label: "Entries", value: yearLogs.length, icon: Film },
                      { label: "Avg Rating", value: averageRating > 0 ? averageRating.toFixed(1) : "—", icon: Sparkles },
                      { label: "Hours", value: totalHours, icon: Clock3 },
                      { label: "Longest Streak", value: `${streaks.longest}d`, icon: Flame }
                    ].map((item) => (
                      <Card key={item.label} className="rounded-none border-white/10 bg-transparent shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-primary mb-3">
                            <item.icon className="h-3.5 w-3.5" />
                            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary/70">{item.label}</span>
                          </div>
                          <p className="font-serif text-3xl font-bold tracking-tight">{item.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-6">
                    <ActivityHeatmap
                      logs={overviewActivityData}
                      className="mb-0"
                      year={selectedYear ? parseInt(selectedYear, 10) : undefined}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="rounded-none border-white/10 bg-transparent shadow-none">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center gap-2 text-primary">
                            <Repeat2 className="h-4 w-4" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.25em]">First Watch vs Rewatch</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em]">
                              <span className="text-muted-foreground">First Watches</span>
                              <span>{firstWatchCount}</span>
                            </div>
                            <div className="h-2 bg-white/5 overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${yearLogs.length > 0 ? (firstWatchCount / yearLogs.length) * 100 : 0}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em]">
                              <span className="text-muted-foreground">Rewatches</span>
                              <span>{rewatchCount}</span>
                            </div>
                            <div className="h-2 bg-white/5 overflow-hidden">
                              <div
                                className="h-full bg-white/40"
                                style={{ width: `${yearLogs.length > 0 ? (rewatchCount / yearLogs.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-none border-white/10 bg-transparent shadow-none">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center gap-2 text-primary">
                            <Flame className="h-4 w-4" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.25em]">Streaks</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-end justify-between">
                              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Current</span>
                              <span className="font-serif text-3xl font-bold">{allTimeStreaks.current}d</span>
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">This Year Best</span>
                              <span className="font-serif text-3xl font-bold">{streaks.longest}d</span>
                            </div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                              {favoriteMonth ? `Peak run landed in ${favoriteMonth.label}.` : "Your archive will start showing patterns after a few more logs."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-none border-white/10 bg-transparent shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Quote className="h-4 w-4" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em]">Yearly Notes</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em]">
                            <span className="text-muted-foreground">Reviewed Entries</span>
                            <span>{reviewCount}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em]">
                            <span className="text-muted-foreground">Favorite Month</span>
                            <span>{favoriteMonth?.label || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em]">
                            <span className="text-muted-foreground">Dominant Mood</span>
                            <span>{moodMap[0]?.mood || "Unwritten"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none border-white/10 bg-transparent shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <ScanSearch className="h-4 w-4" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em]">Mood Map</span>
                        </div>
                        {moodMap.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {moodMap.slice(0, 6).map((mood) => (
                              <div key={mood.mood} className="flex items-center justify-between border border-white/5 px-3 py-2">
                                <div>
                                  <p className="font-serif text-lg">{mood.mood}</p>
                                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">{mood.count} entries</p>
                                </div>
                                <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]">
                                  {mood.averageRating > 0 ? mood.averageRating.toFixed(1) : "—"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                            Start logging with moods to unlock your emotional viewing map.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-none border-white/10 bg-transparent shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em]">Genre Drift</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {genreHighlights.length > 0 ? genreHighlights.map((genre) => (
                            <Badge key={genre.genre} variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]">
                              {genre.genre} / {genre.count}
                            </Badge>
                          )) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                              No genre pattern yet.
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div className="space-y-2">
                  <h2 className="font-serif text-3xl font-bold tracking-tight uppercase">Monthly Recaps</h2>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                    Every month compressed into counts, moods, and one standout watch.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {monthlyRecaps.map((month) => (
                    <Card key={month.key} className="rounded-none border-white/10 bg-white/[0.02] shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-serif text-2xl font-bold tracking-tight">{month.label}</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                              {month.count} entries / {month.reviewCount} notes
                            </p>
                          </div>
                          <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]">
                            {month.averageRating > 0 ? month.averageRating.toFixed(1) : "—"}
                          </Badge>
                        </div>

                        {month.favoriteMood && (
                          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/80">
                            Mood marker: {month.favoriteMood}
                          </p>
                        )}

                        {month.standoutEntry && (
                          <div className="flex gap-3 border border-white/5 p-3">
                            <div className="w-12 aspect-[2/3] bg-white/5 overflow-hidden shrink-0">
                              {month.standoutEntry.movie.posterUrl ? (
                                <img
                                  src={month.standoutEntry.movie.posterUrl}
                                  alt={month.standoutEntry.movie.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground/50 text-center px-1">
                                  {month.standoutEntry.movie.title}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif text-lg font-bold leading-none mb-2 line-clamp-2">
                                {month.standoutEntry.movie.title}
                              </p>
                              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
                                standout watch
                              </p>
                              {(month.standoutEntry.reviewShort || month.standoutEntry.diaryLong) && (
                                <p className="font-serif text-sm italic text-foreground/75 line-clamp-2">
                                  {(month.standoutEntry.reviewShort || month.standoutEntry.diaryLong || "").slice(0, 140)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-8">
              <div className="space-y-2">
                <h2 className="font-serif text-3xl font-bold tracking-tight uppercase">Timeline</h2>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                  Posters, notes, moods, and rewatches arranged in one continuous archive stream.
                </p>
              </div>

              <div className="space-y-10">
                {sortedMonths.map((monthKey) => (
                  <section key={monthKey} className="space-y-5">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/80 whitespace-nowrap">
                        {formatMonthKey(monthKey)}
                      </span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="space-y-4">
                      {groupedYearLogs[monthKey].map((entry) => (
                        <article key={entry.id} className="border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                          <div className="flex gap-4">
                            <Link to={`/${entry.mediaType || "movie"}/${entry.movieId}`} className="shrink-0">
                              <div className="w-20 aspect-[2/3] bg-white/5 overflow-hidden">
                                {entry.movie.posterUrl ? (
                                  <img src={entry.movie.posterUrl} alt={entry.movie.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/60 px-2 text-center">
                                    {entry.movie.title}
                                  </div>
                                )}
                              </div>
                            </Link>

                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <Link
                                    to={`/${entry.mediaType || "movie"}/${entry.movieId}`}
                                    className="font-serif text-2xl font-bold tracking-tight hover:text-primary transition-colors line-clamp-2"
                                  >
                                    {entry.movie.title}
                                  </Link>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                                    <span>{format(new Date(entry.watchedDate), "dd MMM yyyy")}</span>
                                    {entry.rating > 0 && <span>{entry.rating.toFixed(1)}/10</span>}
                                    {entry.mood && <span>{entry.mood}</span>}
                                    {entry.isRewatch && <span>Rewatch #{entry.rewatchCount}</span>}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]">
                                    {entry.mediaType === "tv" ? "Series" : "Film"}
                                  </Badge>
                                  {entry.location && (
                                    <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]">
                                      {entry.location}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {(entry.reviewShort || entry.diaryLong) && (
                                <div className="space-y-2 border-l border-primary/30 pl-4">
                                  {entry.reviewShort && (
                                    <p className="font-serif text-base italic text-foreground/85 line-clamp-2">
                                      “{entry.reviewShort}”
                                    </p>
                                  )}
                                  {entry.diaryLong && (
                                    <p className="font-serif text-sm leading-relaxed text-foreground/70 line-clamp-4">
                                      {entry.diaryLong}
                                    </p>
                                  )}
                                </div>
                              )}

                              {entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {entry.tags.map((tag) => (
                                    <Badge
                                      key={`${entry.id}-${tag}`}
                                      variant="outline"
                                      className="rounded-none font-mono text-[10px] uppercase tracking-[0.15em]"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
      </div>
    </Layout>
  );
}
