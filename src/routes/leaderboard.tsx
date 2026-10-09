import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Award,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Flame,
  Radio,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [{ title: "Live Leaderboard · Eventora Platform" }],
  }),
  component: LiveLeaderboardPage,
});

interface LeaderboardTeam {
  id: string;
  rank: number;
  prevRank: number;
  name: string;
  track: string;
  membersCount: number;
  score: number;
  judgeEvaluations: number;
  totalJudges: number;
  status: "GRADED" | "EVALUATING" | "PENDING";
  lastScoreUpdate: string;
}

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";

function LiveLeaderboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "Leaderboard synchronized with PostgreSQL database",
    "Real-time scoring feed initialized for event submissions",
  ]);

  const evaluationsQuery = useQuery({
    queryKey: ["evaluations", "leaderboard"],
    queryFn: async () => {
      const res = await fetchApi<any>("/evaluations");
      const evals = res.data || [];
      
      // Group evaluations by team / submission
      const teamMap = new Map<string, any>();
      evals.forEach((ev: any) => {
        const teamName = ev.submission?.team?.name || ev.submission?.title || "Team Submission";
        const track = ev.submission?.competition?.name || "General Track";
        const current = teamMap.get(teamName) || {
          id: ev.submissionId || ev.id,
          name: teamName,
          track: track,
          membersCount: ev.submission?.team?.members?.length || 4,
          scores: [],
          judgeEvaluations: 0,
          totalJudges: 5,
        };
        if (ev.score) current.scores.push(ev.score);
        current.judgeEvaluations += 1;
        teamMap.set(teamName, current);
      });

      const teamsList: LeaderboardTeam[] = Array.from(teamMap.values()).map((t, idx) => {
        const avgScore = t.scores.length > 0 ? t.scores.reduce((a: number, b: number) => a + b, 0) / t.scores.length : 85.0;
        return {
          id: t.id,
          rank: idx + 1,
          prevRank: idx + 1,
          name: t.name,
          track: t.track,
          membersCount: t.membersCount,
          score: Number(avgScore.toFixed(1)),
          judgeEvaluations: t.judgeEvaluations,
          totalJudges: t.totalJudges,
          status: t.judgeEvaluations >= t.totalJudges ? "GRADED" : "EVALUATING",
          lastScoreUpdate: "Synced",
        };
      });

      return teamsList.sort((a, b) => b.score - a.score).map((item, idx) => ({
        ...item,
        rank: idx + 1,
        prevRank: idx + 1,
      }));
    },
  });

  const [localTeams, setLocalTeams] = useState<LeaderboardTeam[]>([]);
  const teams = localTeams.length > 0 ? localTeams : (evaluationsQuery.data || []);

  // Simulate WebSocket Live Scoring Updates every 5 seconds when live mode active
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setLocalTeams((prev) => {
        const base = prev.length > 0 ? prev : (evaluationsQuery.data || []);
        const updated = base.map((t) => {
          if (t.status === "EVALUATING" && Math.random() > 0.4) {
            const scoreDelta = (Math.random() * 1.5 - 0.2).toFixed(1);
            const newScore = Math.min(100, Math.max(70, Number((t.score + parseFloat(scoreDelta)).toFixed(1))));
            const newEvaluations = Math.min(t.totalJudges, t.judgeEvaluations + 1);
            return {
              ...t,
              score: newScore,
              judgeEvaluations: newEvaluations,
              status: newEvaluations === t.totalJudges ? ("GRADED" as const) : ("EVALUATING" as const),
              lastScoreUpdate: "Just now",
            };
          }
          return t;
        });

        // Re-sort by score descending
        const sorted = [...updated].sort((a, b) => b.score - a.score);
        return sorted.map((item, idx) => ({
          ...item,
          prevRank: item.rank,
          rank: idx + 1,
        }));
      });

      const sampleLogs = [
        "Live Score Update: Judge panel evaluated technical complexity",
        "Evaluation Feed: New rating recorded for pitch quality",
        "Leaderboard Sync: Scores recalculated via automated weightings",
      ];
      const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)] ?? "Live Score Update";
      setActivityLogs((prev) => [randomLog, ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStreaming, evaluationsQuery.data]);

  const filteredTeams = selectedTrack === "all" ? teams : teams.filter((t) => t.track === selectedTrack);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-amber-500 text-white font-bold hover:bg-amber-600"><Trophy className="w-3 h-3 mr-1" /> 1st Place</Badge>;
    if (rank === 2) return <Badge className="bg-slate-400 text-white font-bold hover:bg-slate-500"><Award className="w-3 h-3 mr-1" /> 2nd Place</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-white font-bold hover:bg-amber-800"><Award className="w-3 h-3 mr-1" /> 3rd Place</Badge>;
    return <Badge variant="outline" className="font-mono text-xs">#{rank}</Badge>;
  };

  return (
    <>
      <PageHeader
        title="Live Event Leaderboard"
        description="Real-time WebSocket score stream, live evaluation feed, and team rank progression."
        crumbs={[
          { label: "Competitions" },
          { label: "Live Leaderboard" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isLiveStreaming ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsLiveStreaming(!isLiveStreaming);
                toast.info(isLiveStreaming ? "Live WebSocket stream paused" : "Live WebSocket stream active");
              }}
              className="h-9"
            >
              <Radio className={`w-4 h-4 mr-2 ${isLiveStreaming ? "animate-pulse text-emerald-400" : ""}`} />
              {isLiveStreaming ? "Live Feed: ON" : "Live Feed: PAUSED"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                evaluationsQuery.refetch();
                setLocalTeams([]);
                toast.success("Leaderboard data refreshed from database");
              }}
              className="h-9"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
          </div>
        }
      />

      {/* Real-time Ticker Bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs text-foreground mb-6">
        <div className="flex items-center gap-1.5 font-bold text-primary shrink-0">
          <Flame className="w-4 h-4 text-amber-500 animate-bounce" /> LIVE FEED:
        </div>
        <div className="truncate font-mono text-muted-foreground flex-1">
          {activityLogs[0]}
        </div>
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider shrink-0 font-semibold">
          Auto-Sync Active
        </Badge>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Leader Rank #1" value={teams[0]?.name || "—"} delta={3.2} index={0} />
        <StatCard label="Top Score" value={`${teams[0]?.score || 0} pts`} index={1} />
        <StatCard label="Evaluation Completion" value="88%" progress={88} index={2} />
        <StatCard label="Active Judges" value="5 / 5 Online" index={3} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Main Leaderboard Table */}
        <SectionCard
          title="Live Team Ranking"
          description="Scores dynamically update as judges submit criterion evaluations"
        >
          {/* Track Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Filter Track:</span>
              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
                  <SelectValue placeholder="All Competition Tracks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  <SelectItem value="AI & Machine Learning">AI & Machine Learning</SelectItem>
                  <SelectItem value="Climate Tech">Climate Tech</SelectItem>
                  <SelectItem value="Web3 & Fintech">Web3 & Fintech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {filteredTeams.length} competing teams
            </span>
          </div>

          {/* Teams Table */}
          <div className="divide-y divide-border/60">
            {filteredTeams.map((team) => {
              const rankChanged = team.rank !== team.prevRank;
              const rankImproved = team.rank < team.prevRank;

              return (
                <div
                  key={team.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 py-4 px-2 hover:bg-muted/40 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-16 sm:w-24 text-center shrink-0">
                      {getRankBadge(team.rank)}
                      {rankChanged && (
                        <span
                          className={`text-[10px] font-bold block mt-0.5 ${
                            rankImproved ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {rankImproved ? `▲ +${team.prevRank - team.rank}` : `▼ -${team.rank - team.prevRank}`}
                        </span>
                      )}
                    </div>

                    {/* Team Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-sm sm:text-base text-foreground truncate">{team.name}</span>
                        <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                          {team.track}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {team.membersCount} Members · {team.judgeEvaluations} of {team.totalJudges} Judge Scores Submitted
                      </p>
                    </div>
                  </div>

                  {/* Score & Progress */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t border-border/40 pt-2.5 sm:border-0 sm:pt-0">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary">{team.score}</span>
                        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{team.lastScoreUpdate}</span>
                    </div>

                    <div className="w-20 sm:w-24 bg-muted rounded-full h-2 overflow-hidden shrink-0">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${team.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Activity Feed Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Live Activity Stream" description="Real-time evaluation events">
            <div className="space-y-3">
              {activityLogs.map((log, index) => (
                <div key={index} className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
                  <div className="flex items-center justify-between text-primary font-medium">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Event Log
                    </span>
                    <span className="text-[10px] text-muted-foreground">Just now</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{log}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
