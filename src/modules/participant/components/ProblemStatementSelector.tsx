import { useState } from "react";
import { useProblemStatements, useSelectProblemStatement, useMyTeams } from "../hooks/participant.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, FileCode, CheckCircle2, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function ProblemStatementSelector() {
  const { data: statements = [], isLoading: loadingStatements } = useProblemStatements();
  const { data: teams = [], isLoading: loadingTeams } = useMyTeams();
  const selectMutation = useSelectProblemStatement();

  const [confirmStatement, setConfirmStatement] = useState<any>(null);

  const primaryTeam = teams[0]?.team;
  const isLocked = primaryTeam?.problemStatementLocked;
  const selectedId = primaryTeam?.problemStatementId;
  const selectedStatement = statements.find((s: any) => s.id === selectedId) || primaryTeam?.problemStatement;

  const handleSelect = async () => {
    if (!confirmStatement) return;
    try {
      await selectMutation.mutateAsync(confirmStatement.id);
      toast.success(`Problem Statement ${confirmStatement.code} selected and locked!`);
      setConfirmStatement(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to select problem statement.");
    }
  };

  if (loadingStatements || loadingTeams) {
    return (
      <div className="flex h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Hackathon Problem Statements</h2>
          </div>

          {isLocked && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 px-3 py-1 text-xs gap-1.5 font-semibold">
              <Lock className="h-3.5 w-3.5" /> Selection Locked Permanently
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Review released problem statements and select ONE for your team. Selection is final and locked immediately upon submission.
        </p>
      </div>

      {isLocked && selectedStatement && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <ShieldCheck className="h-5 w-5" /> Active Problem Statement Locked
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-foreground">
            <div className="flex items-center gap-2 font-mono font-bold text-sm text-primary">
              <span>{selectedStatement.code}</span>
              <span>•</span>
              <span>{selectedStatement.title}</span>
            </div>
            <p className="text-muted-foreground">{selectedStatement.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statements.map((statement: any) => {
          const isSelectedThis = selectedId === statement.id;

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
              </CardHeader>

              <CardFooter className="pt-2 border-t mt-auto">
                {isSelectedThis ? (
                  <Button disabled size="sm" className="w-full bg-emerald-600 text-white gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Selected & Locked
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={isLocked ? "outline" : "default"}
                    disabled={isLocked || selectMutation.isPending}
                    className="w-full gap-1.5"
                    onClick={() => setConfirmStatement(statement)}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </>
                    ) : (
                      "Select Problem Statement"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Modal for confirmation */}
      <Dialog open={!!confirmStatement} onOpenChange={(open) => !open && setConfirmStatement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Permanent Lock
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground">
              Are you sure you want to select <span className="font-bold text-primary">{confirmStatement?.code}: {confirmStatement?.title}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠️ Strict Immutability Rule</p>
            <p>Once submitted, this problem statement selection becomes permanently locked. You cannot change, replace, or delete your selection afterwards.</p>
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
