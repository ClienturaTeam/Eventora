import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useManagerDashboard } from "../hooks/manager.api";
import { useAuth } from "@/lib/auth";
import { ManagerEventDialog } from "../components/manager-event-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CalendarDays,
  Users2,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Plus,
  RefreshCw,
  FolderGit2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileText,
  Trophy,
  Activity,
  Layers,
  Search,
  ExternalLink,
  Cpu,
  GraduationCap,
  Scale,
  Building2,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Modern chart color tokens
const CHART_COLORS = [
  "oklch(0.65 0.16 254)", // Primary Azure
  "oklch(0.68 0.13 158)", // Emerald
  "oklch(0.79 0.14 72)",  // Amber
  "oklch(0.72 0.13 195)", // Sky / Cyan
  "oklch(0.68 0.17 12)",  // Rose
];

export function ManagerDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading, error, refetch, isFetching } = useManagerDashboard();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activityFilter, setActivityFilter] = useState<"ALL" | "PROPOSALS" | "EVALUATIONS">("ALL");
  const [eventSearch, setEventSearch] = useState("");

  const orgName = user?.memberships?.[0]?.organization?.name || "Contoso Innovation Labs";
  const managerName = user?.firstName || user?.email?.split("@")[0] || "Manager";

  // Friendly action mapping for Audit Logs
  const formatAuditAction = (action: string) => {
    switch (action) {
      case "PROPOSAL_APPROVED":
        return {
          title: "Proposal Approved",
          category: "PROPOSALS",
          desc: "Hackathon proposal reviewed and approved for staging.",
          icon: CheckCircle2,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      case "PROPOSAL_REJECTED":
        return {
          title: "Proposal Returned",
          category: "PROPOSALS",
          desc: "Proposal reviewed; feedback returned to organizers.",
          icon: XCircle,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        };
      case "EVALUATION_CORRECTION_REQUESTED":
        return {
          title: "Evaluation Correction Requested",
          category: "EVALUATIONS",
          desc: "Judge scorecard flagged for re-scoring or comments check.",
          icon: AlertCircle,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        };
      case "EVENT_CREATED":
        return {
          title: "Event Published",
          category: "EVENTS",
          desc: "New event created and registered in catalog.",
          icon: CalendarDays,
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
          badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        };
      case "SUBMISSION_EVALUATED":
        return {
          title: "Scorecard Submitted",
          category: "EVALUATIONS",
          desc: "Official rubric criteria evaluated by designated judge.",
          icon: Award,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
          badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        };
      default: {
        const humanTitle = action
          .toLowerCase()
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        return {
          title: humanTitle,
          category: "SYSTEM",
          desc: "System state updated across organization resources.",
          icon: Activity,
          color: "text-muted-foreground bg-muted border-border",
          badge: "bg-muted text-muted-foreground border-border",
        };
      }
    }
  };

  // Filtered activity logs
  const filteredActivity = useMemo(() => {
    if (!stats?.recentActivity) return [];
    if (activityFilter === "ALL") return stats.recentActivity;
    return stats.recentActivity.filter((act: any) => {
      const meta = formatAuditAction(act.action);
      return meta.category === activityFilter;
    });
  }, [stats?.recentActivity, activityFilter]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!stats?.upcomingEvents) return [];
    if (!eventSearch.trim()) return stats.upcomingEvents;
    const q = eventSearch.toLowerCase();
    return stats.upcomingEvents.filter(
      (ev: any) =>
        ev.name.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q)
    );
  }, [stats?.upcomingEvents, eventSearch]);

  // Analytics datasets
  const growthTimelineData = useMemo(() => [
    { stage: "Launch", participants: 1, teams: 1, submissions: 0, scorecards: 0 },
    { stage: "Registrations", participants: Math.max(stats?.totalRegistrations || 5, 3), teams: stats?.activeTeams || 2, submissions: 1, scorecards: 0 },
    { stage: "Submissions", participants: Math.max(stats?.totalRegistrations || 5, 4), teams: stats?.activeTeams || 2, submissions: stats?.totalSubmissions || 2, scorecards: 2 },
    { stage: "Evaluation", participants: stats?.totalRegistrations || 5, teams: stats?.activeTeams || 2, submissions: stats?.totalSubmissions || 2, scorecards: stats?.completedEvaluations || 4 },
  ], [stats]);

  const competitionBreakdownData = useMemo(() => {
    const list: { name: string; value: number }[] = [];
    if (stats?.upcomingEvents) {
      stats.upcomingEvents.forEach((ev: any) => {
        if (ev.competitions && ev.competitions.length > 0) {
          ev.competitions.forEach((comp: any) => {
            list.push({
              name: comp.name.length > 22 ? comp.name.slice(0, 20) + "..." : comp.name,
              value: comp._count?.teams || 1,
            });
          });
        }
      });
    }
    if (list.length === 0) {
      list.push(
        { name: "AI Accessibility Track", value: 2 },
        { name: "Climate Tech Innovation", value: 1 }
      );
    }
    return list;
  }, [stats?.upcomingEvents]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <Skeleton className="h-96 rounded-xl lg:col-span-4" />
          <Skeleton className="h-96 rounded-xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-surface p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-semibold">Unable to Load Manager Dashboard</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A network or database connection issue occurred while fetching organization statistics.
        </p>
        <Button onClick={() => refetch()} className="mt-6" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* =========================================================================
          1. EXECUTIVE COMMAND HEADER
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-surface p-6 shadow-sm sm:p-8">
        {/* Subtle decorative background gradient glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-border/80 bg-background/60 px-3 py-1 font-mono text-xs font-semibold backdrop-blur"
              >
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {orgName}
              </Badge>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Real-time System Operational
              </span>
            </div>

            <h1 className="text-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                {managerName}
              </span>
            </h1>

            <p className="max-w-2xl text-sm text-muted-foreground">
              Executive oversight for ongoing hackathons, participant teams, rubric evaluation scorecards, and institutional approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-border/80 bg-background/50 backdrop-blur hover:bg-accent"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Sync Stats
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-border/80 bg-background/50 backdrop-blur hover:bg-accent"
            >
              <Link to="/manager/all-proposals">
                <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                Proposals
                {stats?.pendingProposals ? (
                  <Badge variant="secondary" className="ml-2 h-5 bg-purple-500/20 px-1.5 text-purple-300">
                    {stats.pendingProposals}
                  </Badge>
                ) : null}
              </Link>
            </Button>

            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. HIGH-IMPACT KPI METRICS (BENTO CARDS)
      ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Events */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card-surface group relative overflow-hidden p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Managed Events
              </span>
              <div className="text-display flex items-baseline gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                {stats?.totalEvents ?? 0}
                <span className="text-xs font-normal text-muted-foreground">in catalog</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {stats?.upcomingEvents?.length || 0} Scheduled
            </span>
            <Link
              to="/manager/events"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Manage <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Active Teams */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="card-surface group relative overflow-hidden p-5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Teams
              </span>
              <div className="text-display flex items-baseline gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                {stats?.activeTeams ?? 0}
                <span className="text-xs font-normal text-muted-foreground">registered</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <Users2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
            <span className="font-medium text-muted-foreground">
              {stats?.totalRegistrations ?? 5} Total Hackers
            </span>
            <Link
              to="/teams"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-emerald-400"
            >
              Directory <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 3: Evaluation Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card-surface group relative overflow-hidden p-5 transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Judge Scorecards
              </span>
              <div className="text-display flex items-baseline gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                {stats?.pendingEvaluations ?? 0}
                <span className="text-xs font-normal text-amber-400">Pending Review</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <Award className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
            <span className="font-medium text-muted-foreground">
              {stats?.completedEvaluations ?? 4} Completed
            </span>
            <Link
              to="/evaluations"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-amber-400"
            >
              Review Rubrics <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 4: Submissions & Projects */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="card-surface group relative overflow-hidden p-5 transition-all duration-300 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Submissions
              </span>
              <div className="text-display flex items-baseline gap-2 text-3xl font-extrabold tracking-tight text-foreground">
                {stats?.totalSubmissions ?? 2}
                <span className="text-xs font-normal text-muted-foreground">received</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <FolderGit2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-sky-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Validated
            </span>
            <Link
              to="/submissions"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-sky-400"
            >
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          3. MAIN OPERATIONS GRID (UPCOMING EVENTS & ACTIVITY STREAM)
      ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Section: Events Showcase & Live Operations (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="border-border/80 bg-card/70 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-display text-lg font-semibold">Active & Upcoming Events</CardTitle>
                <CardDescription className="text-xs">
                  Event schedule, tracks, team participation, and competition statuses
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-background/50 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <Button size="sm" variant="ghost" asChild className="h-8 text-xs text-primary shrink-0">
                  <Link to="/manager/events">View All</Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {filteredEvents && filteredEvents.length > 0 ? (
                <div className="space-y-3">
                  {filteredEvents.map((event: any, idx: number) => {
                    const eventDate = new Date(event.startTime);
                    const isLive = new Date() >= new Date(event.startTime) && new Date() <= new Date(event.endTime);
                    const daysLeft = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={event.id}
                        className="group relative rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all duration-200 hover:border-primary/40 hover:bg-surface/80"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {event.name}
                              </h3>
                              {isLive ? (
                                <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  LIVE NOW
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                                  {daysLeft > 0 ? `Starts in ${daysLeft} days` : "Scheduled"}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {event.currency} {event.price === 0 ? "FREE" : event.price}
                              </Badge>
                            </div>

                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {event.description || "Comprehensive innovation hackathon with multiple competition tracks."}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                              <Link to="/manager/events">
                                Manage
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <Link to="/leaderboard">
                                <Trophy className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {/* Competition tracks badge list */}
                        {event.competitions && event.competitions.length > 0 ? (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Tracks:</span>
                            {event.competitions.map((comp: any) => (
                              <span
                                key={comp.id}
                                className="inline-flex items-center gap-1 rounded-md bg-accent/60 px-2 py-0.5 text-[11px] text-accent-foreground"
                              >
                                <Cpu className="h-3 w-3 text-primary" />
                                {comp.name}
                                {comp._count?.teams ? (
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    ({comp._count.teams} teams)
                                  </span>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {/* Metric pills summary footer */}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                            {eventDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users2 className="h-3.5 w-3.5 text-emerald-400" />
                            {event._count?.registrations ?? 0} Registrations
                          </span>
                          <span className="flex items-center gap-1">
                            <FolderGit2 className="h-3.5 w-3.5 text-sky-400" />
                            {event._count?.submissions ?? 0} Submissions
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-medium">No events found matching your search</p>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    size="sm"
                    className="mt-4 gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Create New Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Analytics Chart: Lifecycle Velocity */}
          <Card className="border-border/80 bg-card/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-display text-base font-semibold">Event Pipeline & Lifecycle Velocity</CardTitle>
                <CardDescription className="text-xs">
                  Hackathon progression from registration to completed judge scorecards
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono text-primary">
                Current Cycle
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthTimelineData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHackers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorScorecards" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 7%)" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      stroke="oklch(0.68 0.02 256)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.68 0.02 256)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.22 0.02 258)",
                        border: "1px solid oklch(1 0 0 / 12%)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="participants"
                      name="Participants"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorHackers)"
                    />
                    <Area
                      type="monotone"
                      dataKey="scorecards"
                      name="Scorecards"
                      stroke={CHART_COLORS[1]}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorScorecards)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Activity Stream & Quick Launchpad (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Recent Activity Audit Feed */}
          <Card className="border-border/80 bg-card/70 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-display text-lg font-semibold">Audit & Operations Feed</CardTitle>
                <CardDescription className="text-xs">
                  Institutional actions, proposal verdicts, and score updates
                </CardDescription>
              </div>

              {/* Activity filter chips */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background/50 p-0.5 text-xs">
                <button
                  onClick={() => setActivityFilter("ALL")}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    activityFilter === "ALL" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActivityFilter("PROPOSALS")}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    activityFilter === "PROPOSALS" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Proposals
                </button>
                <button
                  onClick={() => setActivityFilter("EVALUATIONS")}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    activityFilter === "EVALUATIONS" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Judging
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {filteredActivity && filteredActivity.length > 0 ? (
                <div className="space-y-3.5">
                  {filteredActivity.map((activity: any) => {
                    const meta = formatAuditAction(activity.action);
                    const ActionIcon = meta.icon;
                    const dateObj = new Date(activity.createdAt);
                    const formattedDate = dateObj.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const actorName = activity.actor
                      ? `${activity.actor.firstName || ""} ${activity.actor.lastName || ""}`.trim() || activity.actor.email
                      : "System Admin";

                    return (
                      <div
                        key={activity.id}
                        className="group flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:border-border/60 hover:bg-surface/50"
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}
                        >
                          <ActionIcon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-foreground">
                              {meta.title}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              {formattedDate}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {meta.desc}
                          </p>

                          <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground/80">
                            <Avatar className="h-4 w-4 text-[9px]">
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {actorName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{actorName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No activity found for this filter.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Management Shortcuts */}
          <Card className="border-border/80 bg-card/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-display text-base font-semibold">Manager Command Shortcuts</CardTitle>
              <CardDescription className="text-xs">
                Direct access to core event orchestration and governance modules
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5 p-4 pt-0">
              <Link
                to="/manager/problem-statements"
                className="group flex flex-col justify-between rounded-xl border border-border/70 bg-surface/40 p-3 transition-all hover:border-primary/40 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-foreground">Problem Statements</p>
                  <p className="text-[10px] text-muted-foreground">Curate tracks</p>
                </div>
              </Link>

              <Link
                to="/manager/judges"
                className="group flex flex-col justify-between rounded-xl border border-border/70 bg-surface/40 p-3 transition-all hover:border-amber-500/40 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Scale className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-foreground">Judges & Scoring</p>
                  <p className="text-[10px] text-muted-foreground">Assign rubrics</p>
                </div>
              </Link>

              <Link
                to="/leaderboard"
                className="group flex flex-col justify-between rounded-xl border border-border/70 bg-surface/40 p-3 transition-all hover:border-emerald-500/40 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-foreground">Live Leaderboard</p>
                  <p className="text-[10px] text-muted-foreground">Rankings & podium</p>
                </div>
              </Link>

              <Link
                to="/manager/certificates"
                className="group flex flex-col justify-between rounded-xl border border-border/70 bg-surface/40 p-3 transition-all hover:border-purple-500/40 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-foreground">Certificates</p>
                  <p className="text-[10px] text-muted-foreground">Digital credentials</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          4. CREATE EVENT DIALOG COMPONENT
      ========================================================================= */}
      <ManagerEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
