import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRole, useUpdateRole, usePermissions } from "../services/roles.api";
import { PlatformRole } from "../types/platform-admin.types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search, Shield, Calendar, Sparkles, Users, Trophy,
  FileCheck, Award, Bell, DollarSign, Lock, Heart, CheckSquare, Square
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: PlatformRole | null;
}

interface CategoryGroup {
  id: string;
  title: string;
  description: string;
  icon: any;
  match: (action: string) => boolean;
}

const CATEGORIES: CategoryGroup[] = [
  {
    id: "events",
    title: "Events & Operations",
    description: "Create, view, update and manage platform events and execution.",
    icon: Calendar,
    match: (a) => a.startsWith("events."),
  },
  {
    id: "proposals",
    title: "Hackathon Proposals",
    description: "Proposal creation, reviews, principal approvals and conversion.",
    icon: Sparkles,
    match: (a) => a.startsWith("hackathon_proposals."),
  },
  {
    id: "competitions",
    title: "Competitions, Teams & Registrations",
    description: "Manage competitions, track registrations, and team governance.",
    icon: Trophy,
    match: (a) => a.startsWith("competitions.") || a.startsWith("teams.") || a.startsWith("registrations."),
  },
  {
    id: "users",
    title: "User Management & RBAC",
    description: "Manage platform users, staff roles, and organization memberships.",
    icon: Users,
    match: (a) => a.startsWith("users.") || a.startsWith("platform.") || a.startsWith("organization."),
  },
  {
    id: "evaluations",
    title: "Submissions & Evaluations",
    description: "Submissions review, judge evaluations, scorecards and winners.",
    icon: FileCheck,
    match: (a) => a.startsWith("submissions.") || a.startsWith("evaluations.") || a.startsWith("winners."),
  },
  {
    id: "certificates",
    title: "Certificates & Badges",
    description: "Issue, revoke, and manage digital credentials and achievements.",
    icon: Award,
    match: (a) => a.startsWith("certificates.") || a.startsWith("badges."),
  },
  {
    id: "communications",
    title: "Communications & Alerts",
    description: "Send reminders, announcements, and push notifications.",
    icon: Bell,
    match: (a) => a.startsWith("communications.") || a.startsWith("notifications."),
  },
  {
    id: "payments",
    title: "Payments & Financials",
    description: "View payment records, issue refunds, and export financial reports.",
    icon: DollarSign,
    match: (a) => a.startsWith("payments."),
  },
  {
    id: "security",
    title: "Security & Settings",
    description: "Platform security posture, system settings, and audit logs.",
    icon: Lock,
    match: (a) => a.startsWith("security.") || a.startsWith("settings."),
  },
  {
    id: "community",
    title: "Community & Other Services",
    description: "Community groups, learning resources, feedback surveys, sponsors.",
    icon: Heart,
    match: (a) =>
      a.startsWith("community.") ||
      a.startsWith("learning.") ||
      a.startsWith("feedback.") ||
      a.startsWith("recruitment.") ||
      a.startsWith("sponsors."),
  },
];

function formatPermissionLabel(action: string): string {
  const parts = action.split(".");
  if (parts.length < 2) return action;
  
  const entity = (parts[0] || "").replace(/_/g, " ");
  const verb = parts.slice(1).join(" ").replace(/_/g, " ");

  const verbMap: Record<string, string> = {
    read: "View / Read",
    manage: "Manage All",
    create: "Create",
    update: "Update / Edit",
    delete: "Delete",
    complete: "Complete / Finalize",
    submit: "Submit",
    review: "Review",
    principal_review: "Principal Review",
    create_event: "Convert to Event",
    read_own: "View Own",
    update_own: "Update Own",
    read_assigned: "View Assigned",
    issue: "Issue",
    revoke: "Revoke",
    finalize: "Finalize",
    award: "Award",
    refund: "Issue Refund",
    export: "Export Reports",
    publish: "Publish",
  };

  const formattedVerb = verbMap[verb] || verb.charAt(0).toUpperCase() + verb.slice(1);
  const formattedEntity = entity.charAt(0).toUpperCase() + entity.slice(1);

  return `${formattedVerb} ${formattedEntity}`;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: availablePermissions = [] } = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const queryClient = useQueryClient();

  const isEditing = !!role;

  useEffect(() => {
    if (role && open) {
      setName(role.name || "");
      setDescription(role.description || "");
      const perms = (role as any).permissions?.map((p: any) => p.permissionId || p.permission?.id || p.id) || [];
      setSelectedPermissions(perms);
    } else if (open) {
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    }
    setSearchQuery("");
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    try {
      if (isEditing && role) {
        await updateMutation.mutateAsync({
          id: role.id,
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        });
        toast.success("Role updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        });
        toast.success("Role created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save role");
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleGroup = (permIds: string[], selectAll: boolean) => {
    if (selectAll) {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...permIds])));
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => !permIds.includes(id)));
    }
  };

  const selectAll = () => {
    setSelectedPermissions(availablePermissions.map((p: any) => p.id));
  };

  const deselectAll = () => {
    setSelectedPermissions([]);
  };

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return availablePermissions;
    const q = searchQuery.toLowerCase();
    return availablePermissions.filter(
      (p: any) =>
        p.action.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        formatPermissionLabel(p.action).toLowerCase().includes(q)
    );
  }, [availablePermissions, searchQuery]);

  const categorizedData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = filteredPermissions.filter((p: any) => cat.match(p.action));
      return {
        ...cat,
        items,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [filteredPermissions]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border border-border bg-card">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {isEditing ? `Edit Role: ${role?.name}` : "Create Custom Role"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {isEditing
                      ? "Update role permissions and configuration access controls."
                      : "Define a new role and configure exact permissions for what users in this role can do."}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Basic Info Inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="role-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Event Coordinator, Senior Judge"
                  className="h-10"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Input
                  id="role-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this role is authorized to perform"
                  className="h-10"
                />
              </div>
            </div>

            {/* Permissions Header & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Configure Permissions & Access</h3>
                  <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
                    {selectedPermissions.length} / {availablePermissions.length} Selected
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <CheckSquare className="w-3.5 h-3.5 mr-1" /> Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    className="h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Square className="w-3.5 h-3.5 mr-1" /> Clear All
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search permissions by name or action key (e.g. events.create, users.manage)..."
                  className="pl-9 h-9 text-xs bg-muted/20"
                />
              </div>
            </div>

            {/* Categorized Permissions Grid */}
            <div className="space-y-4">
              {categorizedData.map((cat) => {
                const CatIcon = cat.icon;
                const categoryPermIds = cat.items.map((p: any) => p.id);
                const selectedInCat = categoryPermIds.filter((id) => selectedPermissions.includes(id));
                const allSelected = selectedInCat.length === categoryPermIds.length && categoryPermIds.length > 0;
                const someSelected = selectedInCat.length > 0 && !allSelected;

                return (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-border bg-card/50 overflow-hidden transition-all hover:border-border/80"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
                          <CatIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{cat.title}</span>
                            <Badge
                              variant={selectedInCat.length > 0 ? "default" : "outline"}
                              className="text-[10px] px-1.5 py-0 h-4 font-semibold"
                            >
                              {selectedInCat.length} / {cat.items.length}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroup(categoryPermIds, !allSelected)}
                        className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                      >
                        {allSelected ? "Deselect Group" : "Select Group"}
                      </Button>
                    </div>

                    {/* Permissions Grid Items */}
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.items.map((p: any) => {
                        const isChecked = selectedPermissions.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePermission(p.id)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors select-none ${
                              isChecked
                                ? "border-primary/50 bg-primary/5 text-foreground"
                                : "border-border/50 bg-background/50 hover:bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            <Checkbox
                              id={`perm-${p.id}`}
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(p.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`perm-${p.id}`}
                                className="text-xs font-semibold leading-snug text-foreground block cursor-pointer"
                              >
                                {formatPermissionLabel(p.action)}
                              </label>
                              <span className="text-[10px] font-mono text-muted-foreground truncate block mt-0.5">
                                {p.action}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {categorizedData.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No permissions found matching &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between">
            <div className="text-xs text-muted-foreground hidden sm:block">
              {selectedPermissions.length} permissions configured for this role.
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-9 text-xs font-semibold px-5">
                {isLoading ? "Saving Role..." : isEditing ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
