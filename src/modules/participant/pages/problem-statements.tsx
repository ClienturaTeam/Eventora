import { useState, useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
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
import { Loader2, FileCode, CheckCircle2, Lock, AlertTriangle, Info, HelpCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function ParticipantProblemStatementsPage() {
  const search = useSearch({ strict: false }) as { eventId?: string };
  const { data: registrations = [], isLoading: loadingRegistrations } = useMyRegistrations();
  const { data: teams = [], isLoading: loadingTeams } = useMyTeams();
  const selectMutation = useSelectProblemStatement();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [confirmStatement, setConfirmStatement] = useState<any>(null);
  const [viewDetailStatement, setViewDetailStatement] = useState<any>(null);

  // Filter registrations for approved/confirmed events
  const approvedRegistrations = useMemo(() => {
    if (!registrations || !Array.isArray(registrations)) return [];
    return registrations.filter((r: any) =>
      ["APPROVED", "REGISTERED", "PAID", "CONFIRMED"].includes(r.status?.toUpperCase())
    );
  }, [registrations]);

  // Aggregate eligible events from approved registrations
  const eligibleEvents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; status: string }>();
    approvedRegistrations.forEach((r: any) => {
      const evt = r.event;
      if (evt && evt.id && !map.has(evt.id)) {
        map.set(evt.id, {
          id: evt.id,
          name: evt.name || evt.title || "Event",
          status: r.status || "APPROVED",
        });
      }
    });
    return Array.from(map.values());
  }, [approvedRegistrations]);

  // Determine if user has a team with a locked problem statement
  const teamWithLockedPS = useMemo(() => {
    if (!teams || !Array.isArray(teams)) return null;
    return teams.find((t: any) => t.team?.problemStatementLocked || t.team?.problemStatementId);
  }, [teams]);

  const lockedEventId = teamWithLockedPS?.team?.competition?.eventId || null;

  // Active selected event ID priority:
  // 1. Explicit user dropdown selection
  // 2. Search query parameter from navigation
  // 3. Event with locked problem statement
  // 4. First eligible approved event
  const activeEventId = useMemo(() => {
    if (selectedEventId && eligibleEvents.some((e) => e.id === selectedEventId)) {
      return selectedEventId;
    }
    if (search.eventId && eligibleEvents.some((e) => e.id === search.eventId)) {
      return search.eventId;
    }
    if (lockedEventId && eligibleEvents.some((e) => e.id === lockedEventId)) {
      return lockedEventId;
    }
    return eligibleEvents[0]?.id || null;
  }, [selectedEventId, search.eventId, lockedEventId, eligibleEvents]);

  // Query problem statements for activeEventId
  const {
    data: statements = [],
    isLoading: loadingStatements,
    isError: isErrorStatements,
    refetch: refetchStatements,
  } = useProblemStatements(activeEventId);

  // Match team specifically for activeEventId
  const activeTeamMember = useMemo(() => {
    if (!teams || !activeEventId) return null;
    return teams.find((t: any) => t.team?.competition?.eventId === activeEventId) || null;
  }, [teams, activeEventId]);

  const activeTeam = activeTeamMember?.team;
  const isLocked = activeTeam?.problemStatementLocked || false;
  const selectedId = activeTeam?.problemStatementId || null;
  const selectedStatement = useMemo(() => {
    if (!selectedId) return null;
    return statements.find((s: any) => s.id === selectedId) || activeTeam?.problemStatement || null;
  }, [statements, selectedId, activeTeam]);

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

  if (loadingRegistrations || loadingTeams) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading events...</p>
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

      {eligibleEvents.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <h3 className="text-base font-bold text-foreground">No approved events available.</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              You do not currently have an approved registration for any event. Problem statement selection will open automatically once an organizer approves your event registration.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Top Event Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">
                SELECT EVENT:
              </label>
              <Select
                value={activeEventId || ""}
                onValueChange={(val) => setSelectedEventId(val)}
              >
                <SelectTrigger className="w-[280px] text-xs font-semibold">
                  <SelectValue placeholder="[ Select an event ▼ ]" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEvents.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLocked && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 px-3 py-1 text-xs gap-1.5 font-semibold">
                <Lock className="h-3.5 w-3.5" /> Selection Locked
              </Badge>
            )}
          </div>

          {/* Selected Problem Statement Banner */}
          {selectedStatement && (
            <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> SELECTED PROBLEM STATEMENT
                  </div>
                  <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600/30 text-xs font-semibold gap-1">
                    <Lock className="h-3.5 w-3.5" /> 🔒 Selection permanently locked
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
                <div className="p-2.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>Problem statement selection is permanently locked.</span>
                </div>

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

          {/* Available Problem Statements Roster */}
          {activeEventId && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" /> Available Problem Statements ({statements.length})
              </h3>

              {loadingStatements ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 border rounded-lg bg-card">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">Loading problem statements...</p>
                </div>
              ) : isErrorStatements ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 border rounded-lg bg-card text-center px-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">Unable to load problem statements. Please try again.</p>
                  <Button size="sm" variant="outline" onClick={() => refetchStatements()} className="text-xs gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                </div>
              ) : statements.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border rounded-lg bg-card p-6">
                  <HelpCircle className="mx-auto h-8 w-8 opacity-40 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No problem statements have been configured for this event yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Organizers will release problem statements prior to event start.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statements.map((statement: any) => {
                    const isSelectedThis = selectedId === statement.id;
                    const roundsList = statement.applicableRounds || [];

                    return (
                      <Card
                        key={statement.id}
                        className={`flex flex-col justify-between transition-all ${
                          isSelectedThis
                            ? "border-emerald-500 bg-emerald-500/5 shadow-md"
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
                            <Button disabled size="sm" className="flex-1 bg-emerald-600 text-white gap-1.5 text-xs font-semibold">
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
          )}
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

      {/* Selection Confirmation Modal */}
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
