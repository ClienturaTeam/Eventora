import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ds/status-chip";
import { SubmissionDialog } from "@/modules/submissions/components/submission-dialog";
import { TeamDialog } from "@/modules/teams/components/team-dialog";
import {
  Users,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileCode2,
  Layers,
  Award,
  HelpCircle,
  Edit,
  Trash2,
  Lock,
  UserCheck,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export interface TeamDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  onDeleteSuccess?: () => void;
}

export function TeamDetailsDialog({
  open,
  onOpenChange,
  teamId,
  onDeleteSuccess,
}: TeamDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Fetch full team details from backend
  const { data: details, isLoading, refetch } = useQuery({
    queryKey: ["teamDetails", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const res = await fetchApi(`/teams/${teamId}/details`);
      return res.data;
    },
    enabled: !!teamId && open,
  });

  // Delete team mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/teams/${id}`, { method: "DELETE" });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Team deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["manager", "teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setConfirmDeleteOpen(false);
      onOpenChange(false);
      onDeleteSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete team");
      setConfirmDeleteOpen(false);
    },
  });

  if (!open) return null;

  const team = details?.team;
  const members = details?.members || [];
  const event = details?.event;
  const competition = details?.competition;
  const registration = details?.registration;
  const payment = details?.payment;
  const problemStatement = details?.problemStatement;
  const rounds = details?.rounds || [];
  const mentorQuestions = details?.mentorQuestions || [];
  const submissions = details?.submissions || [];

  const leadMember = members.find((m: any) => m.isLead) || members[0];
  const submittedRoundsCount = rounds.filter((r: any) => r.submission).length;
  const totalRoundsCount = rounds.length || 1;
  const evaluatedRoundsCount = rounds.filter(
    (r: any) => r.evaluations && r.evaluations.length > 0 && r.evaluations.some((e: any) => e.status === "COMPLETED")
  ).length;

  const handleViewSubmission = (sub: any) => {
    setSelectedSub(sub);
    setSubDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teamId) return;
    await deleteMutation.mutateAsync(teamId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="flex flex-row items-start justify-between pb-2 border-b">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {isLoading ? "Loading Team Details..." : team?.name || "Team Details"}
                </DialogTitle>
                {team && <Badge variant="outline">{team.currentRound ? `Round ${team.currentRound}` : "Active"}</Badge>}
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {competition?.name} • {event?.name || "Eventora Hackathon"}
              </DialogDescription>
            </div>

            {/* Admin / Manager Action Buttons */}
            {team && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Team
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Team
                </Button>
              </div>
            )}
          </DialogHeader>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading full team information from database...
            </div>
          ) : !details ? (
            <div className="py-12 text-center text-sm text-destructive">
              Team details could not be loaded.
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-muted/30 border rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Members</span>
                  <span className="text-lg font-bold text-foreground">{members.length}</span>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Registration</span>
                  <span className="text-xs font-bold text-emerald-600 block mt-1">
                    {registration?.status || "PENDING"}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Payment</span>
                  <span className="text-xs font-bold text-blue-600 block mt-1">
                    {payment?.status === "SUCCEEDED" || payment?.status === "PAID"
                      ? "PAID"
                      : event?.price === 0
                      ? "FREE EVENT"
                      : payment?.status || "NOT REQUIRED"}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Problem Statement</span>
                  <span className="text-xs font-bold text-indigo-600 block mt-1 truncate">
                    {problemStatement ? problemStatement.code : "NOT SELECTED"}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Submissions</span>
                  <span className="text-lg font-bold text-foreground">
                    {submittedRoundsCount} / {totalRoundsCount}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Evaluations</span>
                  <span className="text-lg font-bold text-foreground">
                    {evaluatedRoundsCount} / {submittedRoundsCount || 1}
                  </span>
                </div>
              </div>

              {/* Multi-Tab Detailed Content */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/40">
                  <TabsTrigger value="overview" className="text-xs py-1.5">Overview</TabsTrigger>
                  <TabsTrigger value="registration" className="text-xs py-1.5">Registration & Payment</TabsTrigger>
                  <TabsTrigger value="problem" className="text-xs py-1.5">Problem Statement</TabsTrigger>
                  <TabsTrigger value="rounds" className="text-xs py-1.5">Round Progress</TabsTrigger>
                  <TabsTrigger value="evaluations" className="text-xs py-1.5">Evaluations</TabsTrigger>
                  <TabsTrigger value="qa" className="text-xs py-1.5">Mentor Q&A</TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW & MEMBERS */}
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Team Overview Card */}
                    <Card>
                      <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          Team Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2 text-xs">
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Team Name:</span>
                          <span className="col-span-2 font-semibold text-foreground">{team?.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Team ID:</span>
                          <span className="col-span-2 font-mono text-muted-foreground text-[11px] truncate">{team?.id}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Competition:</span>
                          <span className="col-span-2 font-medium text-foreground">{competition?.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Organization:</span>
                          <span className="col-span-2 font-medium text-foreground">{event?.organization?.name || "Eventora"}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Created On:</span>
                          <span className="col-span-2 text-foreground">{new Date(team?.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Team Lead:</span>
                          <span className="col-span-2 font-semibold text-primary">
                            {leadMember ? (leadMember.name || `${leadMember.user?.firstName || ''} ${leadMember.user?.lastName || ''}`) : "Not assigned"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Lead Email:</span>
                          <span className="col-span-2 text-foreground">{leadMember?.email || leadMember?.user?.email || "N/A"}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Event & Track Info Card */}
                    <Card>
                      <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Event & Track Context
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2 text-xs">
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Event Name:</span>
                          <span className="col-span-2 font-semibold text-foreground">{event?.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Event Status:</span>
                          <span className="col-span-2"><Badge variant="outline">{event?.status}</Badge></span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Registration Fee:</span>
                          <span className="col-span-2 font-semibold text-emerald-600">
                            {event?.price === 0 ? "Free Event" : `₹${event?.price}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">Start Date:</span>
                          <span className="col-span-2 text-foreground">{event?.startTime ? new Date(event.startTime).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-muted-foreground font-medium">End Date:</span>
                          <span className="col-span-2 text-foreground">{event?.endTime ? new Date(event.endTime).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Members Table */}
                  <Card>
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Team Members ({members.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="p-3 font-semibold text-muted-foreground">Member Name</th>
                              <th className="p-3 font-semibold text-muted-foreground">Email</th>
                              <th className="p-3 font-semibold text-muted-foreground">Role</th>
                              <th className="p-3 font-semibold text-muted-foreground">User ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {members.map((m: any) => (
                              <tr key={m.id} className="hover:bg-muted/20">
                                <td className="p-3 font-medium text-foreground">
                                  {m.name || `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim() || 'Participant'}
                                </td>
                                <td className="p-3 text-muted-foreground">{m.email || m.user?.email || 'N/A'}</td>
                                <td className="p-3">
                                  {m.isLead ? (
                                    <Badge className="bg-primary text-primary-foreground text-[10px]">Team Lead</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px]">Member</Badge>
                                  )}
                                </td>
                                <td className="p-3 font-mono text-[10px] text-muted-foreground">{m.userId || m.id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 2: REGISTRATION & PAYMENT */}
                <TabsContent value="registration" className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Registration Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span className="text-muted-foreground">Registration Status:</span>
                          <Badge variant={registration?.status === "APPROVED" ? "default" : "outline"} className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            {registration?.status || "APPROVED"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Registered Date:</span>
                          <span className="font-medium text-foreground">
                            {registration?.createdAt ? new Date(registration.createdAt).toLocaleString() : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Registration ID:</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{registration?.id || "REG-AUTO-LINKED"}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-500" />
                          Payment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span className="text-muted-foreground">Payment Status:</span>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                            {payment?.status === "SUCCEEDED" || payment?.status === "PAID"
                              ? "✓ PAID"
                              : event?.price === 0
                              ? "NOT REQUIRED — FREE EVENT"
                              : payment?.status || "NOT REQUIRED"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Event Fee:</span>
                          <span className="font-bold text-foreground">
                            {event?.price === 0 ? "₹0 (Free)" : `₹${event?.price}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Payment Amount:</span>
                          <span className="font-bold text-emerald-600">
                            {payment?.amount ? `₹${payment.amount}` : event?.price === 0 ? "₹0" : "₹0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Transaction ID:</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {payment?.stripePaymentId || payment?.id || "N/A (Free Event)"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* TAB 3: PROBLEM STATEMENT */}
                <TabsContent value="problem" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-indigo-500" />
                        Selected Problem Statement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs">
                      {problemStatement ? (
                        <>
                          <div className="flex items-center justify-between">
                            <Badge variant="default" className="text-xs px-2.5 py-0.5">
                              {problemStatement.code}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                              ✓ Permanently Selected
                            </Badge>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{problemStatement.title}</h4>
                            <p className="text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                              {problemStatement.description}
                            </p>
                          </div>
                          <div className="pt-2 border-t grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>
                              <span>Category:</span> <span className="font-medium text-foreground">{problemStatement.category || "General"}</span>
                            </div>
                            <div>
                              <span>Selected On:</span> <span className="font-medium text-foreground">{team?.problemStatementSelectedAt ? new Date(team.problemStatementSelectedAt).toLocaleDateString() : "N/A"}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground italic">
                          No problem statement selected yet by this team.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 4: ROUND PROGRESS & SUBMISSIONS */}
                <TabsContent value="rounds" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    {rounds.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No event rounds configured yet.
                      </div>
                    ) : (
                      rounds.map((rp: any) => {
                        const round = rp.round;
                        const sub = rp.submission;
                        return (
                          <Card key={round.id} className="border">
                            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-blue-500" />
                                  Round {round.roundNumber} — {round.name}
                                </CardTitle>
                                {round.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{round.description}</p>
                                )}
                              </div>
                              <Badge variant={sub ? "default" : "outline"}>
                                {sub ? "SUBMITTED" : "NOT SUBMITTED"}
                              </Badge>
                            </CardHeader>

                            <CardContent className="p-4 text-xs space-y-3">
                              {sub ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-bold text-sm text-foreground">{sub.title}</span>
                                    <div className="flex items-center gap-2">
                                      {sub.isLocked && (
                                        <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                                          <Lock className="w-3 h-3 text-amber-500" /> Locked
                                        </Badge>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => handleViewSubmission(sub)}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        View Submission Details
                                      </Button>
                                    </div>
                                  </div>

                                  {sub.payload && (
                                    <p className="text-muted-foreground line-clamp-2">
                                      {String(sub.payload.description || sub.payload.abstract || JSON.stringify(sub.payload))}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t">
                                    <span>Submitted: {new Date(sub.createdAt).toLocaleString()}</span>
                                    <span>Files: {sub.files?.length || 0}</span>
                                    <span>Submission ID: <code className="font-mono">{sub.id}</code></span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground italic py-2">
                                  No submission made for Round {round.roundNumber} yet.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                {/* TAB 5: EVALUATIONS & JUDGES */}
                <TabsContent value="evaluations" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    {rounds.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">No evaluation rounds found.</div>
                    ) : (
                      rounds.map((rp: any) => {
                        const round = rp.round;
                        const sub = rp.submission;
                        const evals = rp.evaluations || [];
                        const judges = rp.judgeAssignments || [];

                        return (
                          <Card key={round.id}>
                            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" />
                                Round {round.roundNumber} Evaluation Context
                              </CardTitle>
                              <span className="text-xs text-muted-foreground">Max Marks: {round.maxMarks || 100}</span>
                            </CardHeader>
                            <CardContent className="p-4 text-xs space-y-3">
                              {/* Judge Assignments */}
                              <div>
                                <span className="font-semibold text-muted-foreground block mb-1">Assigned Judges:</span>
                                {judges.length === 0 ? (
                                  <span className="text-muted-foreground italic">No judges assigned yet for this round.</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {judges.map((j: any) => (
                                      <Badge key={j.id} variant="secondary" className="text-xs">
                                        <UserCheck className="w-3 h-3 mr-1 text-blue-500" />
                                        {j.judge?.firstName} {j.judge?.lastName} ({j.judge?.email})
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Evaluation Results */}
                              <div className="pt-2 border-t">
                                <span className="font-semibold text-muted-foreground block mb-2">Evaluations ({evals.length}):</span>
                                {evals.length === 0 ? (
                                  <div className="text-muted-foreground italic">Evaluation Pending for Round {round.roundNumber}.</div>
                                ) : (
                                  <div className="space-y-2">
                                    {evals.map((ev: any) => (
                                      <div key={ev.id} className="p-3 bg-muted/30 border rounded-lg space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-foreground">
                                            Judge: {ev.judge ? `${ev.judge.firstName || ''} ${ev.judge.lastName || ''}`.trim() || ev.judge.email : 'Judge'}
                                          </span>
                                          <span className="font-mono font-bold text-primary text-sm">
                                            {ev.score !== null ? `${ev.score} / ${round.maxMarks || 100}` : 'Pending Score'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={ev.status === "COMPLETED" ? "secondary" : "outline"}>{ev.status}</Badge>
                                          {ev.recommendation && (
                                            <Badge variant={ev.recommendation === "QUALIFY" ? "default" : "destructive"}>{ev.recommendation}</Badge>
                                          )}
                                        </div>
                                        {ev.feedback && (
                                          <p className="text-muted-foreground pt-1 italic">"{ev.feedback}"</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                {/* TAB 6: MENTOR Q&A */}
                <TabsContent value="qa" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        Mentor Q&A / Doubts ({mentorQuestions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs">
                      {mentorQuestions.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground italic">
                          No mentor questions submitted by this team yet.
                        </div>
                      ) : (
                        mentorQuestions.map((q: any) => (
                          <div key={q.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{q.subject || "Mentor Question"}</span>
                              <Badge variant={q.status === "ANSWERED" ? "default" : "outline"}>{q.status}</Badge>
                            </div>
                            <p className="text-muted-foreground">{q.question}</p>
                            {q.replies && q.replies.length > 0 && (
                              <div className="mt-2 pt-2 border-t space-y-1 bg-muted/20 p-2 rounded">
                                <span className="font-semibold text-primary block">Mentor Replies ({q.replies.length}):</span>
                                {q.replies.map((rep: any) => (
                                  <p key={rep.id} className="text-foreground">
                                    <strong>{rep.sender?.firstName || "Mentor"}:</strong> {rep.message}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submission Detail Modal */}
      {selectedSub && (
        <SubmissionDialog
          open={subDialogOpen}
          onOpenChange={setSubDialogOpen}
          submission={selectedSub}
        />
      )}

      {/* Edit Team Modal */}
      {team && (
        <TeamDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          team={team}
        />
      )}

      {/* Confirm Delete Modal */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              <DialogTitle className="text-lg font-bold">Delete Team Confirmation</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              Are you sure you want to delete team <strong>"{team?.name}"</strong>?
              <br /><br />
              This action will check dependent records. If the team has active submissions or evaluations, deletion will be safely blocked to preserve audit integrity.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
