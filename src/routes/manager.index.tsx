import { createFileRoute } from "@tanstack/react-router";
import { ManagerDashboard } from "@/modules/manager/pages/dashboard";

export const Route = createFileRoute("/manager/")({
  head: () => ({
    meta: [{ title: "Manager Dashboard · Eventora Platform" }],
  }),
  component: ManagerDashboard,
});
