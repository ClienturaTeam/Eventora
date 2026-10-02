import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useEvents, useEvent, useEventRounds, ApiEvent } from "@/modules/events/services/events.api";
import { useMyEvaluations } from "@/modules/judges/services/judges.api";
import { useJudgeProfile } from "@/modules/judges/hooks/use-judge-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Calendar,
  Clock,
  Eye,
  Layers,
  FileText,
  Users,
  Award,
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileCode,
  Tag,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/judge/events")({
  component: JudgeEventsPage,
});

function JudgeEventsPage() {
  const navigate = useNavigate();
  const { selectedProfileId } = useJudgeProfile();

  // Load events from database via existing backend API
  const { data: events = [], isLoading } = useEvents();

  // Load judge's assigned evaluations to identify events with assigned submissions
  const { data: evaluations = [] } = useMyEvaluations(selectedProfileId);

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  // Map assigned submissions count per event
  const assignedCountByEvent = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of evaluations) {
      const eId =
        ev.submission?.eventId ||
        ev.submission?.event?.id ||
        ev.submission?.competition?.eventId ||
        ev.submission?.competition?.event?.id;
      if (eId) {
        map.set(eId, (map.get(eId) || 0) + 1);
      }
    }
    return map;
  }, [evaluations]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Status filter
      if (statusFilter !== "ALL" && evt.status !== statusFilter) {
        return false;
      }

      // Start date filter (events starting on or after)
      if (startDateFilter) {
        const filterStart = new Date(startDateFilter).getTime();
        const eventStart = new Date(evt.startTime).getTime();
        if (eventStart < filterStart) return false;
      }

      // End date filter (events ending on or before)
      if (endDateFilter) {
        const filterEnd = new Date(endDateFilter).getTime() + 86400000; // end of selected day
        const eventEnd = new Date(evt.endTime).getTime();
        if (eventEnd > filterEnd) return false;
      }

      return true;
    });
  }, [events, statusFilter, startDateFilter, endDateFilter]);

  // Summary statistics
  const totalEvents = events.length;
  const publishedCount = events.filter(
    (e) => e.status === "PUBLISHED" || e.status === "LIVE"
  ).length;
  const assignedEventsCount = events.filter((e) =>
    assignedCountByEvent.has(e.id)
  ).length;

  const statsList = [
    { label: "Total Events", value: String(totalEvents) },
    { label: "Published & Live", value: String(publishedCount) },
    { label: "With Assigned Submissions", value: String(assignedEventsCount) },
  ];

  const resetFilters = () => {
    setStatusFilter("ALL");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || startDateFilter !== "" || endDateFilter !== "";

  // Details for modal
  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  return (
    <div className="space-y-4 p-6">
      {/* ─── SEARCH & FILTER CONTROLS BAR ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-muted/30 border rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Status:
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs min-w-[130px] bg-background">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem value="PUBLISHED" className="text-xs">
                  Published
                </SelectItem>
                <SelectItem value="LIVE" className="text-xs">
                  Live
                </SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">
                  Completed
                </SelectItem>
                <SelectItem value="DRAFT" className="text-xs">
                  Draft
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              From:
            </Label>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="h-8 text-xs w-[140px] bg-background"
            />
          </div>

          {/* End Date Filter */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              To:
            </Label>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="h-8 text-xs w-[140px] bg-background"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* ─── EVENTS TABLE ────────────────────────────────────────────────────── */}
      <ListPageTemplate<ApiEvent>
        title="Events & Competitions"
        description="View events and competitions created by your organization."
        crumbs={[{ label: "Judge" }, { label: "Events & Competitions" }]}
        stats={statsList}
        columns={[
          {
            key: "event",
            header: "EVENT",
            render: (row) => {
              const assignedCount = assignedCountByEvent.get(row.id) || 0;
              return (
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{row.name}</span>
                  </div>
                  {assignedCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 flex items-center gap-1 w-fit font-normal"
                    >
                      <CheckCircle className="w-2.5 h-2.5 text-primary" />
                      {assignedCount} Assigned Submission{assignedCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              );
            },
          },
          {
            key: "status",
            header: "STATUS",
            render: (row) => {
              let badgeColor = "bg-secondary text-secondary-foreground";
              if (row.status === "PUBLISHED" || row.status === "LIVE") {
                badgeColor = "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
              } else if (row.status === "COMPLETED") {
                badgeColor = "bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30";
              }
              return (
                <Badge className={`text-[11px] font-medium ${badgeColor}`}>
                  {row.status}
                </Badge>
              );
            },
          },
          {
            key: "startTime",
            header: "START DATE",
            render: (row) => (
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                {new Date(row.startTime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ),
          },
          {
            key: "endTime",
            header: "END DATE",
            render: (row) => (
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                {new Date(row.endTime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ),
          },
          {
            key: "description",
            header: "DESCRIPTION / DETAILS",
            render: (row) => (
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[320px]">
                {row.description || "No description provided."}
              </p>
            ),
          },
          {
            key: "action",
            header: "ACTION",
            render: (row) => (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEventId(row.id);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                View Details
              </Button>
            ),
          },
        ]}
        rows={filteredEvents}
        loading={isLoading}
        searchKeys={["name", "description"]}
        onRowClick={(row) => setSelectedEventId(row.id)}
        emptyTitle="No events found"
        emptyDescription="Events configured by the organization admin or manager will appear here."
      />

      {/* ─── READ-ONLY EVENT DETAILS MODAL ───────────────────────────────────── */}
      {selectedEventId && (
        <JudgeEventDetailsModal
          eventId={selectedEventId}
          open={!!selectedEventId}
          onOpenChange={(open) => {
            if (!open) setSelectedEventId(null);
          }}
          fallbackEvent={selectedEvent}
          assignedSubmissionsCount={assignedCountByEvent.get(selectedEventId) || 0}
          onNavigateToGrading={() => {
            setSelectedEventId(null);
            navigate({ to: "/judge/submissions" });
          }}
        />
      )}
    </div>
  );
}

// ─── READ-ONLY EVENT DETAILS MODAL COMPONENT ─────────────────────────────────
interface JudgeEventDetailsModalProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fallbackEvent: ApiEvent | null;
  assignedSubmissionsCount: number;
  onNavigateToGrading: () => void;
}

function JudgeEventDetailsModal({
  eventId,
  open,
  onOpenChange,
  fallbackEvent,
  assignedSubmissionsCount,
  onNavigateToGrading,
}: JudgeEventDetailsModalProps) {
  // Fetch fresh full event details and rounds
  const { data: fullEvent, isLoading: loadingEvent } = useEvent(eventId);
  const { data: fetchedRounds = [], isLoading: loadingRounds } = useEventRounds(eventId);

  const event = fullEvent || fallbackEvent;

  if (!event) return null;

  const rounds =
    (event.rounds && event.rounds.length > 0) ? event.rounds : fetchedRounds;
  const problemStatements = event.problemStatements || [];

  const teamSizeText =
    event.registrationType === "TEAM"
      ? `${event.minTeamSize || 2} to ${event.maxTeamSize || 4} Members`
      : "Individual (1 Participant)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[88vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Trophy className="w-5 h-5 text-amber-500" />
                {event.name}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Read-only event overview, problem statements, and configured evaluation rounds.
              </DialogDescription>
            </div>
            <Badge
              className={
                event.status === "PUBLISHED" || event.status === "LIVE"
                  ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : ""
              }
              variant={
                event.status === "PUBLISHED" || event.status === "LIVE"
                  ? "outline"
                  : "secondary"
              }
            >
              {event.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Assigned Submissions Notification Banner */}
          {assignedSubmissionsCount > 0 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  You have {assignedSubmissionsCount} submission{assignedSubmissionsCount > 1 ? "s" : ""} assigned for evaluation in this event.
                </span>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1"
                onClick={onNavigateToGrading}
              >
                Go to Grading
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase text-[10px]">
              Event Description
            </Label>
            <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border">
              {event.description || "No description provided."}
            </p>
          </div>

          {/* Event Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-muted/30 border rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Start Date
              </span>
              <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {new Date(event.startTime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                End Date
              </span>
              <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {new Date(event.endTime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Registration Deadline
              </span>
              <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {event.registrationEnd
                  ? new Date(event.registrationEnd).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Event Type
              </span>
              <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {event.registrationType || "Standard Competition"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Team Size
              </span>
              <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {teamSizeText}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Eligibility
              </span>
              <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                Enrolled Participants
              </span>
            </div>
          </div>

          {/* Configured Problem Statements */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-primary" />
                Problem Statements ({problemStatements.length})
              </Label>
            </div>
            {problemStatements.length > 0 ? (
              <div className="space-y-2">
                {problemStatements.map((ps: any) => (
                  <div
                    key={ps.id}
                    className="p-3 bg-muted/20 border border-border/80 rounded-lg space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {ps.code} — {ps.title}
                      </span>
                      {ps.category && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                          {ps.category}
                        </Badge>
                      )}
                    </div>
                    {ps.description && (
                      <p className="text-muted-foreground text-[11px] leading-relaxed pt-0.5">
                        {ps.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded border">
                General Track — No specific problem statements configured for this event.
              </p>
            )}
          </div>

          {/* Configured Evaluation Rounds */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Configured Evaluation Rounds ({rounds.length})
            </Label>
            {rounds.length > 0 ? (
              <div className="space-y-2">
                {rounds.map((round: any) => {
                  const hasDeadline = round.submissionDeadline;
                  const hasStart = round.submissionStart;

                  return (
                    <div
                      key={round.id}
                      className="p-3 bg-muted/30 border rounded-lg space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-blue-500" />
                          Round {round.roundNumber} — {round.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-semibold text-primary">
                            Max {round.maxMarks || 100} Marks
                          </Badge>
                          <Badge variant={round.isLocked ? "secondary" : "default"} className="text-[10px]">
                            {round.isLocked ? "Locked" : "Open / Active"}
                          </Badge>
                        </div>
                      </div>

                      {round.description && (
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {round.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <div>
                          <span>Submission Window Start: </span>
                          <span className="font-medium text-foreground">
                            {hasStart
                              ? new Date(hasStart).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Not scheduled"}
                          </span>
                        </div>
                        <div>
                          <span>Submission Deadline: </span>
                          <span className="font-medium text-foreground">
                            {hasDeadline
                              ? new Date(hasDeadline).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "No deadline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded border">
                No evaluation rounds configured yet for this event.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={onNavigateToGrading} className="gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Go to Submissions & Grading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
