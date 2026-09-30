import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { useSubmissions, useDeleteSubmission, ApiSubmission } from "../services/submissions.api";
import { useEvents, useEventRounds } from "@/modules/events/services/events.api";
import { SubmissionDialog } from "../components/submission-dialog";
import { AssignJudgeDialog } from "../components/assign-judge-dialog";
import { EventDetailsDialog } from "@/components/events/EventDetailsDialog";
import { ApiEvent } from "@/modules/events/services/events.api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserCheck, Layers, Filter } from "lucide-react";

const statusLabel: Record<string, string> = {
  DRAFT: "draft",
  SUBMITTED: "pending",
  IN_REVIEW: "in_review",
  EVALUATED: "closed",
  DISQUALIFIED: "cancelled",
};

export function SubmissionsListPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>("ALL");

  // Fetch events list
  const { data: events = [] } = useEvents();

  // Fetch rounds for selected event if specific event is chosen
  const activeEventId = selectedEventId !== "ALL" ? selectedEventId : "";
  const { data: eventRounds = [] } = useEventRounds(activeEventId);

  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(selectedRoundFilter);
  const selectedEventRound = eventRounds.find((r) => r.id === selectedRoundFilter);

  // Fetch submissions from backend with roundId, roundNumber, and eventId query filters
  const { data: submissions = [], isLoading } = useSubmissions({
    eventId: selectedEventId !== "ALL" ? selectedEventId : undefined,
    roundId: isUuid ? selectedRoundFilter : undefined,
    roundNumber: !isUuid && selectedRoundFilter !== "ALL" ? Number(selectedRoundFilter) : (selectedEventRound ? selectedEventRound.roundNumber : undefined),
  });

  const deleteMutation = useDeleteSubmission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignJudgeOpen, setAssignJudgeOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<ApiSubmission | null>(null);
  const [selectedDetailEventId, setSelectedDetailEventId] = useState<string | null>(null);

  const handleView = (row: ApiSubmission) => {
    setSelectedSub(row);
    setDialogOpen(true);
  };

  const handleAssignJudge = (row: ApiSubmission) => {
    setSelectedSub(row);
    setAssignJudgeOpen(true);
  };

  const handleDelete = async (row: ApiSubmission) => {
    if (!confirm(`Delete submission "${row.title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(row.id);
      toast.success("Submission deleted");
    } catch {
      toast.error("Failed to delete submission");
    }
  };

  const handleEventChange = (value: string) => {
    setSelectedEventId(value);
    setSelectedRoundFilter("ALL");
  };

  const columns: Column<ApiSubmission>[] = [
    {
      key: "title",
      header: "Title & Student/Team",
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium text-sm block">{row.title}</span>
          <span className="text-xs text-muted-foreground">
            {row.team?.name ? `Team: ${row.team.name}` : row.submittedBy ? `${row.submittedBy.firstName} ${row.submittedBy.lastName}` : "Participant"}
          </span>
        </div>
      ),
    },
    {
      key: "eventRound",
      header: "Event & Round",
      sortable: true,
      render: (row) => {
        const targetEvt = row.event || row.competition?.event;
        const targetEventId = row.eventId || targetEvt?.id;
        const eventName = targetEvt?.name || "Event";
        const roundText = row.eventRound
          ? `Round ${row.eventRound.roundNumber} — ${row.eventRound.name}`
          : `Round ${row.roundNumber || 1}`;

        return (
          <div className="space-y-0.5">
            {targetEventId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDetailEventId(targetEventId);
                }}
                className="text-xs font-medium text-primary hover:underline text-left block"
              >
                {eventName}
              </button>
            ) : (
              <span className="text-xs font-medium block">{eventName}</span>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1 w-fit">
              <Layers className="w-3 h-3 text-blue-500" />
              {roundText}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "judgeAssignments",
      header: "Assigned Judges",
      render: (row) => (
        <div className="flex flex-wrap gap-1 items-center">
          {(!row.judgeAssignments || row.judgeAssignments.length === 0) ? (
            <span className="text-xs text-muted-foreground italic">None assigned</span>
          ) : (
            row.judgeAssignments.map((a) => (
              <Badge key={a.id} variant="secondary" className="text-[10px] font-normal">
                {a.judge.firstName} {a.judge.lastName}
              </Badge>
            ))
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={() => handleAssignJudge(row)}
            title="Assign / Manage Judges"
          >
            <UserCheck className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
    {
      key: "evaluations",
      header: "Evaluation Status",
      render: (row) => {
        const evals = row.evaluations || [];
        const hasScores = evals.some((e) => e.score !== null && e.score !== undefined);
        const max = row.eventRound?.maxMarks || 100;

        if (hasScores) {
          const avgScore = evals.reduce((sum, e) => sum + (e.score || 0), 0) / (evals.length || 1);
          return (
            <div>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {avgScore.toFixed(1)} / {max}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {evals.length} evaluation{evals.length > 1 ? "s" : ""}
              </span>
            </div>
          );
        }

        return <Badge variant="outline" className="text-xs font-normal text-muted-foreground">Pending Evaluation</Badge>;
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusChip status={statusLabel[row.status] ?? row.status} />,
    },
    {
      key: "createdAt",
      header: "Submitted Date",
      sortable: true,
      render: (row) => <span className="text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
  ];

  const inReviewCount = submissions.filter((s) => s.status === "IN_REVIEW" || s.status === "SUBMITTED").length;
  const evaluatedCount = submissions.filter((s) => s.status === "EVALUATED").length;

  const statsList = [
    { label: "Total Submissions", value: String(submissions.length) },
    { label: "Awaiting Review", value: String(inReviewCount) },
    { label: "Evaluated", value: String(evaluatedCount) },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Event & Round Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 border rounded-xl">
          {/* Event Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Event:
            </Label>
            <Select value={selectedEventId} onValueChange={handleEventChange}>
              <SelectTrigger className="h-8 text-xs min-w-[200px] bg-background">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>
                    {evt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Round Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <Label className="text-xs font-semibold text-muted-foreground mr-1">Round:</Label>
            <Button
              variant={selectedRoundFilter === "ALL" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setSelectedRoundFilter("ALL")}
            >
              All Rounds
            </Button>

            {/* Render dynamic rounds if an event is selected */}
            {activeEventId && eventRounds.length > 0 ? (
              eventRounds.map((round) => {
                const isSelected = selectedRoundFilter === round.id;
                return (
                  <Button
                    key={round.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => setSelectedRoundFilter(round.id)}
                  >
                    Round {round.roundNumber}{round.name ? ` — ${round.name}` : ""}
                  </Button>
                );
              })
            ) : !activeEventId ? (
              <span className="text-[11px] text-muted-foreground italic ml-1">
                Select an event to filter by configured rounds
              </span>
            ) : null}
          </div>
        </div>

        <ListPageTemplate<ApiSubmission>
          title="Submissions"
          description="View student/team submissions organized by event and round."
          crumbs={[{ label: "Programs" }, { label: "Submissions" }]}
          columns={columns}
          rows={submissions}
          loading={isLoading}
          searchKeys={["title", "team.name", "submittedBy.firstName", "submittedBy.lastName", "submittedBy.email", "id"]}
          statusKey="status"
          dateKey="createdAt"
          selectable={false}
          stats={statsList}
          facet={{
            label: "Status",
            key: "status",
            options: ["DRAFT", "SUBMITTED", "IN_REVIEW", "EVALUATED", "DISQUALIFIED"],
          }}
          rowActions={[
            {
              label: "View details",
              onSelect: (row) => handleView(row),
            },
            {
              label: "Assign Judge",
              onSelect: (row) => handleAssignJudge(row),
            },
            {
              label: "Update status",
              onSelect: (row) => handleView(row),
            },
            {
              label: "Delete",
              onSelect: (row) => handleDelete(row),
            },
          ]}
        />
      </div>

      <SubmissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        submission={selectedSub}
      />

      <AssignJudgeDialog
        open={assignJudgeOpen}
        onOpenChange={setAssignJudgeOpen}
        submission={selectedSub}
      />

      <EventDetailsDialog
        open={!!selectedDetailEventId}
        onOpenChange={(open) => !open && setSelectedDetailEventId(null)}
        eventId={selectedDetailEventId}
        mode="admin"
      />
    </>
  );
}
