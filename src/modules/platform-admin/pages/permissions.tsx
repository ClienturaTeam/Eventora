import { ListPageTemplate } from "@/components/templates/list-page";
import type { Column } from "@/components/ds/data-table";
import { useRoles, useDeleteRole } from "../services/roles.api";
import { PlatformRole } from "../types/platform-admin.types";
import { useState, useMemo } from "react";
import { RoleDialog } from "../components/role-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, Users, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const SYSTEM_ROLES = ["Sudo Admin", "Platform Admin", "Admin", "Organization Admin"];

type RoleRow = PlatformRole & {
  _count?: { members: number };
  organizationId?: string | null;
  permissions?: Array<any>;
};

const columns: Column<RoleRow>[] = [
  {
    key: "name",
    header: "Role Name",
    sortable: true,
    render: (row) => {
      const isSystem = SYSTEM_ROLES.includes(row.name);
      return (
        <div className="flex items-center gap-2">
          {isSystem ? (
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{row.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">ID: {row.id.slice(0, 8)}</span>
          </div>
        </div>
      );
    },
  },
  {
    key: "scope",
    header: "Scope",
    sortable: true,
    render: (row) => {
      const isGlobal = !row.organizationId || row.name === "Sudo Admin" || row.name === "Platform Admin";
      return (
        <Badge
          variant={isGlobal ? "default" : "outline"}
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
        >
          {isGlobal ? "Global Platform" : "Organization"}
        </Badge>
      );
    },
  },
  {
    key: "description",
    header: "Description",
    sortable: false,
    render: (row) => (
      <span className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
        {row.description || "No description provided."}
      </span>
    ),
  },
  {
    key: "users",
    header: "Assigned Users",
    sortable: true,
    render: (row) => {
      const userCount = row._count?.members ?? row.users ?? 0;
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{userCount} {userCount === 1 ? "User" : "Users"}</span>
        </div>
      );
    },
  },
  {
    key: "permissions",
    header: "Configured Permissions",
    sortable: false,
    render: (row) => {
      const perms = Array.isArray(row.permissions) ? row.permissions : [];
      const permCount = perms.length;

      if (permCount === 0) {
        return <span className="text-xs text-muted-foreground italic">No permissions</span>;
      }

      // Extract unique categories from permission actions
      const actions: string[] = perms.map((p) => p.permission?.action || p.action || "").filter(Boolean);
      const categories = Array.from(
        new Set(
          actions.map((act) => {
            const prefix = act.split(".")[0];
            return prefix ? prefix.replace(/_/g, " ") : "general";
          })
        )
      );

      const topCategories = categories.slice(0, 3);
      const remainingCatCount = categories.length - 3;

      return (
        <div className="flex flex-col gap-1 max-w-[340px]">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="font-bold text-[11px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              {permCount} {permCount === 1 ? "Permission" : "Permissions"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {topCategories.map((cat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize"
              >
                {cat}
              </span>
            ))}
            {remainingCatCount > 0 && (
              <span className="inline-flex items-center rounded-md border border-border/40 bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{remainingCatCount} more
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    key: "status",
    header: "Role Type",
    sortable: true,
    render: (row) => {
      const isSystem = SYSTEM_ROLES.includes(row.name);
      return (
        <Badge
          variant={isSystem ? "default" : "secondary"}
          className={`text-[11px] font-semibold px-2 py-0.5 ${
            isSystem ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-blue-500/10 text-blue-500 border-blue-500/30"
          }`}
        >
          {isSystem ? "System Core" : "Custom Role"}
        </Badge>
      );
    },
  },
];

export function PermissionsPage() {
  const { data = [], isLoading, isError } = useRoles();
  const deleteMutation = useDeleteRole();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);

  const handleCreate = () => {
    setSelectedRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (role: PlatformRole) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const handleDelete = async (role: PlatformRole) => {
    if (SYSTEM_ROLES.includes(role.name)) {
      toast.error(`System Core role "${role.name}" is protected and cannot be deleted.`);
      return;
    }

    if (confirm(`Are you sure you want to delete custom role "${role.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(role.id);
        toast.success(`Role "${role.name}" deleted successfully.`);
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } catch (e: any) {
        toast.error(e?.message || "Failed to delete role.");
      }
    }
  };

  const rows: RoleRow[] = useMemo(() => {
    return (data as RoleRow[]).map((r) => ({
      ...r,
      scope: !r.organizationId || r.name === "Sudo Admin" || r.name === "Platform Admin" ? "Global" : "Organization",
    }));
  }, [data]);

  return (
    <>
      <ListPageTemplate<RoleRow>
        title="Roles & Access Control"
        description="Configure enterprise roles, assign access capabilities, and govern platform permissions."
        crumbs={[{ label: "Platform" }, { label: "Role Management" }]}
        columns={columns}
        rows={rows}
        loading={isLoading}
        error={isError}
        searchKeys={["name", "scope", "description"]}
        facet={{
          label: "Scope",
          key: "scope",
          options: ["Global", "Organization"],
        }}
        createLabel="Create Custom Role"
        onCreate={handleCreate}
        rowActions={[
          { label: "Configure Access", onSelect: handleEdit },
          { label: "Delete Role", onSelect: handleDelete },
        ]}
      />
      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={selectedRole}
      />
    </>
  );
}
