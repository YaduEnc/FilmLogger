import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface CommunityRatingMeterProps {
    average: number;
    totalRatings: number;
    userRating?: number | null;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function CommunityRatingMeter({
    average,
    totalRatings,
    userRating,
    className,
    size = "md"
}: CommunityRatingMeterProps) {
    // Calculate percentage (0-5 scale => 0-100%)
    const percentage = Math.min(100, Math.max(0, (average / 5) * 100));

    const sizeClasses = {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4"
    };

    if (totalRatings === 0) return null;

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div className="flex items-end justify-between gap-4">
                <div className="flex items-baseline gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-bold tracking-tight">{average.toFixed(1)}</span>
                        <Star className="h-4 w-4 fill-primary text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                        from {totalRatings} {totalRatings === 1 ? 'user' : 'users'}
                    </span>
                </div>

                {userRating && (
                    <div className="text-xs font-medium text-primary">
                        Your rating: {userRating} ★
                    </div>
                )}
            </div>

            <div className={cn("w-full bg-muted/40 rounded-full overflow-hidden", sizeClasses[size])}>
                <div
                    className="h-full bg-gradient-to-r from-zinc-600 to-amber-500 transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
