import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  active: "bg-success/12 text-success border-success/25",
  live: "bg-success/12 text-success border-success/25",
  approved: "bg-success/12 text-success border-success/25",
  published: "bg-success/12 text-success border-success/25",
  pending: "bg-warning/15 text-warning border-warning/30",
  in_review: "bg-info/12 text-info border-info/25",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
  closed: "bg-secondary text-secondary-foreground border-border",
  completed: "bg-secondary text-secondary-foreground border-border",
  rejected: "bg-destructive/12 text-destructive border-destructive/25",
  suspended: "bg-destructive/12 text-destructive border-destructive/25",
  cancelled: "bg-destructive/12 text-destructive border-destructive/25",
};

const labels: Record<string, string> = {
  in_review: "In review",
};

export function StatusChip({ status, label: customLabel, className }: { status: string; label?: string; className?: string }) {
  const tone = tones[status.toLowerCase()] ?? tones["draft"];
  const defaultLabel = labels[status.toLowerCase()] ?? status.charAt(0).toUpperCase() + status.toLowerCase().slice(1);
  const label = customLabel ?? defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export function SeverityChip({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    info: "bg-info/12 text-info border-info/25",
    warning: "bg-warning/15 text-warning border-warning/30",
    critical: "bg-destructive/12 text-destructive border-destructive/25",
    error: "bg-destructive/12 text-destructive border-destructive/25",
    success: "bg-success/12 text-success border-success/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        map[severity] ?? map["info"],
      )}
    >
      {severity}
    </span>
  );
}
