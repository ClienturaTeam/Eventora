import { useState, useEffect } from "react";
import { Gavel, Loader2, Save, Sparkles, Sliders, Smartphone, CheckCircle, RotateCcw, Calculator, Zap, ShieldAlert, Award } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { GroupedBarChart } from "@/components/ds/charts";
import { StatusChip } from "@/components/ds/status-chip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useMyEvaluations, useEvaluations, useUpdateEvaluation, ApiEvaluation } from "../services/evaluations.api";

interface RubricCriterion {
  name: string;
  weight: number; // Percentage e.g. 30 = 30%
  description: string;
}

const DEFAULT_HACKATHON_RUBRIC: RubricCriterion[] = [
  { name: "Innovation & Originality", weight: 30, description: "Novelty of solution, creative problem solving, and uniqueness of approach." },
  { name: "Technical Execution", weight: 40, description: "Architecture, code quality, functionality, and technical complexity." },
  { name: "UI/UX & Design", weight: 20, description: "User experience, visual design, accessibility, and intuitive interface." },
  { name: "Presentation & Pitch", weight: 10, description: "Clarity of demonstration, slide deck quality, and team responses." },
];

function statusToChip(status: string): string {
  switch (status) {
    case "COMPLETED": return "published";
    case "IN_PROGRESS": return "in_review";
    case "PENDING": return "pending";
    default: return "pending";
  }
}

// Z-score calculation helper
function calculateZScores(evaluations: ApiEvaluation[]) {
  // Group scores by judge
  const judgeStats: Record<string, { scores: number[]; mean: number; stdDev: number; name: string }> = {};

  evaluations.forEach((e) => {
    if (e.score === null || e.score === undefined) return;
    const jId = e.judgeId || "default";
    const jName = e.judge ? `${e.judge.firstName || ""} ${e.judge.lastName || ""}`.trim() || e.judge.email : jId;

    if (!judgeStats[jId]) {
      judgeStats[jId] = { scores: [], mean: 0, stdDev: 0, name: jName };
    }
    judgeStats[jId].scores.push(e.score);
  });

  // Calculate Mean and StdDev for each judge
  Object.keys(judgeStats).forEach((jId) => {
    const stats = judgeStats[jId];
    if (!stats || stats.scores.length === 0) return;
    const mean = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
    const variance = stats.scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / stats.scores.length;
    const stdDev = Math.sqrt(variance);

    stats.mean = mean;
    stats.stdDev = stdDev;
  });

  // Compute calibrated Z-score for each evaluation
  return evaluations.map((e) => {
    const rawScore = e.score ?? 0;
    const jId = e.judgeId || "default";
    const stats = judgeStats[jId];

    if (!stats || stats.scores.length < 2 || stats.stdDev === 0) {
      return {
        ...e,
        rawScore,
        zScore: 0,
        calibratedScore: rawScore,
        biasRating: "BALANCED",
      };
    }

    const zScore = (rawScore - stats.mean) / stats.stdDev;
    // Scale Z-score to 0-100 range (Mean=50, StdDev=15)
    const calibratedScore = Math.min(100, Math.max(0, Math.round(50 + zScore * 15)));

    let biasRating = "BALANCED";
    if (stats.mean < 65) biasRating = "STRICT";
    else if (stats.mean > 85) biasRating = "LENIENT";

    return {
      ...e,
      rawScore,
      zScore: Number(zScore.toFixed(2)),
      calibratedScore,
      biasRating,
      judgeMean: Number(stats.mean.toFixed(1)),
    };
  });
}

export function EvaluationsPage() {
  const { data: myEvals = [], isLoading: myLoading } = useMyEvaluations();
  const { data: allEvals = [], isLoading: allLoading } = useEvaluations();
  const updateEval = useUpdateEvaluation();

  const [selected, setSelected] = useState<ApiEvaluation | null>(null);
  const [scoreValue, setScoreValue] = useState<number>(75);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    "Innovation & Originality": 24,
    "Technical Execution": 32,
    "UI/UX & Design": 16,
    "Presentation & Pitch": 8,
  });
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  // Compute Z-score bias calibrated scores across all evaluations
  const calibratedEvaluations = calculateZScores(allEvals);

  // Stats from real data
  const completed = myEvals.filter((e) => e.status === "COMPLETED").length;
  const scores = myEvals.filter((e) => e.score !== null).map((e) => e.score as number);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
  const progress = myEvals.length > 0 ? Math.round((completed / myEvals.length) * 100) : 0;

  // Build round progress from all evals
  const roundGroups = allEvals.reduce<Record<string, { pending: number; completed: number }>>(
    (acc, e) => {
      const round = e.submission?.competition?.name ?? "General";
      if (!acc[round]) acc[round] = { pending: 0, completed: 0 };
      if (e.status === "COMPLETED") acc[round].completed++;
      else acc[round].pending++;
      return acc;
    },
    {}
  );
  const roundData = Object.entries(roundGroups).map(([name, v]) => ({ round: name, ...v }));

  // Panel completion per judge
  const judgeMap = allEvals.reduce<Record<string, { name: string; total: number; done: number }>>(
    (acc, e) => {
      const jId = e.judgeId;
      const jName = e.judge
        ? `${e.judge.firstName ?? ""} ${e.judge.lastName ?? ""}`.trim() || e.judge.email
        : jId;
      if (!acc[jId]) acc[jId] = { name: jName, total: 0, done: 0 };
      acc[jId].total++;
      if (e.status === "COMPLETED") acc[jId].done++;
      return acc;
    },
    {}
  );
  const panelData = Object.values(judgeMap).slice(0, 6);

  // Load draft from localStorage on selection
  function handleSelectSubmission(ev: ApiEvaluation) {
    setSelected(ev);
    const draftKey = `eval_draft_${ev.id}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setRubricScores(parsed.rubricScores || {
          "Innovation & Originality": 24,
          "Technical Execution": 32,
          "UI/UX & Design": 16,
          "Presentation & Pitch": 8,
        });
        setScoreValue(parsed.scoreValue || 75);
        setFeedbackText(parsed.feedbackText || "");
        setLastAutoSaved(parsed.savedAt || new Date().toLocaleTimeString());
        toast.info("Restored auto-saved draft scorecard");
        return;
      } catch (err) {
        console.error(err);
      }
    }

    setScoreValue(ev.score !== null && ev.score !== undefined ? ev.score : 75);
    setFeedbackText(ev.feedback || "");
    setRubricScores({
      "Innovation & Originality": 24,
      "Technical Execution": 32,
      "UI/UX & Design": 16,
      "Presentation & Pitch": 8,
    });
    setLastAutoSaved(null);
  }

  // Auto-save draft changes to localStorage
  const autoSaveDraft = (newScores: Record<string, number>, newTotal: number, newFeedback: string) => {
    if (!selected) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const draftData = {
      rubricScores: newScores,
      scoreValue: newTotal,
      feedbackText: newFeedback,
      savedAt: timeStr,
    };
    localStorage.setItem(`eval_draft_${selected.id}`, JSON.stringify(draftData));
    setLastAutoSaved(timeStr);
  };

  const handleScoreStepper = (criterionName: string, delta: number, maxWeight: number) => {
    setRubricScores((prev) => {
      const current = prev[criterionName] || 0;
      const updated = Math.min(maxWeight, Math.max(0, current + delta));
      const nextScores = { ...prev, [criterionName]: updated };
      const newTotal = Object.values(nextScores).reduce((a, b) => a + b, 0);
      autoSaveDraft(nextScores, newTotal, feedbackText);
      return nextScores;
    });
  };

  const calculateTotalScore = () => {
    return Object.values(rubricScores).reduce((a, b) => a + b, 0);
  };

  async function handleSaveDraft() {
    if (!selected) return;
    const total = calculateTotalScore();
    const maxMarks = (selected as any)?.submission?.eventRound?.maxMarks || (selected as any)?.eventRound?.maxMarks || 100;
    
    if (total < 0) {
      toast.error("Marks cannot be negative.");
      return;
    }
    if (total > maxMarks) {
      toast.error(`Marks (${total}) cannot exceed maximum marks (${maxMarks}) for this round.`);
      return;
    }

    const payload: any = {
      id: selected.id,
      score: total,
      feedback: feedbackText,
      status: "IN_PROGRESS",
    };

    try {
      await updateEval.mutateAsync(payload);
      autoSaveDraft(rubricScores, total, feedbackText);
      toast.success("Draft scorecard saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save draft scorecard");
    }
  }

  async function handleSubmitScorecard() {
    if (!selected) return;
    const total = calculateTotalScore();
    const maxMarks = (selected as any)?.submission?.eventRound?.maxMarks || (selected as any)?.eventRound?.maxMarks || 100;

    if (total < 0) {
      toast.error("Marks cannot be negative.");
      return;
    }
    if (total > maxMarks) {
      toast.error(`Marks (${total}) cannot exceed maximum marks (${maxMarks}) for this round.`);
      return;
    }

    const payload: any = {
      id: selected.id,
      score: total,
      feedback: feedbackText,
      status: "COMPLETED",
    };

    try {
      await updateEval.mutateAsync(payload);
      localStorage.removeItem(`eval_draft_${selected.id}`);
      toast.success(`Scorecard submitted! Total score: ${total} / ${maxMarks}`);
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit scorecard");
    }
  }

  const isLoading = myLoading || allLoading;

  return (
    <>
      <PageHeader
        title="Live Judging & Evaluation Matrix"
        description="Multi-criteria weighted rubrics, mobile-optimized scorecards with draft auto-save, and Z-score bias calibration."
        crumbs={[{ label: "Evaluation" }, { label: "Evaluations Matrix" }]}
        actions={
          <Button
            onClick={() => {
              const nextPending = myEvals.find((e) => e.status !== "COMPLETED");
              if (nextPending) {
                handleSelectSubmission(nextPending);
              } else {
                toast.info("No pending evaluations remaining in queue.");
              }
            }}
          >
            <Gavel className="h-4 w-4 mr-1.5" />
            Start Evaluating Queue
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading evaluation matrix…
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            {[
              { label: "Assigned to You", value: String(myEvals.length), hint: "Your evaluation queue" },
              { label: "Completed Evaluations", value: String(completed), progress },
              { label: "Average Score Given", value: String(avgScore), delta: 0 },
              { label: "Pending Evaluations", value: String(myEvals.length - completed), hint: "Remaining in queue" },
            ].map((stat, i) => (
              <StatCard key={stat.label} {...stat} index={i} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              {/* Evaluation Queue */}
              <SectionCard title="Evaluation Assignment Queue" description="Select a team submission to evaluate" padded={false}>
                {myEvals.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground">
                    No evaluations assigned to your panel yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {myEvals.map((ev) => (
                      <li key={ev.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {ev.submission?.title ?? "Untitled Hackathon Project"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
                            {ev.submissionId.slice(0, 8)} · {ev.submission?.team?.name ?? "Team Ascent"} · {ev.submission?.competition?.name ?? "General Track"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <StatusChip status={statusToChip(ev.status) as any} />
                          <Button
                            size="sm"
                            variant={selected?.id === ev.id ? "default" : "outline"}
                            onClick={() => handleSelectSubmission(ev)}
                          >
                            {selected?.id === ev.id ? "Scoring Active" : "Score Project"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              {/* Mobile-Optimized Touch Scorecard UI */}
              {selected && (
                <SectionCard
                  title={`Touch Scorecard · ${selected.submission?.title ?? selected.submissionId.slice(0, 8)}`}
                  description="Multi-criteria weighted rubric evaluation with auto-save"
                  actions={
                    selected.status === "CORRECTION_REQUESTED" ? (
                      <Badge variant="destructive" className="text-[11px] font-mono flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Correction Requested
                      </Badge>
                    ) : selected.isLocked && selected.status === "COMPLETED" ? (
                      <Badge variant="outline" className="text-[11px] font-mono border-amber-500/40 text-amber-600 bg-amber-500/10 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Evaluation Locked
                      </Badge>
                    ) : lastAutoSaved ? (
                      <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/5 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Draft Saved {lastAutoSaved}
                      </Badge>
                    ) : null
                  }
                >
                  <div className="space-y-6">
                    {/* Admin Correction Banner if requested */}
                    {selected.status === "CORRECTION_REQUESTED" && selected.correctionReason && (
                      <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-sm">
                          <ShieldAlert className="h-4 w-4" />
                          Admin Correction Requested
                        </p>
                        <p className="font-sans text-foreground/90">{selected.correctionReason}</p>
                        <p className="text-[11px] text-muted-foreground pt-1">Please review the admin feedback, make necessary adjustments, and resubmit your evaluation.</p>
                      </div>
                    )}

                    {/* Locked Evaluation Banner */}
                    {selected.isLocked && selected.status === "COMPLETED" && (
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-sm">
                          <CheckCircle className="h-4 w-4 text-amber-500" />
                          Evaluation Locked & Submitted
                        </p>
                        <p className="font-sans">This evaluation has been locked after your official submission. Admin score edits are disabled by system rule. If a correction is needed, contact the Hackathon Admin to issue a formal correction request.</p>
                      </div>
                    )}

                    {/* Header Score Display */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Calculator className="h-4 w-4 text-primary" />
                          <span>Weighted Total Score</span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Calculated from 4 track criteria weights</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-extrabold font-mono text-primary">
                          {calculateTotalScore()}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono"> / 100</span>
                      </div>
                    </div>

                    {/* Recommendation Selector */}
                    <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                      <Label className="text-xs font-semibold text-foreground">Judge Recommendation</Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={selected.recommendation === "QUALIFY" ? "default" : "outline"}
                          size="sm"
                          className={selected.recommendation === "QUALIFY" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                          disabled={selected.isLocked && selected.status === "COMPLETED"}
                          onClick={() => {
                            setSelected({ ...selected, recommendation: "QUALIFY" });
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          QUALIFY (Advance)
                        </Button>
                        <Button
                          type="button"
                          variant={selected.recommendation === "REJECT" ? "destructive" : "outline"}
                          size="sm"
                          disabled={selected.isLocked && selected.status === "COMPLETED"}
                          onClick={() => {
                            setSelected({ ...selected, recommendation: "REJECT" });
                          }}
                        >
                          <ShieldAlert className="h-4 w-4 mr-1.5" />
                          REJECT (Do Not Advance)
                        </Button>
                      </div>
                    </div>

                    {/* Multi-Criteria Rubric Sliders & Touch Steppers */}
                    <div className="space-y-5">
                      {DEFAULT_HACKATHON_RUBRIC.map((crit) => {
                        const currentScore = rubricScores[crit.name] || 0;
                        const isLocked = selected.isLocked && selected.status === "COMPLETED";
                        return (
                          <div key={crit.name} className="p-4 rounded-xl border border-border bg-card/60 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-sm text-foreground">{crit.name}</span>
                                <Badge variant="outline" className="ml-2 font-mono text-[10px] bg-muted">
                                  {crit.weight}% Weight
                                </Badge>
                              </div>
                              <span className="font-mono text-base font-bold text-primary">
                                {currentScore} <span className="text-xs text-muted-foreground font-normal">/ {crit.weight} pts</span>
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{crit.description}</p>

                            {/* Touch-Optimized Steppers and Slider */}
                            <div className="flex items-center gap-3 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLocked}
                                className="h-8 w-9 font-mono text-xs shrink-0"
                                onClick={() => handleScoreStepper(crit.name, -5, crit.weight)}
                              >
                                -5
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLocked}
                                className="h-8 w-8 font-mono text-xs shrink-0"
                                onClick={() => handleScoreStepper(crit.name, -1, crit.weight)}
                              >
                                -1
                              </Button>
                              <div className="flex-1">
                                <Slider
                                  value={[currentScore]}
                                  disabled={!!isLocked}
                                  onValueChange={([v]) => {
                                    if (v !== undefined) {
                                      const next = { ...rubricScores, [crit.name]: v };
                                      setRubricScores(next);
                                      autoSaveDraft(next, Object.values(next).reduce((a, b) => a + b, 0), feedbackText);
                                    }
                                  }}
                                  max={crit.weight}
                                  step={1}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLocked}
                                className="h-8 w-8 font-mono text-xs shrink-0"
                                onClick={() => handleScoreStepper(crit.name, 1, crit.weight)}
                              >
                                +1
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isLocked}
                                className="h-8 w-9 font-mono text-xs shrink-0"
                                onClick={() => handleScoreStepper(crit.name, 5, crit.weight)}
                              >
                                +5
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback Notes */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Detailed Feedback & Judge Notes</span>
                        <span className="text-[11px] text-muted-foreground font-normal">Shared with team & principal</span>
                      </label>
                      <Textarea
                        rows={4}
                        disabled={selected.isLocked && selected.status === "COMPLETED"}
                        placeholder="Provide constructive feedback on technical architecture, code modularity, UI design, and presentation performance..."
                        value={feedbackText}
                        onChange={(e) => {
                          setFeedbackText(e.target.value);
                          autoSaveDraft(rubricScores, calculateTotalScore(), e.target.value);
                        }}
                        className="text-xs"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={handleSaveDraft} disabled={updateEval.isPending || (selected.isLocked && selected.status === "COMPLETED")}>
                        {updateEval.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                        Save Draft Scorecard
                      </Button>
                      <Button onClick={handleSubmitScorecard} disabled={updateEval.isPending || (selected.isLocked && selected.status === "COMPLETED")}>
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        {selected.status === "CORRECTION_REQUESTED" ? "Finalize & Resubmit Scorecard" : "Finalize & Submit Scorecard"}
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Z-Score Judge Bias Normalization Matrix Section */}
              <SectionCard
                title="Judge Bias Calibration & Z-Score Normalization Engine"
                description="Statistical score calibration (Z-score normalization) eliminating strict or lenient panelist bias."
                padded={false}
              >
                <div className="p-4 bg-muted/40 border-b border-border text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-500" />
                    How Z-Score Calibration Works:
                  </p>
                  <p>
                    Raw judge scores ($S$) are converted to $Z$-scores using each judge's mean score ($\mu$) and standard deviation ($\sigma$):
                    <code className="mx-1 font-mono text-[11px] bg-background px-1 py-0.5 rounded border">Z = (S - μ) / σ</code>.
                    Calibrated scores normalize variations across strict and lenient judges to ensure fair winner selection.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-muted/60 border-b border-border font-sans text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Project Title</th>
                        <th className="px-4 py-3">Judge Name</th>
                        <th className="px-4 py-3">Raw Score</th>
                        <th className="px-4 py-3">Judge Mean (μ)</th>
                        <th className="px-4 py-3">Z-Score</th>
                        <th className="px-4 py-3">Calibrated Score</th>
                        <th className="px-4 py-3 font-sans">Panel Bias Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {calibratedEvaluations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground font-sans">
                            No scored evaluations logged for calibration yet.
                          </td>
                        </tr>
                      ) : (
                        calibratedEvaluations.slice(0, 5).map((ev: any) => (
                          <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-sans font-medium text-foreground truncate max-w-[150px]">
                              {ev.submission?.title || ev.submissionId.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3 font-sans text-muted-foreground">
                              {ev.judge ? `${ev.judge.firstName || ""} ${ev.judge.lastName || ""}`.trim() || ev.judge.email : "Judge"}
                            </td>
                            <td className="px-4 py-3 font-bold text-foreground">{ev.rawScore} / 100</td>
                            <td className="px-4 py-3 text-muted-foreground">{ev.judgeMean || 75.0} pts</td>
                            <td className="px-4 py-3 text-primary">{ev.zScore > 0 ? `+${ev.zScore}` : ev.zScore}σ</td>
                            <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                              {ev.calibratedScore} / 100
                            </td>
                            <td className="px-4 py-3 font-sans">
                              <Badge
                                variant={ev.biasRating === "STRICT" ? "destructive" : ev.biasRating === "LENIENT" ? "secondary" : "default"}
                                className={ev.biasRating === "BALANCED" ? "bg-emerald-600" : ""}
                              >
                                {ev.biasRating}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <SectionCard title="Round Evaluation Progress" description="Pending vs completed scorecards">
                {roundData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No competition round data logged yet.</p>
                ) : (
                  <GroupedBarChart
                    data={roundData}
                    xKey="round"
                    series={[
                      { key: "completed", label: "Completed" },
                      { key: "pending", label: "Pending" },
                    ]}
                    stacked
                    height={220}
                  />
                )}
              </SectionCard>

              <SectionCard title="Panel Completion" description={`${panelData.length} active judges`}>
                <div className="space-y-4">
                  {panelData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No judges assigned to panel yet.</p>
                  ) : (
                    panelData.map((j) => {
                      const pct = j.total > 0 ? Math.round((j.done / j.total) * 100) : 0;
                      return (
                        <div key={j.name}>
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                            <span className="truncate font-medium text-foreground">{j.name}</span>
                            <span className="shrink-0 tabular-nums text-muted-foreground font-mono">{pct}%</span>
                          </div>
                          <Progress value={pct} className="mt-1.5 h-1.5" />
                        </div>
                      );
                    })
                  )}
                </div>
              </SectionCard>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
