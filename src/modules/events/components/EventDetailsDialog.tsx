import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ds/status-chip";
import { ApiEvent, useEvent, useEventRounds } from "@/modules/events/services/events.api";
import { useProblemStatements } from "@/modules/participant/hooks/participant.api";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Clock, DollarSign, Users, Award, FileCode, IndianRupee, UserCheck, ExternalLink } from "lucide-react";

export interface EventDetailsDialogProps {
  eventId?: string | null;
  event?: ApiEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "manager" | "admin" | "participant";
  registration?: any;
  onRegister?: (event: ApiEvent) => void;
  isRegistering?: boolean;
}

const statusLabel: Record<string, string> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export function EventDetailsDialog({
  eventId,
  event: passedEvent,
  open,
  onOpenChange,
  mode,
  registration,
  onRegister,
  isRegistering = false,
}: EventDetailsDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If eventId is provided, fetch latest full event details from API
  const targetId = passedEvent?.id || eventId || "";
  const { data: fetchedEvent, isLoading: loadingEvent } = useEvent(targetId);
  const { data: fetchedRounds = [] } = useEventRounds(targetId);
  const { data: allProblemStatements = [] } = useProblemStatements();

  const event: ApiEvent | null = fetchedEvent || passedEvent || null;

  if (!event) return null;

  // Role detection: check if Admin/Manager vs Participant
  const userRoles = user?.memberships?.map((m) => m.role?.name?.toLowerCase() || "") || [];
  const isAdminOrManager =
    mode === "admin" ||
    mode === "manager" ||
    userRoles.some((r) => r.includes("admin") || r.includes("manager") || r.includes("sudo"));

  // Event rounds & problem statements from database
  const eventRounds = (event.rounds && event.rounds.length > 0) ? event.rounds : fetchedRounds;
  const eventProblemStatements = (event.problemStatements && event.problemStatements.length > 0)
    ? event.problemStatements
    : (allProblemStatements || []).filter((ps: any) => ps.eventId === event.id);

  // Faculty coordinator
  const facultyCoordinator = event.teamMembers?.find(
    (tm: any) => tm.responsibility === "Faculty Coordinator" || tm.responsibility === "FACULTY_COORDINATOR"
  )?.user;

  const isPaidEvent = event.price > 0;
  const reg = registration;

  // Participant Registration button logic
  let actionButtonLabel = "Register";
  let actionDisabled = false;

  if (reg && reg.status !== "CANCELLED" && reg.status !== "REJECTED") {
    if (reg.status === "PENDING" && isPaidEvent) {
      actionButtonLabel = "Complete Payment";
      actionDisabled = false;
    } else {
      actionButtonLabel = "Registered";
      actionDisabled = true;
    }
  } else {
    switch (event.status) {
      case "DRAFT":
        actionButtonLabel = "Registration Unavailable";
        actionDisabled = true;
        break;
      case "PUBLISHED":
        actionButtonLabel = isPaidEvent ? "Register & Pay" : "Register";
        actionDisabled = false;
        break;
      case "LIVE":
        actionButtonLabel = "Registration Closed";
        actionDisabled = true;
        break;
      case "COMPLETED":
        actionButtonLabel = "Completed";
        actionDisabled = true;
        break;
      case "CANCELLED":
        actionButtonLabel = "Cancelled";
        actionDisabled = true;
        break;
      default:
        actionButtonLabel = "Registration Unavailable";
        actionDisabled = true;
        break;
    }
  }

  const isApprovedRegistration =
    reg && (reg.status === "APPROVED" || reg.status === "REGISTERED" || reg.status === "PAID" || reg.status === "CONFIRMED");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto space-y-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-xl font-bold">{event.name}</DialogTitle>
            <StatusChip status={statusLabel[event.status] ?? event.status} />
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Complete event information, rounds, and guidelines.
          </DialogDescription>
        </DialogHeader>

        {/* Section 1: Complete Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {event.description || "No description provided for this event."}
          </p>
        </div>

        {/* Section 2: Event Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border bg-card/50 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Start Time</p>
              <p className="text-sm font-semibold">{new Date(event.startTime).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">End Time</p>
              <p className="text-sm font-semibold">{new Date(event.endTime).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <IndianRupee className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Registration Fee</p>
              <p className="text-sm font-semibold">
                {event.price > 0
                  ? `₹${event.price.toLocaleString("en-IN")}`
                  : "Free"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Team Size</p>
              <p className="text-sm font-semibold">
                {event.registrationType === "TEAM"
                  ? `${event.minTeamSize || 2} – ${event.maxTeamSize || 4} Participants`
                  : "Individual Registration"}
              </p>
            </div>
          </div>

          {/* ADMIN / MANAGER ONLY: Revenue */}
          {isAdminOrManager && (
            <div className="flex items-start gap-3 border-t pt-3 sm:col-span-2">
              <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Configured Revenue (Admin/Manager)</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ₹{(event.revenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {facultyCoordinator && (
            <div className="flex items-start gap-3 border-t pt-3 sm:col-span-2">
              <UserCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Faculty Coordinator</p>
                <p className="text-sm font-semibold">
                  {facultyCoordinator.firstName
                    ? `${facultyCoordinator.firstName} ${facultyCoordinator.lastName || ""}`
                    : facultyCoordinator.name || facultyCoordinator.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Event Rounds */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Rounds ({eventRounds.length})
            </h4>
          </div>

          {eventRounds.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No rounds configured yet for this event.
            </div>
          ) : (
            <div className="space-y-2">
              {eventRounds.map((r: any, idx: number) => (
                <div key={r.id || idx} className="rounded-lg border p-3 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Round {r.roundNumber || idx + 1}: {r.name}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      Max Marks: {r.maxMarks ?? 100}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                    {r.submissionStart && (
                      <span>Start: {new Date(r.submissionStart).toLocaleString()}</span>
                    )}
                    {r.submissionDeadline && (
                      <span>Deadline: {new Date(r.submissionDeadline).toLocaleString()}</span>
                    )}
                    {r.status && (
                      <span className="capitalize">Status: {r.status.toLowerCase()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Problem Statements */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Problem Statements ({eventProblemStatements.length})
            </h4>
          </div>

          {eventProblemStatements.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              No problem statements configured for this event.
            </div>
          ) : (
            <div className="space-y-2">
              {eventProblemStatements.map((ps: any) => (
                <div key={ps.id} className="rounded-lg border p-3 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground">
                      {ps.code || "PS"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Applicable Rounds:{" "}
                      {ps.applicableRounds
                        ? Array.isArray(ps.applicableRounds)
                          ? ps.applicableRounds.join(", ")
                          : ps.applicableRounds
                        : "All Rounds"}
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold">{ps.title}</h5>
                  {ps.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{ps.description}</p>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground italic text-center pt-1">
                Note: Selection of Problem Statement must be done via the dedicated Problem Statements page.
              </p>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {/* Participant specific actions */}
          {!isAdminOrManager && (
            <div className="flex flex-wrap items-center gap-2">
              {isApprovedRegistration ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/participant/problem-statements" });
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Problem Statements
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      navigate({ to: "/participant/submissions" });
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> My Submissions
                  </Button>
                </>
              ) : onRegister ? (
                <Button
                  onClick={() => onRegister(event)}
                  disabled={actionDisabled || isRegistering}
                  variant={actionDisabled ? "secondary" : "default"}
                  className="min-w-[140px]"
                >
                  {isRegistering ? "Processing..." : actionButtonLabel}
                </Button>
              ) : null}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
