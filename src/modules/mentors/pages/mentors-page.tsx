import { useState } from "react";
import { Loader2, MessageSquare, Send, CheckCircle2, HelpCircle } from "lucide-react";
import { StatCard } from "@/components/ds/stat-card";
import { ListPageTemplate } from "@/components/templates/list-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Column } from "@/components/ds/data-table";
import { toast } from "sonner";
import {
  useMentors,
  useMentorQuestions,
  useReplyMentorQuestion,
  ApiMentor,
  ApiMentorQuestion,
} from "../services/mentors.api";

type MentorRow = ApiMentor & { _name: string; _email: string; _teams: number };

const columns: Column<MentorRow>[] = [
  {
    key: "_name" as any,
    header: "Mentor",
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium">{row._name}</p>
        <p className="text-xs text-muted-foreground">{row._email}</p>
      </div>
    ),
  },
  {
    key: "expertise" as any,
    header: "Expertise",
    sortable: true,
    render: (row) =>
      row.expertise ? (
        <Badge variant="outline">{row.expertise}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "_teams" as any,
    header: "Teams",
    sortable: true,
    render: (row) => <span className="tabular-nums">{row._teams}</span>,
  },
  {
    key: "createdAt" as any,
    header: "Joined",
    sortable: true,
    render: (row) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString()}
      </span>
    ),
  },
];

export function MentorsPage() {
  const { data: mentors = [], isLoading, error } = useMentors();
  const { data: questions = [], isLoading: loadingQuestions } = useMentorQuestions();
  const replyMutation = useReplyMentorQuestion();

  const [selectedQuestion, setSelectedQuestion] = useState<ApiMentorQuestion | null>(null);
  const [replyText, setReplyText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ANSWERED">("ALL");

  const filteredQuestions = questions.filter((q) => {
    const isAnswered = q.status === "ANSWERED" || (q.replies && q.replies.length > 0);
    if (statusFilter === "PENDING") return !isAnswered;
    if (statusFilter === "ANSWERED") return isAnswered;
    return true;
  });

  const rows: MentorRow[] = mentors.map((m) => ({
    ...m,
    _name:
      m.user
        ? `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || m.user.email
        : m.userId,
    _email: m.user?.email ?? "—",
    _teams: m.teamAssignments?.length ?? 0,
  }));

  const totalTeams = rows.reduce((s, r) => s + r._teams, 0);

  const handleReplySubmit = async () => {
    if (!selectedQuestion || !replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({
        questionId: selectedQuestion.id,
        reply: replyText.trim(),
      });
      toast.success("Reply submitted successfully!");
      setReplyText("");
      setSelectedQuestion(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit reply");
    }
  };

  if (isLoading && loadingQuestions)
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading mentors and doubts…
      </div>
    );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {[
          { label: "Total Mentors", value: String(mentors.length), hint: "in this organization" },
          { label: "Teams Mentored", value: String(totalTeams), hint: "active assignments" },
          {
            label: "Pending Doubts",
            value: String(questions.filter((q) => q.status !== "ANSWERED" && (!q.replies || q.replies.length === 0)).length),
            hint: "unanswered questions",
          },
          {
            label: "Total Q&A Threads",
            value: String(questions.length),
            hint: "across all rounds",
          },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory">Mentor Directory</TabsTrigger>
          <TabsTrigger value="qa-hub" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Participant Q&A Hub
            {questions.filter((q) => q.status !== "ANSWERED" && (!q.replies || q.replies.length === 0)).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                {questions.filter((q) => q.status !== "ANSWERED" && (!q.replies || q.replies.length === 0)).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          {error ? (
            <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-sm space-y-1">
              <p className="font-semibold">Failed to load mentors directory</p>
              <p className="text-xs text-muted-foreground">Please check your mentor permissions or contact an administrator.</p>
            </div>
          ) : (
            <ListPageTemplate<MentorRow>
              title="Mentor Management"
              description="All mentors registered in this organization with their team assignments."
              crumbs={[{ label: "Event Operations" }, { label: "Mentors" }]}
              columns={columns}
              rows={rows}
              searchKeys={["_name", "_email", "expertise"] as any}
              facet={{ label: "Expertise", key: "expertise" as any, options: [] }}
              rowActions={[
                { label: "View Profile", onSelect: () => {} },
                { label: "View Teams", onSelect: () => {} },
              ]}
            />
          )}
        </TabsContent>

        <TabsContent value="qa-hub">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Participant Questions & Doubts</h3>
                <p className="text-sm text-muted-foreground">
                  View, filter, and answer participant doubts for specific events and rounds.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status Filter:</span>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                  {(["ALL", "PENDING", "ANSWERED"] as const).map((st) => (
                    <Button
                      key={st}
                      variant={statusFilter === st ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {loadingQuestions ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading Q&A threads...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <HelpCircle className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="text-sm font-medium">No participant questions found for filter '{statusFilter}'.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const hasReplies = (q.replies && q.replies.length > 0) || q.status === "ANSWERED";
                  const askerName = q.participant
                    ? `${q.participant.firstName ?? ""} ${q.participant.lastName ?? ""}`.trim() || q.participant.email
                    : q.user
                    ? `${q.user.firstName ?? ""} ${q.user.lastName ?? ""}`.trim() || q.user.email
                    : "Participant";
                  const assignedMentorName = q.mentor
                    ? `${q.mentor.firstName ?? ""} ${q.mentor.lastName ?? ""}`.trim() || q.mentor.email
                    : null;
                  const teamName = q.team?.name || "Individual Participant";
                  const problemTitle = q.problemStatement
                    ? `${q.problemStatement.code ? `[${q.problemStatement.code}] ` : ""}${q.problemStatement.title || ""}`
                    : "—";

                  return (
                    <div
                      key={q.id}
                      className="rounded-lg border p-4 hover:border-primary/50 transition-colors space-y-3"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1.5 flex-1 min-w-[280px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{askerName}</span>
                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                              Team: {teamName}
                            </Badge>
                            {q.event && (
                              <Badge variant="outline" className="text-[10px]">
                                Event: {q.event.name || q.event.title}
                              </Badge>
                            )}
                            {q.round && (
                              <Badge variant="secondary" className="text-[10px]">
                                Round {q.round.roundNumber}: {q.round.name}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(q.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {q.problemStatement && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Problem Statement:</span>
                              <span className="text-primary font-medium">{problemTitle}</span>
                            </div>
                          )}

                          <div className="space-y-0.5 pt-1">
                            {q.subject && q.subject !== q.question && (
                              <p className="text-xs font-semibold text-muted-foreground">Subject: {q.subject}</p>
                            )}
                            <p className="text-sm font-medium text-foreground">{q.question}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge
                            variant={q.status === "ANSWERED" || hasReplies ? "default" : "destructive"}
                            className="shrink-0 flex items-center gap-1"
                          >
                            {q.status === "ANSWERED" || hasReplies ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Answered
                              </>
                            ) : (
                              "Pending"
                            )}
                          </Badge>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedQuestion(q);
                                setReplyText("");
                              }}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedQuestion(q);
                                setReplyText("");
                              }}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Replies / Answer List */}
                      {hasReplies && q.replies && q.replies.length > 0 && (
                        <div className="ml-4 pl-4 border-l-2 border-primary/20 space-y-2 pt-1">
                          {q.replies.map((r) => {
                            const replierName = r.sender
                              ? `${r.sender.firstName ?? ""} ${r.sender.lastName ?? ""}`.trim() || r.sender.email
                              : r.user
                              ? `${r.user.firstName ?? ""} ${r.user.lastName ?? ""}`.trim() || r.user.email
                              : assignedMentorName || "Mentor";
                            const msgContent = r.message || r.reply;
                            return (
                              <div key={r.id} className="text-xs bg-muted/40 p-3 rounded-md space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-primary">{replierName}</span>
                                  <Badge variant="outline" className="text-[9px] py-0 px-1">
                                    Mentor Answer
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {new Date(r.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-foreground">{msgContent}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Question Details & Reply Modal */}
      <Dialog open={!!selectedQuestion} onOpenChange={(o) => !o && setSelectedQuestion(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Question Details
            </DialogTitle>
            <DialogDescription>
              Review complete participant doubt context and provide official mentor reply.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4 text-xs">
              {/* Context Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/30 rounded-lg border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Event</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedQuestion.event?.name || selectedQuestion.event?.title || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedQuestion.team?.name || "Individual Participant"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Problem Statement</span>
                  <p className="font-semibold text-primary mt-0.5">
                    {selectedQuestion.problemStatement
                      ? `${selectedQuestion.problemStatement.code ? `[${selectedQuestion.problemStatement.code}] ` : ""}${selectedQuestion.problemStatement.title || ""}`
                      : "General Inquiry / None"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Round</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedQuestion.round
                      ? `Round ${selectedQuestion.round.roundNumber}: ${selectedQuestion.round.name}`
                      : "General / Not round-specific"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Participant</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedQuestion.participant
                      ? `${selectedQuestion.participant.firstName ?? ""} ${selectedQuestion.participant.lastName ?? ""}`.trim() || selectedQuestion.participant.email
                      : selectedQuestion.user
                      ? `${selectedQuestion.user.firstName ?? ""} ${selectedQuestion.user.lastName ?? ""}`.trim() || selectedQuestion.user.email
                      : "Participant"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted Date/Time</span>
                  <p className="font-mono text-muted-foreground mt-0.5">
                    {new Date(selectedQuestion.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-between border-t pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                  <Badge
                    variant={selectedQuestion.status === "ANSWERED" || (selectedQuestion.replies && selectedQuestion.replies.length > 0) ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {selectedQuestion.status === "ANSWERED" || (selectedQuestion.replies && selectedQuestion.replies.length > 0) ? "ANSWERED" : "PENDING"}
                  </Badge>
                </div>
              </div>

              {/* Participant Question Text */}
              <div className="p-3.5 bg-card rounded-lg border space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Question</span>
                <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-line">
                  {selectedQuestion.question}
                </p>
              </div>

              {/* Existing Replies */}
              {selectedQuestion.replies && selectedQuestion.replies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous Replies</span>
                  <div className="space-y-2">
                    {selectedQuestion.replies.map((r) => {
                      const replierName = r.sender
                        ? `${r.sender.firstName ?? ""} ${r.sender.lastName ?? ""}`.trim() || r.sender.email
                        : "Mentor";
                      return (
                        <div key={r.id} className="p-3 bg-primary/5 border border-primary/10 rounded-md space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary">{replierName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(r.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed whitespace-pre-line">{r.message || r.reply}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reply Input Box */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-semibold text-foreground">Your Reply / Solution</label>
                <Textarea
                  rows={4}
                  placeholder="Type your official answer, guidelines, or instructions here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedQuestion(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleReplySubmit}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Submit Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

