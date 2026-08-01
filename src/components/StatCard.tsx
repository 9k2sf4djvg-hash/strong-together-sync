import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend = "flat",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "flat";
  delay?: number;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div
      className="glass-card lift animate-rise rounded-2xl p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Icon className="size-5" />
        </span>
        <TrendIcon className={`size-4 shrink-0 ${trendColor}`} aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="truncate text-sm text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 truncate text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}
