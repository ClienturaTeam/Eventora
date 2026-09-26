import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUpdateSubmission, ApiSubmission } from "../services/submissions.api";
import { toast } from "sonner";
import { Calendar, Layers, Trophy, Users, FileText, ExternalLink, Paperclip } from "lucide-react";

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission?: ApiSubmission | null;
  mode?: "view" | "edit";
}

export function SubmissionDialog({ open, onOpenChange, submission, mode = "view" }: SubmissionDialogProps) {
  const [status, setStatus] = useState("SUBMITTED");
  const updateMutation = useUpdateSubmission();

  useEffect(() => {
    if (submission) {
      setStatus(submission.status);
    } else {
      setStatus("SUBMITTED");
    }
  }, [submission, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    try {
      await updateMutation.mutateAsync({ id: submission.id, status });
      toast.success("Submission status updated");
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message ?? "Failed to update submission");
    }
  };

  const eventName = submission?.event?.name || submission?.competition?.event?.name || "N/A";
  const roundName = submission?.eventRound
    ? `Round ${submission.eventRound.roundNumber} — ${submission.eventRound.name}`
    : `Round ${submission?.roundNumber || 1}`;
  const maxMarks = submission?.eventRound?.maxMarks;

  const teamOrStudent = submission?.team?.name
    ? `Team: ${submission.team.name}`
    : submission?.submittedBy
    ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`
    : "Participant";

  const payload = submission?.payload as Record<string, any> | null;
  const projectSummary = payload ? (payload["description"] || payload["summary"] || payload["notes"]) : undefined;
  const repositoryUrl = payload ? (payload["repositoryUrl"] || payload["githubUrl"] || payload["repoUrl"]) : undefined;
  const demoUrl = payload ? (payload["demoUrl"] || payload["liveUrl"] || payload["videoUrl"]) : undefined;
  const files = submission?.files || [];
  const evaluations = submission?.evaluations || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Submission Details
            </DialogTitle>
            <DialogDescription>
              Review details and round context for this submission.
            </DialogDescription>
          </DialogHeader>

          {submission && (
            <div className="space-y-4 text-sm border-y py-3">
              {/* Submission Title */}
              <div>
                <h3 className="font-semibold text-base text-foreground">{submission.title}</h3>
                <div className="flex flex-wrap gap-2 items-center mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {teamOrStudent}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Event & Round Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Event</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {eventName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Round & Max Marks</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    {roundName}
                    {maxMarks !== undefined && (
                      <Badge variant="outline" className="text-[10px] ml-1 px-1 py-0">
                        {maxMarks} Marks
                      </Badge>
                    )}
                  </span>
                </div>
              </div>

              {/* Problem Statement Details */}
              {submission?.problemStatement && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-1">
                  <span className="text-muted-foreground block font-semibold uppercase text-[10px]">Problem Statement</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-primary text-xs">
                    <span>{submission.problemStatement.code}</span>
                    <span>•</span>
                    <span>{submission.problemStatement.title}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">{submission.problemStatement.description}</p>
                </div>
              )}

              {/* Description / Summary */}
              {projectSummary && (
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">Description / Summary</Label>
                  <p className="text-xs bg-muted/20 p-2.5 rounded border leading-relaxed text-foreground">
                    {String(projectSummary)}
                  </p>
                </div>
              )}

              {/* External Links */}
              {(repositoryUrl || demoUrl) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground block">Links & Deliverables</Label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {repositoryUrl && (
                      <a
                        href={String(repositoryUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded border border-primary/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Repository / Code
                      </a>
                    )}
                    {demoUrl && (
                      <a
                        href={String(demoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline bg-primary/5 px-2.5 py-1 rounded border border-primary/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Demo / Video
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Attached Files */}
              {files.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">Attached Files</Label>
                  <div className="space-y-1">
                    {files.map((file: any) => (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded border text-xs hover:bg-muted/50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                          {file.fileName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {(file.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Status */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Judge Evaluations ({evaluations.length})
                </Label>
                {evaluations.length > 0 ? (
                  <div className="space-y-2">
                    {evaluations.map((ev: any) => {
                      const judgeName = ev.judge ? `${ev.judge.firstName || ""} ${ev.judge.lastName || ""}`.trim() || ev.judge.email : "Judge";
                      const evalDate = ev.updatedAt ? new Date(ev.updatedAt).toLocaleDateString() : null;

                      return (
                        <div key={ev.id} className="p-3 rounded-lg border bg-card text-xs space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-foreground">{judgeName}</span>
                              {ev.judge?.email && (
                                <span className="text-[10px] text-muted-foreground ml-1">({ev.judge.email})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono">
                              <Badge variant={ev.status === "COMPLETED" ? "default" : "outline"} className="text-[10px]">
                                {ev.status}
                              </Badge>
                              <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary">
                                {ev.score !== null && ev.score !== undefined ? `${ev.score} / ${maxMarks || 100}` : "Pending Score"}
                              </Badge>
                            </div>
                          </div>

                          {ev.feedback && (
                            <div className="text-muted-foreground bg-muted/40 p-2 rounded text-[11px] leading-relaxed border mt-1">
                              <span className="font-semibold text-foreground block text-[10px] uppercase mb-0.5">Feedback:</span>
                              {ev.feedback}
                            </div>
                          )}

                          {evalDate && (
                            <span className="text-[10px] text-muted-foreground block text-right pt-0.5">
                              Evaluated on {evalDate}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-xs">
                    Pending Evaluation
                  </Badge>
                )}
              </div>

              {/* Status Selector */}
              <div className="grid gap-1.5 pt-2">
                <Label htmlFor="sub-status" className="text-xs font-medium">Submission Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="sub-status" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="EVALUATED">Evaluated</SelectItem>
                    <SelectItem value="DISQUALIFIED">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
