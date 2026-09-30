import { useState } from "react";
import { useEventTeam, useAssignFacultyCoordinator, useAssignStudentCoordinator, useRemoveStudentCoordinator } from "../services/events.api";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ds/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function EventAssignment({ eventId }: { eventId: string }) {
  const { data: team = [], isLoading: isTeamLoading } = useEventTeam(eventId);
  const { hasPermission, user, activeOrganization } = useAuth();
  
  const assignFacultyCoordinator = useAssignFacultyCoordinator();
  const assignStudentCoordinator = useAssignStudentCoordinator();
  const removeStudentCoordinator = useRemoveStudentCoordinator();
  
  const [isFacultyOpen, setIsFacultyOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: members = [] } = useQuery({
    queryKey: ["organization", "members"],
    queryFn: async () => {
      const orgId = activeOrganization || user?.memberships?.[0]?.organization?.id;
      if (!orgId) return [];
      const res = await fetchApi(`/organizations/${orgId}/members`);
      return res.data as any[];
    },
    enabled: isFacultyOpen || isStudentOpen,
  });

  const facultyCoordinators = members.filter((m: any) => m.role.name === "Faculty Coordinator");
  const studentCoordinators = members.filter((m: any) => m.role.name === "Student Coordinator");
  
  const assignedFacultyCoordinator = team.find((m) => m.responsibility === "Faculty Coordinator");
  const assignedStudentCoordinator = team.find((m) => m.responsibility === "Primary Student Coordinator" || m.responsibility === "Student Coordinator");

  const handleAssignFaculty = async () => {
    if (!selectedFacultyId) {
      toast.error("Please select a Faculty Coordinator");
      return;
    }
    try {
      await assignFacultyCoordinator.mutateAsync({ eventId, userId: selectedFacultyId });
      toast.success("Faculty Coordinator assigned successfully");
      setIsFacultyOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign Faculty Coordinator");
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a Student Coordinator");
      return;
    }
    try {
      await assignStudentCoordinator.mutateAsync({ eventId, userId: selectedStudentId });
      toast.success("Student Coordinator assigned successfully");
      setIsStudentOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign Student Coordinator");
    }
  };

  const handleRemoveStudent = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this Student Coordinator?")) {
      return;
    }
    try {
      await removeStudentCoordinator.mutateAsync({ eventId, memberId });
      toast.success("Student Coordinator removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove Student Coordinator");
    }
  };

  if (isTeamLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading assignment...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Faculty Coordinator Assignment (Manager View) */}
      {(hasPermission("events.assign_faculty_coordinator") || assignedFacultyCoordinator) && (
        <SectionCard title="Faculty Coordinator" description="Manage faculty responsibility">
          <div className="flex items-center justify-between p-4 bg-surface border rounded-lg">
            <div>
              {assignedFacultyCoordinator ? (
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <span className="font-medium">
                    {assignedFacultyCoordinator.user.firstName} {assignedFacultyCoordinator.user.lastName}
                  </span>
                </div>
              ) : (
                <div className="text-sm font-medium text-amber-600">Unassigned</div>
              )}
            </div>

            {hasPermission("events.assign_faculty_coordinator") && (
              <Dialog open={isFacultyOpen} onOpenChange={setIsFacultyOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    {assignedFacultyCoordinator ? "Change Faculty Coordinator" : "Assign Faculty Coordinator"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Faculty Coordinator</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Faculty Coordinator" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyCoordinators.map((member) => (
                          <SelectItem key={member.user.id} value={member.user.id}>
                            {member.user.firstName} {member.user.lastName}
                          </SelectItem>
                        ))}
                        {facultyCoordinators.length === 0 && (
                          <SelectItem value="none" disabled>
                            No Faculty Coordinators found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button className="w-full" onClick={handleAssignFaculty} disabled={assignFacultyCoordinator.isPending}>
                      {assignFacultyCoordinator.isPending ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </SectionCard>
      )}

      {/* Student Coordinator Assignment (Faculty Coordinator View) */}
      {(hasPermission("events.assign_student_coordinator") || assignedStudentCoordinator) && (
        <SectionCard title="Student Coordinators" description="Manage student coordinators assigned to this event">
          <div className="flex items-center justify-between p-4 bg-surface border rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                Primary Student Coordinator
              </div>
              {assignedStudentCoordinator ? (
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <span className="font-medium">
                    {assignedStudentCoordinator.user.firstName} {assignedStudentCoordinator.user.lastName}
                  </span>
                </div>
              ) : (
                <div className="text-sm font-medium text-amber-600">Unassigned</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {assignedStudentCoordinator && hasPermission("events.remove_student_coordinator") && (
                <Button variant="ghost" size="icon" onClick={() => handleRemoveStudent(assignedStudentCoordinator.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
              {hasPermission("events.assign_student_coordinator") && (
                <Dialog open={isStudentOpen} onOpenChange={setIsStudentOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      {assignedStudentCoordinator ? "Change Student Coordinator" : "Assign Student Coordinator"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Primary Student Coordinator</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Student Coordinator" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentCoordinators.map((member) => (
                            <SelectItem key={member.user.id} value={member.user.id}>
                              {member.user.firstName} {member.user.lastName}
                            </SelectItem>
                          ))}
                          {studentCoordinators.length === 0 && (
                            <SelectItem value="none" disabled>
                              No Student Coordinators found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button className="w-full" onClick={handleAssignStudent} disabled={assignStudentCoordinator.isPending}>
                        {assignStudentCoordinator.isPending ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
