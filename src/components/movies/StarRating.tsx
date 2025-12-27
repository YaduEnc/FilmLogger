import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  onChange,
  readonly = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const filled = rating >= i;
    const halfFilled = rating >= i - 0.5 && rating < i;

    stars.push(
      <button
        key={i}
        type="button"
        disabled={readonly}
        onClick={() => !readonly && onChange?.(i)}
        onDoubleClick={() => !readonly && onChange?.(i - 0.5)}
        className={cn(
          "relative transition-opacity",
          !readonly && "hover:opacity-70 cursor-pointer",
          readonly && "cursor-default"
        )}
      >
        <Star
          className={cn(
            sizeClasses[size],
            filled || halfFilled
              ? "fill-foreground text-foreground"
              : "fill-transparent text-border"
          )}
        />
        {halfFilled && (
          <Star
            className={cn(
              sizeClasses[size],
              "absolute inset-0 fill-foreground text-foreground",
              "[clip-path:inset(0_50%_0_0)]"
            )}
          />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars}
      {rating > 0 && (
        <span className="ml-1.5 text-sm text-muted-foreground tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
