import { createFileRoute } from "@tanstack/react-router";
import { PlatformAdminDashboard } from "@/modules/platform-admin/pages/dashboard";

export const Route = createFileRoute("/platform-admin/")({
  head: () => ({
    meta: [{ title: "Platform Administration · Eventora Platform" }],
  }),
  component: PlatformAdminDashboard,
});
