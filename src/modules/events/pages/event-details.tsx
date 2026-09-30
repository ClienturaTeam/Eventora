import { DetailsPageTemplate } from "@/components/templates/details-page";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatusChip } from "@/components/ds/status-chip";
import { Button } from "@/components/ui/button";
import { TrendAreaChart } from "@/components/ds/charts";
import { useParams } from "@tanstack/react-router";
import { useEvent, useEventDashboard, useExecutionSummary, useCompleteEvent } from "../services/events.api";
import { toast } from "sonner";
import { ShieldCheck, Users, Trophy, HeartHandshake, CheckCircle } from "lucide-react";
import { EventTeamList } from "../components/event-team-list";
import { AdminExecutionDataTool } from "../components/admin-execution-data-tool";
import { useFinalReport } from "../services/final-report.api";
import { useUpdateEvent } from "../services/events.api";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { EventAssignment } from "../components/event-assignment";
import { EventRegistrationsList } from "../components/event-registrations-list";

export function EventDetailsPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: event, isLoading: isEventLoading } = useEvent(id);
  const { data: dashboard, isLoading: isDashboardLoading } = useEventDashboard(id);
  
  // Execution Summary hooks
  const { data: executionSummary, isLoading: isExecutionLoading } = useExecutionSummary(id);
  const completeEvent = useCompleteEvent();
  const navigate = useNavigate();

  // Final Report Hooks
  const { data: finalReport, isLoading: isReportLoading } = useFinalReport(id);
  const updateEvent = useUpdateEvent();
  const { hasPermission, user } = useAuth();

  const handleCompleteEvent = async () => {
    try {
      await completeEvent.mutateAsync(id);
      toast.success("Event successfully completed and data locked for reporting.");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete event");
    }
  };

  const handlePublishEvent = async () => {
    try {
      await updateEvent.mutateAsync({ id, status: "LIVE" });
      toast.success("Event is now LIVE!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish event");
    }
  };


  if (isEventLoading || isDashboardLoading || isExecutionLoading) {
    return <div className="p-8">Loading event details...</div>;
  }

  if (!event) {
    return <div className="p-8">Event not found</div>;
  }

  const isPrimarySC = event.teamMembers?.some(
    (m: any) => m.userId === user?.id && m.responsibility === "Primary Student Coordinator"
  );

  return (
    <DetailsPageTemplate
      title={event.name}
      description={event.description || "No description provided"}
      crumbs={[
        { label: "Programs" },
        { label: "Events", to: "/events" },
        { label: "Event details" },
      ]}
      meta={
        <>
          <StatusChip status={event.status.toLowerCase() as any} />
          <span className="text-xs text-muted-foreground">
            Created on {new Date(event.createdAt).toLocaleDateString()}
          </span>
        </>
      }
      actions={
        <>
          {(event.status === "DRAFT" || event.status === "PUBLISHED") && hasPermission("events.update") && (
            <Button variant="outline" onClick={handlePublishEvent} disabled={updateEvent.isPending}>
              {updateEvent.isPending ? "Publishing..." : "Publish to LIVE"}
            </Button>
          )}
          {event.status === "LIVE" && (hasPermission("events.complete") || isPrimarySC) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Mark Event as Completed</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Event</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="mb-4">Are you sure this event has been completed?</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Participant/registration data is updated</li>
                    <li>Attendance data is recorded</li>
                    <li>Teams/submissions are updated where applicable</li>
                    <li>Event activities are complete</li>
                    <li>Required execution information has been recorded</li>
                  </ul>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="default" onClick={handleCompleteEvent} disabled={completeEvent.isPending}>
                      {completeEvent.isPending ? "Completing..." : "Mark as Completed"}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {event.status === "COMPLETED" && (hasPermission("events.read") || hasPermission("events.read_assigned") || hasPermission("reports.create_assigned")) && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Event Completed
              </span>
              <Button variant="default" onClick={() => navigate({ to: "/events/$id/final-report", params: { id } })}>
                {finalReport ? "View Final Report" : "Create Final Report"}
              </Button>
            </div>
          )}
          {hasPermission("events.update") && <Button variant="outline">Edit</Button>}
        </>
      }
      metrics={[
        { label: "Registrations", value: dashboard?.metrics?.registrations.toLocaleString() || "0" },
        { label: "Teams", value: dashboard?.metrics?.teams.toLocaleString() || "0" },
        { label: "Submissions", value: dashboard?.metrics?.submissions.toLocaleString() || "0" },
        { label: "Revenue", value: `$${(dashboard?.metrics?.revenue || 0).toLocaleString()}` },
      ]}
      overview={
        <>
          <SectionCard title="Registration trend" description="Registrations over time">
            <TrendAreaChart
              data={dashboard?.registrationTrend || []}
              xKey="month"
              series={[
                { key: "registrations", label: "Registrations" },
                { key: "participants", label: "Participants" },
              ]}
              height={260}
            />
          </SectionCard>

          {executionSummary && (event.status === "LIVE" || event.status === "COMPLETED") && (
            <SectionCard title="Execution Summary" description="Live analytics and final statistics">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 bg-surface border rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">Participants</span>
                  </div>
                  <div className="text-2xl font-bold">{executionSummary.registrations.totalRegistered} <span className="text-sm font-normal text-muted-foreground">Registered</span></div>
                  <div className="text-sm mt-1">{executionSummary.attendance.uniqueAttendees} Actual Attendees ({executionSummary.attendance.attendancePercentage}%)</div>
                </div>
                
                <div className="p-4 bg-surface border rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Trophy className="w-4 h-4" />
                    <span className="font-semibold text-sm">Competition</span>
                  </div>
                  <div className="text-2xl font-bold">{executionSummary.competition.totalTeams} <span className="text-sm font-normal text-muted-foreground">Teams</span></div>
                  <div className="text-sm mt-1">{executionSummary.competition.totalSubmissions} Submissions, {executionSummary.competition.totalWinners} Winners</div>
                </div>

                <div className="p-4 bg-surface border rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <HeartHandshake className="w-4 h-4" />
                    <span className="font-semibold text-sm">Volunteers</span>
                  </div>
                  <div className="text-2xl font-bold">{executionSummary.volunteers.totalVolunteers} <span className="text-sm font-normal text-muted-foreground">Staff</span></div>
                  <div className="text-sm mt-1">{executionSummary.volunteers.totalVolunteerHours} Total Hours Logged</div>
                </div>
              </div>
            </SectionCard>
          )}
          
          {event.rules && (
            <SectionCard title="Rules & Guidelines" description="Event instructions and eligibility">
              <div className="text-sm whitespace-pre-wrap text-muted-foreground bg-surface p-4 rounded-lg border border-border">
                {event.rules}
              </div>
            </SectionCard>
          )}

          {hasPermission("events.assign_faculty_coordinator") || hasPermission("events.assign_student_coordinator") || hasPermission("reports.create_assigned") ? (
            <EventAssignment eventId={id} />
          ) : null}

          <SectionCard title="Event summary" description="Key configuration">
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                { k: "Start Date", v: new Date(event.startTime).toLocaleDateString() },
                { k: "End Date", v: new Date(event.endTime).toLocaleDateString() },
                { k: "Status", v: event.status },
                { k: "Registration Type", v: event.registrationType || "INDIVIDUAL" },
                ...(event.registrationType === "TEAM" ? [
                  { k: "Min Team Size", v: event.minTeamSize || "No minimum" },
                  { k: "Max Team Size", v: event.maxTeamSize || "No maximum" },
                ] : []),
                { k: "Registration Starts", v: event.registrationStart ? new Date(event.registrationStart).toLocaleDateString() : "Anytime" },
                { k: "Registration Ends", v: event.registrationEnd ? new Date(event.registrationEnd).toLocaleDateString() : "Anytime" },
              ].map((row) => (
                <div key={row.k}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{row.k}</dt>
                  <dd className="mt-1 text-sm font-medium">{row.v}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </>
      }
      customTabs={[
        { value: "rounds", label: `Rounds (${event.rounds?.length || 0})` },
        { value: "registrations", label: "Registrations" },
        { value: "team", label: "Team" },
        ...(hasPermission("events.update") ? [{ value: "execution", label: "Admin Data Injection" }] : [])
      ]}
      customTabContents={[
        {
          value: "rounds",
          content: (
            <SectionCard title="Configured Event Rounds" description="Round structure, max marks, and submission parameters">
              <div className="space-y-4">
                {(!event.rounds || event.rounds.length === 0) ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No rounds configured for this event.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {event.rounds.map((round: any) => (
                      <div key={round.id || round.roundNumber} className="p-4 rounded-lg border border-border bg-surface/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Round {round.roundNumber}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${round.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                            {round.status || 'ACTIVE'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm">{round.name}</h4>
                        <p className="text-xs text-muted-foreground">{round.description || "No description provided."}</p>
                        <div className="pt-2 border-t border-border/40 grid grid-cols-2 text-xs">
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">Max Marks</span>
                            <span className="font-semibold">{round.maxMarks} Marks</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase">Type</span>
                            <span className="font-medium">{round.submissionType || "FILE"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )
        },
        { value: "registrations", content: <EventRegistrationsList eventId={id} /> },
        { value: "team", content: <EventTeamList eventId={id} /> },
        ...(hasPermission("events.update") ? [{ value: "execution", content: <AdminExecutionDataTool eventId={id} /> }] : [])
      ]}
    />
  );
}
