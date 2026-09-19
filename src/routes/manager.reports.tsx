import { createFileRoute } from "@tanstack/react-router";
import { ManagerReportsPage } from "@/modules/manager/pages/reports";

export const Route = createFileRoute("/manager/reports")({
  head: () => ({ meta: [{ title: "ManagerReportsPage · Eventora Platform" }] }),
  component: ManagerReportsPage,
});
