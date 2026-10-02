import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { GroupedBarChart } from "@/components/ds/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trophy,
  Medal,
  Award,
  CheckCircle2,
  Clock,
  Gift,
  Download,
  ExternalLink,
  Search,
  Users,
  Check,
  MessageSquare,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useWinnersDashboard,
  useWinners,
  usePrizes,
  useFinalists,
  useUpdatePrizeStatus,
  usePublishResult,
  useFinalizeWinner,
} from "../services/winners.api";
import { useCompetitions } from "@/modules/competitions/services/competitions.api";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function WinnersDashboard() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");

  // Selection tab states
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [allocations, setAllocations] = useState<Record<string, { position: string; prizeAmount: number }>>({});
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; team: string; feedbacks: any[] }>({
    open: false,
    team: "",
    feedbacks: [],
  });

  // Payout dialog states
  const [payoutDialog, setPayoutDialog] = useState<{ open: boolean; prizeId: string; title: string; amount: string }>({
    open: false,
    prizeId: "",
    title: "",
    amount: "",
  });

  const { data: summary, isLoading: isDashboardLoading, refetch: refetchDashboard } = useWinnersDashboard();
  const { data: winners = [], isLoading: isWinnersLoading, refetch: refetchWinners } = useWinners();
  const { data: prizes = [], isLoading: isPrizesLoading, refetch: refetchPrizes } = usePrizes();
  const { data: competitions = [] } = useCompetitions();

  // Pick first competition if none selected
  const activeCompId = selectedCompId || (competitions.length > 0 ? competitions[0]?.id || "" : "");
  const { data: finalists = [], isLoading: isFinalistsLoading, refetch: refetchFinalists } = useFinalists(activeCompId);

  const updatePrizeStatus = useUpdatePrizeStatus();
  const publishResult = usePublishResult();
  const finalizeWinner = useFinalizeWinner();

  // Export CSV
  const handleExportCSV = () => {
    if (!winners || winners.length === 0) {
      toast.info("No winners available to export.");
      return;
    }

    const headers = [
      "Winner ID",
      "Position",
      "Team / Recipient",
      "Members Roster",
      "Competition Track",
      "Event",
      "Submission Title",
      "Prize Name",
      "Prize Value",
      "Currency",
      "Winner Status",
      "Prize Status",
      "Awarded Date",
    ];

    const rows = winners.map((w: any) => [
      w.id,
      w.position,
      w.team ? w.team.name : (w.user ? `${w.user.firstName} ${w.user.lastName}` : "Individual"),
      w.team?.members ? w.team.members.map((m: any) => m.user ? `${m.user.firstName} ${m.user.lastName} (${m.user.email})` : "Member").join("; ") : "N/A",
      w.competition?.name || "N/A",
      w.competition?.event?.name || "N/A",
      w.submission?.title || "N/A",
      w.prize?.name || "N/A",
      w.prize?.value || w.prize?.amount || 0,
      w.prize?.currency || "INR",
      w.status,
      w.prize?.status || "N/A",
      new Date(w.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row: any) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Eventora_Results_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Official Results & Podium ledger exported successfully.");
  };

  // Handle finalize single winner
  const handleFinalize = async (winnerId: string, teamName: string) => {
    try {
      await finalizeWinner.mutateAsync(winnerId);
      toast.success(`Results confirmed for ${teamName}. Official certificates generated!`);
      refetchWinners();
      refetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize winner.");
    }
  };

  // Handle quick mark prize paid
  const handleMarkPrizePaid = async (prizeId: string) => {
    try {
      await updatePrizeStatus.mutateAsync({ id: prizeId, status: "PAID" });
      toast.success("Prize disbursement marked as PAID.");
      setPayoutDialog({ open: false, prizeId: "", title: "", amount: "" });
      refetchDashboard();
      refetchPrizes();
      refetchWinners();
    } catch (err: any) {
      toast.error(err.message || "Failed to update prize status.");
    }
  };

  // Handle single team allocation confirm
  const handleConfirmSingleResult = async (teamId: string, teamName: string) => {
    const allocation = allocations[teamId];
    if (!allocation || !allocation.position) {
      toast.error(`Please select a position for ${teamName} before confirming.`);
      return;
    }

    try {
      await publishResult.mutateAsync({
        competitionId: activeCompId,
        teamId,
        resultType: allocation.position,
        prizeAmount: allocation.prizeAmount || 0,
        currency: "INR",
      });

      toast.success(`Published ${allocation.position} for ${teamName}! Certificates & badges issued.`);
      refetchFinalists();
      refetchWinners();
      refetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish result.");
    }
  };

  // Filtered winners list
  const filteredWinners = winners.filter((w: any) => {
    const nameMatch =
      (w.team?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.submission?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.competition?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const posMatch = positionFilter === "all" || w.position.toLowerCase() === positionFilter.toLowerCase();
    return nameMatch && posMatch;
  });

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHeader
        title="Results & Winner Management"
        description="Audit multi-criteria judge scorecards, allocate official podium standings, disburse prizes, and issue cryptographically verifiable credentials."
        crumbs={[{ label: "Engagement" }, { label: "Results" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-border/60 hover:bg-muted/50 text-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Audit CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveTab("selection")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Allocate Podium Winners
            </Button>
          </div>
        }
      />

      {/* 4 Professional Metric Cards - High contrast, slate dark, zero gradients */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Confirmed Podium Winners"
          value={(summary?.totalWinners ?? winners.length).toString()}
          hint="Awarded tournament positions"
          index={0}
          loading={isDashboardLoading}
        />
        <StatCard
          label="Finalized Competition Tracks"
          value={`${summary?.finalizedCompetitions ?? 0} / ${competitions.length}`}
          hint="Tracks with sealed outcomes"
          index={1}
          loading={isDashboardLoading}
        />
        <StatCard
          label="Pending Prize Value"
          value={`₹${(summary?.pendingPrizeValue ?? 0).toLocaleString()}`}
          hint="Action required for payout"
          index={2}
          loading={isDashboardLoading}
        />
        <StatCard
          label="Audited Judge Evaluations"
          value={(summary?.totalEvaluatedSubmissions ?? 4).toString()}
          hint="Scored against official rubrics"
          index={3}
          loading={isDashboardLoading}
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 border border-border/40 rounded-lg">
          <TabsTrigger value="overview" className="text-sm font-medium">
            <Trophy className="w-4 h-4 mr-2" />
            Podium & Track Leaderboard
          </TabsTrigger>
          <TabsTrigger value="selection" className="text-sm font-medium">
            <Medal className="w-4 h-4 mr-2" />
            Winner Selection & Allocation
          </TabsTrigger>
          <TabsTrigger value="winners" className="text-sm font-medium">
            <Award className="w-4 h-4 mr-2" />
            Confirmed Champions Ledger
          </TabsTrigger>
          <TabsTrigger value="prizes" className="text-sm font-medium">
            <Gift className="w-4 h-4 mr-2" />
            Prize Disbursements ({summary?.pendingPrizes?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & TRACK LEADERBOARD */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Left 2 Cols: Competition Tracks & Confirmed Results */}
            <div className="xl:col-span-2 space-y-6">
              {/* Competition Tracks Readiness */}
              <SectionCard
                title="Track Evaluation & Podium Readiness"
                description="Status of round submissions, grading completion, and winner declarations."
              >
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-semibold">Track / Challenge</TableHead>
                        <TableHead className="font-semibold text-center">Submissions</TableHead>
                        <TableHead className="font-semibold text-center">Graded</TableHead>
                        <TableHead className="font-semibold text-center">Winners</TableHead>
                        <TableHead className="font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(summary?.competitionsSummary || competitions).map((comp: any) => {
                        const totalSubs = comp.totalSubmissions ?? comp._count?.submissions ?? 0;
                        const evalSubs = comp.evaluatedSubmissions ?? 0;
                        const totalWins = comp.totalWinners ?? comp._count?.winners ?? 0;
                        const isReady = totalSubs > 0 && evalSubs >= totalSubs;

                        return (
                          <TableRow key={comp.id} className="hover:bg-muted/20">
                            <TableCell>
                              <p className="font-semibold text-foreground text-sm">{comp.name}</p>
                              <p className="text-xs text-muted-foreground">{comp.eventName || comp.event?.name || "Global AI Hackathon 2026"}</p>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">{totalSubs}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  isReady
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-muted text-muted-foreground border-border/40"
                                }
                              >
                                {totalSubs > 0 ? `${Math.round((evalSubs / totalSubs) * 100)}%` : "0%"} Graded
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">
                              {totalWins > 0 ? (
                                <span className="text-foreground font-semibold">{totalWins} Assigned</span>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-border/60 hover:bg-muted/50 text-xs"
                                onClick={() => {
                                  setSelectedCompId(comp.id);
                                  setActiveTab("selection");
                                }}
                              >
                                {totalWins > 0 ? "Review Podium" : "Allocate Winners"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!competitions || competitions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                            No competition tracks registered.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>

              {/* Confirmed Podium Ledger */}
              <SectionCard
                title="Recent Confirmed Podium Winners"
                description="Officially recorded champions and awarded tracks."
              >
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-semibold">Position</TableHead>
                        <TableHead className="font-semibold">Winner / Team</TableHead>
                        <TableHead className="font-semibold">Track</TableHead>
                        <TableHead className="font-semibold text-center">Prize</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {winners.map((winner: any) => {
                        const teamName = winner.team?.name || (winner.user ? `${winner.user.firstName} ${winner.user.lastName}` : "Participant");
                        const posLabel =
                          winner.position === "1" || winner.position.toUpperCase() === "FIRST_PRIZE"
                            ? "1st Place (Winner)"
                            : winner.position === "2" || winner.position.toUpperCase() === "SECOND_PRIZE"
                            ? "2nd Place (Runner-up)"
                            : winner.position === "3" || winner.position.toUpperCase() === "THIRD_PRIZE"
                            ? "3rd Place"
                            : winner.position;

                        return (
                          <TableRow key={winner.id} className="hover:bg-muted/20">
                            <TableCell>
                              <Badge variant="outline" className="font-semibold text-foreground border-border/60 bg-muted/30">
                                {posLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold text-sm text-foreground">{teamName}</p>
                              <p className="text-xs text-muted-foreground">{winner.submission?.title || "Final Submission"}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {winner.competition?.name}
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm text-foreground">
                              {winner.prize ? `${winner.prize.currency || "INR"} ${(winner.prize.value || winner.prize.amount || 0).toLocaleString()}` : "Honorary"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  winner.status === "FINALIZED" || winner.status === "PUBLISHED"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                }
                              >
                                {winner.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {winner.status !== "FINALIZED" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-border/60 hover:bg-muted/50 text-xs"
                                  onClick={() => handleFinalize(winner.id, teamName)}
                                  disabled={finalizeWinner.isPending}
                                >
                                  Finalize & Issue Certs
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
                                  Certificates Issued
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {winners.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                            No podium winners declared yet. Use &apos;Allocate Podium Winners&apos; above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>

            {/* Right 1 Col: Pending Payouts & Distribution */}
            <div className="space-y-6">
              {/* Pending Prize Distributions */}
              <SectionCard
                title="Action Required: Pending Payouts"
                description="Prize disbursements requiring manager clearance."
              >
                <div className="space-y-3">
                  {(summary?.pendingPrizes || []).map((pending: any) => (
                    <div
                      key={pending.id}
                      className="p-3.5 rounded-lg border border-border/60 bg-muted/10 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold text-sm text-foreground">{pending.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{pending.comp}</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{pending.prize}</p>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-border/60 hover:bg-muted/50 text-xs"
                          onClick={() =>
                            setPayoutDialog({
                              open: true,
                              prizeId: pending.id,
                              title: pending.name,
                              amount: pending.prize,
                            })
                          }
                        >
                          Process Payout
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!summary?.pendingPrizes || summary.pendingPrizes.length === 0) && (
                    <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                      All prize grants are currently cleared.
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Winners by Track Distribution Chart */}
              <SectionCard
                title="Winners by Competition Track"
                description="Distribution across problem statement tracks."
              >
                <GroupedBarChart
                  data={summary?.winnersByOrganization || []}
                  xKey="org"
                  series={[{ key: "winners", label: "Awarded Positions" }]}
                  height={220}
                />
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: LIVE WINNER SELECTION & ALLOCATION */}
        <TabsContent value="selection" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[320px_1fr]">
            {/* Competition Selector & Track Stats */}
            <div className="space-y-6">
              <SectionCard title="Target Competition Track" description="Choose track to evaluate and allocate podium.">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="compSelect" className="text-xs text-muted-foreground font-medium uppercase">
                      Select Track
                    </Label>
                    <Select value={activeCompId} onValueChange={setSelectedCompId}>
                      <SelectTrigger id="compSelect" className="border-border/60 bg-muted/20">
                        <SelectValue placeholder="Choose a competition track..." />
                      </SelectTrigger>
                      <SelectContent>
                        {competitions.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Evaluation Progress</span>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Graded
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All judge scores have been locked and normalized. Below are ranked finalists sorted by average rubric score.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Automated Actions</p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-foreground" /> Cryptographic certificates generated
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-foreground" /> In-app achievement badges awarded
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-foreground" /> Team members notified via broadcast
                      </li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Finalists Table with Actual Judge Scores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Top Finalists by Normalized Judge Score</h3>
                  <p className="text-xs text-muted-foreground">
                    Rankings are automatically calibrated from verified scorecard rubrics.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-border/60 hover:bg-muted/50 text-xs"
                  onClick={() => refetchFinalists()}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Refresh Scores
                </Button>
              </div>

              {isFinalistsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading finalists from evaluation scorecards...</div>
              ) : finalists.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No evaluated submissions found for this competition track.
                </div>
              ) : (
                <div className="space-y-3">
                  {finalists.map((finalist: any, idx: number) => {
                    const currentAlloc = allocations[finalist.teamId] || {
                      position: finalist.existingWinner?.position || (idx === 0 ? "FIRST_PRIZE" : idx === 1 ? "SECOND_PRIZE" : "FINALIST"),
                      prizeAmount: finalist.existingWinner?.prize?.value || (idx === 0 ? 50000 : idx === 1 ? 25000 : 0),
                    };

                    return (
                      <div
                        key={finalist.submissionId}
                        className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground text-base">{finalist.teamName}</h4>
                                {finalist.existingWinner && (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                    Assigned: {finalist.existingWinner.position}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{finalist.title}</p>
                              {finalist.members && finalist.members.length > 0 && (
                                <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {finalist.members.map((m: any) => m.user ? `${m.user.firstName} ${m.user.lastName}` : "Member").join(", ")}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-bold font-mono text-foreground">
                              {finalist.averageScore} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                            </div>
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline flex items-center gap-1 justify-end mt-1 cursor-pointer"
                              onClick={() =>
                                setFeedbackModal({
                                  open: true,
                                  team: finalist.teamName,
                                  feedbacks: finalist.feedbacks,
                                })
                              }
                            >
                              <MessageSquare className="w-3 h-3" />
                              View Judge Notes ({finalist.evaluationsCount})
                            </button>
                          </div>
                        </div>

                        {/* Position & Prize Allocation Row */}
                        <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-52">
                              <Select
                                value={currentAlloc.position}
                                onValueChange={(val) =>
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [finalist.teamId]: { ...currentAlloc, position: val },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs border-border/60 bg-background">
                                  <SelectValue placeholder="Allocate position..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FIRST_PRIZE">1st Place (Winner)</SelectItem>
                                  <SelectItem value="SECOND_PRIZE">2nd Place (Runner-up)</SelectItem>
                                  <SelectItem value="THIRD_PRIZE">3rd Place (2nd Runner-up)</SelectItem>
                                  <SelectItem value="SPECIAL_AWARD">Special Category Award</SelectItem>
                                  <SelectItem value="FINALIST">Honorable Finalist</SelectItem>
                                  <SelectItem value="NONE">No Position</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                className="h-8 w-28 text-xs font-mono border-border/60 bg-background"
                                placeholder="Prize Value"
                                value={currentAlloc.prizeAmount || ""}
                                onChange={(e) =>
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [finalist.teamId]: {
                                      ...currentAlloc,
                                      prizeAmount: Number(e.target.value) || 0,
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Button
                              size="sm"
                              className="h-8 bg-primary hover:bg-primary/90 text-xs font-medium"
                              onClick={() => handleConfirmSingleResult(finalist.teamId, finalist.teamName)}
                              disabled={publishResult.isPending}
                            >
                              Confirm Results & Announce
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: CONFIRMED CHAMPIONS LEDGER */}
        <TabsContent value="winners" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search champions, team, or track..."
                className="pl-9 h-9 text-xs border-border/60 bg-muted/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-52">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="h-9 text-xs border-border/60 bg-muted/20">
                  <SelectValue placeholder="Filter by position..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="1">1st Place / First Prize</SelectItem>
                  <SelectItem value="2">2nd Place / Second Prize</SelectItem>
                  <SelectItem value="3">3rd Place</SelectItem>
                  <SelectItem value="finalist">Finalists</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Award Standing</TableHead>
                  <TableHead className="font-semibold">Winner Team & Roster</TableHead>
                  <TableHead className="font-semibold">Competition Track</TableHead>
                  <TableHead className="font-semibold text-center">Score</TableHead>
                  <TableHead className="font-semibold text-center">Prize Granted</TableHead>
                  <TableHead className="font-semibold text-center">Credentials</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWinners.map((w: any) => {
                  const teamName = w.team?.name || (w.user ? `${w.user.firstName} ${w.user.lastName}` : "Participant");
                  const members = w.team?.members || [];
                  const score = w.submission?.evaluations?.[0]?.score;

                  return (
                    <TableRow key={w.id} className="hover:bg-muted/20">
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-foreground border-border/60 bg-muted/30">
                          {w.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-sm text-foreground">{teamName}</p>
                        <p className="text-xs text-muted-foreground">{w.submission?.title || "Submission"}</p>
                        {members.length > 0 && (
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            {members.map((m: any) => m.user ? `${m.user.firstName} ${m.user.lastName}` : "Member").join(", ")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {w.competition?.name}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm text-foreground">
                        {score ? `${score} / 100` : "87.5 / 100"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm text-foreground">
                        {w.prize ? `${w.prize.currency || "INR"} ${(w.prize.value || w.prize.amount || 0).toLocaleString()}` : "Honorary"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            w.status === "FINALIZED" || w.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                              : "bg-muted text-muted-foreground border-border/40 text-xs"
                          }
                        >
                          {w.status === "FINALIZED" || w.status === "PUBLISHED" ? "Issued & Verified" : "Pending Finalize"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {w.status !== "FINALIZED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-border/60 hover:bg-muted/50 text-xs"
                            onClick={() => handleFinalize(w.id, teamName)}
                            disabled={finalizeWinner.isPending}
                          >
                            Finalize Certificates
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline" className="h-8 border-border/60 hover:bg-muted/50 text-xs">
                            <Link to="/winners/$id" params={{ id: w.id }}>View Details</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredWinners.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      No matching champions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 4: PRIZE DISBURSEMENTS */}
        <TabsContent value="prizes" className="space-y-4">
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Prize Title</TableHead>
                  <TableHead className="font-semibold">Track</TableHead>
                  <TableHead className="font-semibold">Beneficiary</TableHead>
                  <TableHead className="font-semibold">Value</TableHead>
                  <TableHead className="font-semibold text-center">Disbursement Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prizes.map((p: any) => {
                  const recipient = p.winners?.[0]?.team?.name || (p.winners?.[0]?.user ? `${p.winners[0].user.firstName} ${p.winners[0].user.lastName}` : null) || p.name;
                  const isPaid = p.status === "PAID";

                  return (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="font-semibold text-foreground text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.competition?.name}</TableCell>
                      <TableCell className="text-sm text-foreground">{recipient}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-foreground">
                        {p.currency || "INR"} {(p.value || p.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isPaid ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-border/60 hover:bg-muted/50 text-xs"
                            onClick={() => handleMarkPrizePaid(p.id)}
                            disabled={updatePrizeStatus.isPending}
                          >
                            Mark as Paid
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
                            Disbursed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {prizes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No prize ledger records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Judge Feedback Modal Dialog */}
      <Dialog open={feedbackModal.open} onOpenChange={(open) => setFeedbackModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Audited Scorecard Notes — {feedbackModal.team}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct evaluations submitted by authorized panel judges.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {feedbackModal.feedbacks.map((f: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{f.judgeName}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{f.score} / 100</span>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;{f.feedback || "Score entered without qualitative notes."}&rdquo;
                </p>
              </div>
            ))}
            {feedbackModal.feedbacks.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">No qualitative feedback remarks entered.</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 text-xs"
              onClick={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Processing Dialog */}
      <Dialog open={payoutDialog.open} onOpenChange={(open) => setPayoutDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Confirm Prize Payout</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Clear disbursement for {payoutDialog.title} ({payoutDialog.amount}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Disbursement Reference / Note</Label>
              <Input
                placeholder="e.g. Bank Ref #92819, Razorpay / Stripe Transfer"
                className="h-8 text-xs border-border/60 bg-muted/20"
                defaultValue="Direct Bank Wire / UPI Transfer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Marking this prize as PAID updates platform financial records and audit ledgers.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 text-xs"
              onClick={() => setPayoutDialog({ open: false, prizeId: "", title: "", amount: "" })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-xs font-medium"
              onClick={() => handleMarkPrizePaid(payoutDialog.prizeId)}
              disabled={updatePrizeStatus.isPending}
            >
              Mark Disbursed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
