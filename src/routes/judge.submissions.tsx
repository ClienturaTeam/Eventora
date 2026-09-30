import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useJudgeProfile } from "@/modules/judges/hooks/use-judge-profile";
import { useMyEvaluations, useUpdateEvaluation } from "@/modules/judges/services/judges.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/judge/submissions")({
  component: JudgeSubmissionsPage,
});

function JudgeSubmissionsPage() {
  const { selectedProfileId } = useJudgeProfile();
  const { data: evaluations = [], isLoading } = useMyEvaluations(selectedProfileId);
  const updateEvaluation = useUpdateEvaluation();
  
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  const handleOpenGradeModal = (evaluation: any) => {
    setSelectedEval(evaluation);
    setScore(evaluation.score ? String(evaluation.score) : "");
    setFeedback(evaluation.feedback || "");
  };

  const handleGrade = async () => {
    if (!selectedEval) return;
    
    try {
      const numericScore = parseFloat(score);
      if (isNaN(numericScore)) {
        toast.error("Please enter a valid numeric score.");
        return;
      }
      
      await updateEvaluation.mutateAsync({
        id: selectedEval.id,
        profileId: selectedProfileId,
        score: numericScore,
        feedback,
        status: "COMPLETED"
      });
      toast.success("Grade submitted successfully.");
      setSelectedEval(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit grade.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <ListPageTemplate<any>
        title="Submissions & Grading"
        description="Review submissions assigned to you and provide grades and feedback."
        columns={[
          { key: "submission.title", header: "Submission Title", render: (row) => <span className="font-medium">{row.submission?.title}</span> },
          { key: "submission.team", header: "Team", render: (row) => <span>{row.submission?.team?.name || 'N/A'}</span> },
          { key: "submission.competition", header: "Competition", render: (row) => <span className="text-sm">{row.submission?.competition?.name}</span> },
          { 
            key: "status", 
            header: "Status", 
            render: (row) => (
              <Badge variant={row.status === "COMPLETED" ? "default" : "secondary"}>
                {row.status}
              </Badge>
            )
          },
          { 
            key: "score", 
            header: "Score", 
            render: (row) => <span>{row.score !== null ? row.score : '-'}</span> 
          },
        ]}
        rows={evaluations}
        loading={isLoading}
        searchKeys={["submission.title", "submission.team.name"]}
        rowActions={[
          {
            label: "Evaluate",
            onSelect: (row) => handleOpenGradeModal(row)
          }
        ]}
      />

      <Dialog open={!!selectedEval} onOpenChange={(open) => !open && setSelectedEval(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Evaluate Submission</DialogTitle>
          </DialogHeader>
          {selectedEval && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Submission</Label>
                <p className="font-medium">{selectedEval.submission?.title}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Team</Label>
                <p className="text-sm">{selectedEval.submission?.team?.name}</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="score">Total Score</Label>
                <Input
                  id="score"
                  type="number"
                  placeholder="e.g. 85"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide constructive feedback for the team..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEval(null)}>Cancel</Button>
            <Button 
              onClick={handleGrade} 
              disabled={updateEvaluation.isPending}
            >
              {updateEvaluation.isPending ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
