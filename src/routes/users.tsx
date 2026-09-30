import { createFileRoute } from "@tanstack/react-router";
import { ListPageTemplate } from "@/components/templates/list-page";
import { StatusChip } from "@/components/ds/status-chip";
import type { Column } from "@/components/ds/data-table";
import { AuthUser, useAuth } from "@/lib/auth";
import { useUsers, useUpdateUserStatus, useDeleteUser } from "@/modules/users/services/users.api";
import { UserDialog } from "@/modules/users/components/user-dialog";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { maskEmail } from "@/lib/utils";

type Row = AuthUser & { roleName: string };



export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users · Eventora Platform" },
      {
        name: "description",
        content: "Directory of every platform user with roles, organizations and security posture.",
      },
      { property: "og:title", content: "Users · Eventora Platform" },
      {
        property: "og:description",
        content: "Directory of every platform user with roles, organizations and security posture.",
      },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { user: authUser, hasPermission } = useAuth();
  const roleName = authUser?.memberships?.[0]?.role?.name;

  const canViewPage =
    hasPermission("users.read") ||
    hasPermission("users.manage") ||
    hasPermission("platform.manage") ||
    hasPermission("organization.manage") ||
    roleName === "Sudo Admin" ||
    roleName === "Platform Admin" ||
    roleName === "Admin" ||
    roleName === "Organization Admin";

  const canCreate =
    hasPermission("users.manage") ||
    hasPermission("users.create") ||
    hasPermission("platform.manage") ||
    hasPermission("organization.manage") ||
    roleName === "Sudo Admin" ||
    roleName === "Platform Admin" ||
    roleName === "Admin" ||
    roleName === "Organization Admin";

  const canEdit =
    hasPermission("users.manage") ||
    hasPermission("platform.manage") ||
    hasPermission("organization.manage") ||
    roleName === "Sudo Admin" ||
    roleName === "Platform Admin" ||
    roleName === "Admin" ||
    roleName === "Organization Admin";

  const canManageStatus =
    hasPermission("users.manage") ||
    hasPermission("users.update_student_coordinator") ||
    hasPermission("users.update_participant") ||
    hasPermission("platform.manage") ||
    hasPermission("organization.manage") ||
    roleName === "Sudo Admin" ||
    roleName === "Platform Admin" ||
    roleName === "Admin" ||
    roleName === "Organization Admin";

  const canDelete =
    hasPermission("users.manage") ||
    hasPermission("platform.manage") ||
    roleName === "Sudo Admin" ||
    roleName === "Platform Admin" ||
    roleName === "Admin";

  const { data: users = [], isLoading, isError } = useUsers();
  const deleteMutation = useDeleteUser();
  const updateStatusMutation = useUpdateUserStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  const rows: Row[] = useMemo(() => {
    return users.map((u: any) => ({
      ...u,
      roleName: u.memberships?.[0]?.role?.name || "Member",
    }));
  }, [users]);

  const columns: Column<Row>[] = useMemo(() => [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row) => <span className="font-medium">{row.firstName} {row.lastName}</span>,
    },
    {
      key: "email",
      header: "Email Address",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs">
          {canEdit ? row.email : maskEmail(row.email)}
        </span>
      ),
    },
    {
      key: "roleName",
      header: "Role",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border bg-muted/30">
          {row.roleName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusChip status={row.status} />,
    },
    { 
      key: "createdAt", 
      header: "Joined",
      render: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>
    },
  ], [canEdit]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.roleName))).sort();
  }, [rows]);

  const handleEdit = (user: AuthUser) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleDelete = async (user: AuthUser) => {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      try {
        await deleteMutation.mutateAsync(user.id);
        toast.success("User deleted successfully");
      } catch (e: any) {
        toast.error(e?.message || "Failed to delete user");
      }
    }
  };

  const handleStatusChange = async (user: AuthUser, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: user.id, status });
      toast.success(`User status updated to ${status}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    }
  };

  const rowActions = useMemo(() => {
    const actions: { label: string; onSelect: (user: Row) => void }[] = [];
    if (canEdit) actions.push({ label: "Edit profile", onSelect: handleEdit });
    if (canManageStatus) {
      actions.push({ label: "Activate", onSelect: (user) => handleStatusChange(user, "ACTIVE") });
      actions.push({ label: "Suspend", onSelect: (user) => handleStatusChange(user, "SUSPENDED") });
    }
    if (canDelete) actions.push({ label: "Delete", onSelect: handleDelete });
    return actions;
  }, [canEdit, canManageStatus, canDelete]);

  if (!canViewPage) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="max-w-md text-muted-foreground">
          You do not have permission to access the user management directory.
        </p>
      </div>
    );
  }

  const listPageProps: any = {
    title: "Users",
    description: "Directory of every platform user with roles, organizations and security posture.",
    crumbs: [{ label: "Administration" }, { label: "Users" }],
    columns,
    rows,
    loading: isLoading,
    error: isError,
    searchKeys: ["firstName", "lastName", "email"],
    statusKey: "status",
    dateKey: "createdAt",
    facet: {
      label: "Role",
      key: "roleName",
      options: roleOptions,
    },
    stats: [
      { label: "Total users", value: String(rows.length) },
      { label: "Active users", value: String(rows.filter((u) => u.status === "ACTIVE").length) },
    ],
    rowActions,
  };

  if (canCreate) {
    listPageProps.createLabel = "Create User";
    listPageProps.onCreate = handleCreate;
  }

  return (
    <>
      <ListPageTemplate<Row> {...listPageProps} />
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
      />
    </>
  );
}
