import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: number | undefined;
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
  progress?: number | undefined;
  index?: number | undefined;
  loading?: boolean | undefined;
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  progress,
  index = 0,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card-surface p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-32" />
        <Skeleton className="mt-4 h-3 w-full" />
      </div>
    );
  }

  const positive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="card-surface card-hover group relative overflow-hidden p-5 border border-border/80 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {label}
          </p>
          <p className="text-display mt-2 text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
        </div>
        {Icon ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary shadow-xs transition-colors group-hover:bg-primary/15">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      {typeof delta === "number" ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
              positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
          {hint ? <span className="truncate text-muted-foreground">{hint}</span> : null}
        </div>
      ) : hint ? (
        <p className="mt-3 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}

      {typeof progress === "number" ? (
        <div className="mt-4">
          <Progress value={progress} className="h-1.5" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">{progress}% of target</p>
        </div>
      ) : null}
    </motion.div>
  );
}

export function MetricWidget({
  label,
  value,
  caption,
  tone = "default",
}: {
  label: string;
  value: string;
  caption?: string | undefined;
  tone?: "default" | "success" | "warning" | "danger" | undefined;
}) {
  const tones = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-display mt-1.5 text-xl font-semibold tabular-nums", tones[tone])}>
        {value}
      </p>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
