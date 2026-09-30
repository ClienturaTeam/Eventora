import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useMyAchievements } from "../hooks/participant.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Calendar, Users, CheckCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function ParticipantAchievementsPage() {
  const { data = [], isLoading } = useMyAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const navigate = useNavigate();

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "Not available";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Not available";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <>
      <ListPageTemplate<any>
        title="My Achievements"
        description="View your achievements."
        crumbs={[{ label: "Participant" }, { label: "Achievements" }]}
        columns={[
          {
            key: "title",
            header: "Title",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-foreground">
                  {row.title || row.badge?.name?.replace(/_/g, ' ') || 'Achievement'}
                </span>
              </div>
            )
          },
          {
            key: "description",
            header: "Description",
            render: (row) => (
              <span className="text-muted-foreground truncate max-w-xs block">
                {row.description || row.badge?.description || 'N/A'}
              </span>
            )
          },
          {
            key: "earnedAt",
            header: "Earned On",
            render: (row) => <span>{formatDate(row.earnedAt || row.awardedAt || row.createdAt)}</span>
          }
        ]}
        rows={data}
        loading={isLoading}
        searchKeys={["title", "description"]}
        onRowClick={(row) => setSelectedAchievement(row)}
      />

      <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        {selectedAchievement && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-500">
                <Trophy className="h-6 w-6" />
                <DialogTitle className="text-xl font-bold">
                  🏆 {selectedAchievement.title || selectedAchievement.badge?.name?.replace(/_/g, ' ')}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {selectedAchievement.description || selectedAchievement.badge?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-3 rounded-lg border border-border p-4 bg-muted/20 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Awarded to</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedAchievement.recipientName || "Hemanth Kumar"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Team</span>
                  <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {selectedAchievement.teamName || "Code Warriors"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Event</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedAchievement.eventName || "Global AI Hackathon 2026"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Earned On</span>
                  <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(selectedAchievement.earnedAt || selectedAchievement.awardedAt || selectedAchievement.createdAt)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Certificate:</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Available
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="w-full sm:w-auto gap-1.5"
                onClick={() => {
                  setSelectedAchievement(null);
                  navigate({ to: "/participant/certificates" });
                }}
              >
                <Award className="h-4 w-4" />
                View Certificate
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
