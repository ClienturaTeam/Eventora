import { useState, useMemo } from "react";
import {
  useProblemStatements,
  useSelectProblemStatement,
  useMyTeams,
  useMyRegistrations,
} from "../hooks/participant.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ds/page-header";
import { Loader2, FileCode, CheckCircle2, Lock, AlertTriangle, ShieldCheck, Info, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export function ParticipantProblemStatementsPage() {
  const { data: statements = [], isLoading: loadingStatements } = useProblemStatements();
  const { data: teams = [], isLoading: loadingTeams } = useMyTeams();
  const { data: registrations = [], isLoading: loadingRegistrations } = useMyRegistrations();
  const selectMutation = useSelectProblemStatement();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [confirmStatement, setConfirmStatement] = useState<any>(null);
  const [viewDetailStatement, setViewDetailStatement] = useState<any>(null);

  // Filter registrations for approved/confirmed events
  const approvedRegistrations = useMemo(() => {
    return registrations.filter((r: any) =>
      ["APPROVED", "REGISTERED", "PAID", "CONFIRMED"].includes(r.status?.toUpperCase())
    );
  }, [registrations]);

  // Active selected event ID (defaults to first approved event)
  const activeEventId = selectedEventId || approvedRegistrations[0]?.eventId || approvedRegistrations[0]?.event?.id || null;

  // Filter problem statements for active selected event (or return all if no event constraint)
  const filteredStatements = useMemo(() => {
    if (!activeEventId) return statements;
    return statements.filter((s: any) => !s.eventId || s.eventId === activeEventId);
  }, [statements, activeEventId]);

  // Match user's team specifically for the active event (or fallback to first team)
  const activeTeamMember = useMemo(() => {
    if (!teams || teams.length === 0) return null;
    if (activeEventId) {
      const match = teams.find((t: any) => t.team?.competition?.eventId === activeEventId);
      if (match) return match;
    }
    return teams[0];
  }, [teams, activeEventId]);

  const activeTeam = activeTeamMember?.team;
  const isLocked = activeTeam?.problemStatementLocked;
  const selectedId = activeTeam?.problemStatementId;
  const selectedStatement = statements.find((s: any) => s.id === selectedId) || activeTeam?.problemStatement;

  const handleSelect = async () => {
    if (!confirmStatement) return;
    try {
      await selectMutation.mutateAsync({
        problemStatementId: confirmStatement.id,
        teamId: activeTeam?.id,
      });
      toast.success(`Problem Statement ${confirmStatement.code} selected and locked!`);
      setConfirmStatement(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to select problem statement.");
    }
  };

  if (loadingStatements || loadingTeams || loadingRegistrations) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Problem Statements"
        description="View and select a problem statement for your approved event."
        crumbs={[{ label: "Participant" }, { label: "Problem Statements" }]}
      />

      {/* Approved Registrations Check & Event Selector */}
      {approvedRegistrations.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Registration Approval Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Problem statement selection is only available for participants with an <strong>APPROVED</strong> event registration.
            </p>
            <p>
              Your current registration status is <strong>PENDING</strong> or unverified. Once an organizer approves your registration, released problem statements for your event will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Event Selector if participant has approved registrations */}
          {approvedRegistrations.length > 1 && (
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg border shadow-sm">
              <label className="text-xs font-semibold text-foreground whitespace-nowrap">Select Event:</label>
              <Select value={activeEventId || ""} onValueChange={(val) => setSelectedEventId(val)}>
                <SelectTrigger className="w-[280px] text-xs">
                  <SelectValue placeholder="Choose event..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedRegistrations.map((reg: any) => (
                    <SelectItem key={reg.id} value={reg.eventId || reg.event?.id}>
                      {reg.event?.name || "Event"} ({reg.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Problem Statement Banner */}
          {selectedStatement && (
            <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> SELECTED PROBLEM STATEMENT
                  </div>
                  <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600/30 text-xs font-semibold gap-1">
                    <Lock className="h-3 w-3" /> 🔒 Selection permanently locked
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-foreground">
                <div className="flex items-center gap-2 font-mono font-bold text-base text-primary">
                  <span>{selectedStatement.code}</span>
                  <span>•</span>
                  <span>{selectedStatement.title}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{selectedStatement.description}</p>

                {/* Applicable Rounds Display */}
                <div className="pt-2 border-t flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">Applicable Rounds:</span>
                  {selectedStatement.applicableRounds && selectedStatement.applicableRounds.length > 0 ? (
                    selectedStatement.applicableRounds.map((r: any) => (
                      <Badge key={r.id} variant="secondary" className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] gap-1">
                        ✓ Round {r.roundNumber} — {r.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-[10px]">All Event Rounds</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Problem Statements Cards Roster */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" /> Available Problem Statements ({filteredStatements.length})
            </h3>

            {filteredStatements.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border rounded-lg bg-card">
                <HelpCircle className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="text-sm font-medium">No problem statements released for this event yet.</p>
                <p className="text-xs">Organizers will release problem statements prior to event start.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStatements.map((statement: any) => {
                  const isSelectedThis = selectedId === statement.id;
                  const roundsList = statement.applicableRounds || [];

                  return (
                    <Card
                      key={statement.id}
                      className={`flex flex-col justify-between transition-all ${
                        isSelectedThis
                          ? "border-primary bg-primary/5 shadow-md"
                          : isLocked
                          ? "opacity-60 border-border"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {statement.code}
                          </Badge>
                          {statement.category && (
                            <Badge variant="outline" className="text-[10px]">
                              {statement.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-bold leading-snug">{statement.title}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground line-clamp-3">
                          {statement.description}
                        </CardDescription>

                        {/* Applicable Rounds Pills */}
                        <div className="pt-2 flex flex-wrap gap-1">
                          {roundsList.length > 0 ? (
                            roundsList.map((r: any) => (
                              <Badge key={r.id} variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/5 text-blue-600 border-blue-500/20">
                                Round {r.roundNumber}: {r.name}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              All Rounds
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardFooter className="pt-3 border-t mt-auto flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setViewDetailStatement(statement)}
                        >
                          <Info className="h-3.5 w-3.5 mr-1.5" /> View Details
                        </Button>

                        {isSelectedThis ? (
                          <Button disabled size="sm" className="flex-1 bg-emerald-600 text-white gap-1.5 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={isLocked ? "outline" : "default"}
                            disabled={isLocked || selectMutation.isPending}
                            className="flex-1 text-xs"
                            onClick={() => setConfirmStatement(statement)}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="h-3.5 w-3.5 mr-1" /> Locked
                              </>
                            ) : (
                              "Select"
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* View Details Modal */}
      <Dialog open={!!viewDetailStatement} onOpenChange={(open) => !open && setViewDetailStatement(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {viewDetailStatement?.code}
              </Badge>
              {viewDetailStatement?.category && (
                <Badge variant="outline" className="text-[10px]">
                  {viewDetailStatement.category}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-base font-bold pt-1">{viewDetailStatement?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-foreground">Problem Description</span>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {viewDetailStatement?.description || "No full description provided."}
              </p>
            </div>

            {/* Applicable Rounds in Modal */}
            <div className="space-y-1.5 pt-2 border-t">
              <span className="font-semibold text-foreground">Applicable Rounds</span>
              <div className="flex flex-wrap gap-1.5">
                {viewDetailStatement?.applicableRounds && viewDetailStatement.applicableRounds.length > 0 ? (
                  viewDetailStatement.applicableRounds.map((r: any) => (
                    <Badge key={r.id} variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                      ✓ Round {r.roundNumber} — {r.name} ({r.maxMarks} Marks)
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-[10px]">All Event Rounds</Badge>
                )}
              </div>
            </div>

            {viewDetailStatement?.constraints && (
              <div className="space-y-1 pt-2 border-t">
                <span className="font-semibold text-foreground">Constraints & Guidelines</span>
                <p className="text-muted-foreground whitespace-pre-line">{viewDetailStatement.constraints}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setViewDetailStatement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={!!confirmStatement} onOpenChange={(open) => !open && setConfirmStatement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Permanent Selection
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs text-foreground">
              Are you sure you want to select <span className="font-bold text-primary">{confirmStatement?.code}: {confirmStatement?.title}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠️ Selection Locking Rule</p>
            <p>Once submitted, this problem statement selection becomes permanently locked for your team.</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmStatement(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={selectMutation.isPending}
              onClick={handleSelect}
            >
              {selectMutation.isPending ? "Locking..." : "Confirm & Lock Selection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
