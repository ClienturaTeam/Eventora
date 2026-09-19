import { createFileRoute } from "@tanstack/react-router";
import { PermissionsPage } from "@/modules/platform-admin/pages/permissions";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [{ title: "Roles & Permissions · Eventora Platform" }],
  }),
  component: PermissionsPage,
});
