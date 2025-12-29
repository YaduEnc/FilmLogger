import React, { useMemo, useState } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
    logs: { date: string; count: number }[];
    className?: string;
    isPublic?: boolean;
}

export const ActivityHeatmap = ({ logs, className, isPublic = true }: ActivityHeatmapProps) => {
    const today = new Date();
    const startDate = startOfYear(today);
    const endDate = endOfYear(today);
    const [hoveredDay, setHoveredDay] = useState<{ day: Date; count: number; x: number; y: number } | null>(null);

    const allDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const weeks = useMemo(() => {
        const weeksArr: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

        const firstDay = allDays[0];
        const firstDayIndex = firstDay.getDay();
        for (let i = 0; i < firstDayIndex; i++) {
            currentWeek.push(null);
        }

        allDays.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeksArr.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeksArr.push(currentWeek);
        }

        return weeksArr;
    }, [allDays]);

    const getIntensity = (count: number) => {
        if (count === 0) return 'bg-white/5 border-white/[0.02]';
        if (count === 1) return 'bg-amber-500/20 border-amber-500/10';
        if (count === 2) return 'bg-amber-500/40 border-amber-500/20';
        if (count === 3) return 'bg-amber-500/60 border-amber-500/30';
        if (count === 4) return 'bg-amber-500/80 border-amber-500/40';
        return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] border-amber-400';
    };

    const getCountForDate = (day: Date) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return logs.find(l => l.date === dateStr)?.count || 0;
    };

    const monthLabels = useMemo(() => {
        const labels: { label: string; weekIndex: number }[] = [];
        let lastMonth = -1;

        weeks.forEach((week, i) => {
            const firstDay = week.find(d => d !== null);
            if (firstDay && firstDay.getMonth() !== lastMonth) {
                lastMonth = firstDay.getMonth();
                labels.push({
                    label: format(firstDay, 'MMM'),
                    weekIndex: i
                });
            }
        });
        return labels;
    }, [weeks]);

    const handleMouseEnter = (e: React.MouseEvent, day: Date, count: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredDay({
            day,
            count,
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
    };

    return (
        <div className={cn("activity-heatmap-container select-none relative", className)}>
            {/* Custom Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: hoveredDay.x,
                        top: hoveredDay.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-black/95 backdrop-blur-xl border border-white/20 text-[10px] py-2 px-3 shadow-2xl rounded-lg">
                        <div className="flex flex-col gap-0.5 text-center">
                            <span className="text-white font-black text-[12px]">
                                {hoveredDay.count} {hoveredDay.count === 1 ? 'film logged' : 'films logged'}
                            </span>
                            <span className="text-white/50 text-[9px] font-medium">
                                {format(hoveredDay.day, 'EEEE, MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        Cinematic Activity
                        <span className="ml-2 text-white/20 font-normal">{startDate.getFullYear()}</span>
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Less</span>
                    <div className="flex gap-[3px]">
                        {[0, 1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={cn("w-2.5 h-2.5 rounded-[1px] border", getIntensity(level))}
                            />
                        ))}
                    </div>
                    <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">More</span>
                </div>
            </div>

            <div className="relative bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 overflow-hidden backdrop-blur-sm">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 blur-[100px] rounded-full" />

                <div className="overflow-x-auto scrollbar-hide">
                    <div className="inline-block min-w-max pb-2">
                        {/* Month Header */}
                        <div className="flex h-5 items-end mb-2 ml-7 relative">
                            {monthLabels.map((m, i) => (
                                <div
                                    key={i}
                                    className="absolute text-[9px] text-white/30 font-bold uppercase tracking-tighter"
                                    style={{ left: `${m.weekIndex * 14}px` }}
                                >
                                    {m.label}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            {/* Day Labels */}
                            <div className="flex flex-col justify-between h-[96px] py-[2px] text-[8px] text-white/20 font-black uppercase w-5 text-right">
                                <span className="opacity-0">Sun</span>
                                <span>Mon</span>
                                <span className="opacity-0">Tue</span>
                                <span>Wed</span>
                                <span className="opacity-0">Thu</span>
                                <span>Fri</span>
                                <span className="opacity-0">Sat</span>
                            </div>

                            {/* Grid */}
                            <div className="flex gap-[3px]">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                                        {week.map((day, dayIndex) => {
                                            if (!day) return <div key={dayIndex} className="w-2.5 h-2.5 bg-transparent" />;

                                            const count = getCountForDate(day);
                                            const isFuture = day > today;

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    onMouseEnter={(e) => !isFuture && handleMouseEnter(e, day, count)}
                                                    onMouseLeave={handleMouseLeave}
                                                    className={cn(
                                                        "w-2.5 h-2.5 rounded-[1px] transition-all duration-300 border antialiased",
                                                        isFuture ? "bg-white/[0.01] border-transparent opacity-20" : getIntensity(count),
                                                        !isFuture && "hover:scale-150 hover:z-10 cursor-pointer hover:border-white/40 shadow-sm"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
