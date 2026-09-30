import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useManagerJudges, useAssignJudgeCompetition, useManagerEvents, useAssignManagerJudge } from "../hooks/manager.api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function ManagerJudgesPage() {
  const { data: judges = [], isLoading } = useManagerJudges();
  const { data: events = [] } = useManagerEvents();
  const assignCompetition = useAssignJudgeCompetition();
  const createJudge = useAssignManagerJudge();
  
  const [selectedJudge, setSelectedJudge] = useState<any>(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [newJudge, setNewJudge] = useState({ name: "", email: "", expertise: "", bio: "" });

  // Flatten competitions from all events
  const allCompetitions = events.flatMap((event: any) => 
    (event.competitions || []).map((comp: any) => ({
      ...comp,
      eventName: event.name
    }))
  );

  const handleAssign = async () => {
    if (!selectedJudge || !selectedCompetitionId) return;
    
    try {
      await assignCompetition.mutateAsync({ 
        judgeId: selectedJudge.id, 
        competitionId: selectedCompetitionId 
      });
      toast.success("Competition assigned to judge successfully.");
      setSelectedJudge(null);
      setSelectedCompetitionId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign competition.");
    }
  };

  const handleCreateJudge = async () => {
    if (!newJudge.name || !newJudge.email) return;
    try {
      await createJudge.mutateAsync(newJudge);
      toast.success("Judge profile created successfully.");
      setIsCreateModalOpen(false);
      setNewJudge({ name: "", email: "", expertise: "", bio: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create judge profile.");
    }
  };

  return (
    <>
      <ListPageTemplate<any>
        title="Managed Judges"
        description="View judge profiles and assign them to competitions."
        crumbs={[{ label: "Manager" }, { label: "Judges" }]}
        primaryAction={{
          label: "Create Judge Profile",
          onClick: () => setIsCreateModalOpen(true)
        }}
        columns={[
          { 
            key: "user", 
            header: "Judge", 
            render: (row) => (
              <div>
                <div className="font-medium">
                  {row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() : row.userId}
                </div>
                <div className="text-xs text-muted-foreground">{row.user?.email}</div>
              </div>
            ) 
          },
          { 
            key: "expertise", 
            header: "Expertise & Bio", 
            render: (row) => (
              <div className="max-w-xs">
                {row.expertise ? <Badge variant="outline" className="mb-1">{row.expertise}</Badge> : null}
                <div className="text-xs text-muted-foreground truncate" title={row.bio}>
                  {row.bio || 'No bio provided'}
                </div>
              </div>
            ) 
          },
          {
            key: "assignments",
            header: "Assigned Competitions",
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.competitions?.map((c: any) => (
                  <Badge key={c.competitionId} variant="secondary">
                    {c.competition?.name || c.competitionId}
                  </Badge>
                ))}
                {(!row.competitions || row.competitions.length === 0) && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            )
          },
          { 
            key: "createdAt", 
            header: "Added On", 
            render: (row) => <span className="text-sm">{new Date(row.createdAt).toLocaleDateString()}</span> 
          },
        ]}
        rows={judges}
        loading={isLoading}
        searchKeys={["user", "userId", "expertise"]}
        rowActions={[
          {
            label: "Assign Competition",
            onSelect: (row) => setSelectedJudge(row)
          }
        ]}
      />

      <Dialog open={!!selectedJudge} onOpenChange={(open) => !open && setSelectedJudge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Competition to Judge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Competition</label>
              <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a competition..." />
                </SelectTrigger>
                <SelectContent>
                  {allCompetitions.map((comp: any) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.eventName} - {comp.name}
                    </SelectItem>
                  ))}
                  {allCompetitions.length === 0 && (
                    <SelectItem value="none" disabled>No competitions available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedJudge(null)}>Cancel</Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedCompetitionId || selectedCompetitionId === "none" || assignCompetition.isPending}
            >
              {assignCompetition.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Judge Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                value={newJudge.name} 
                onChange={(e) => setNewJudge({ ...newJudge, name: e.target.value })} 
                placeholder="Judge Name" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={newJudge.email} 
                onChange={(e) => setNewJudge({ ...newJudge, email: e.target.value })} 
                placeholder="judge@example.com" 
              />
            </div>
            <div className="space-y-2">
              <Label>Expertise</Label>
              <Input 
                value={newJudge.expertise} 
                onChange={(e) => setNewJudge({ ...newJudge, expertise: e.target.value })} 
                placeholder="e.g. Machine Learning, UI/UX" 
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea 
                value={newJudge.bio} 
                onChange={(e) => setNewJudge({ ...newJudge, bio: e.target.value })} 
                placeholder="Brief description of judge..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateJudge} 
              disabled={!newJudge.name || !newJudge.email || createJudge.isPending}
            >
              {createJudge.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
