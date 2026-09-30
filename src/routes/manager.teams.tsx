import { createFileRoute } from "@tanstack/react-router";
import { ManagerTeamsPage } from "@/modules/manager/pages/teams";

export const Route = createFileRoute("/manager/teams")({
  head: () => ({ meta: [{ title: "ManagerTeamsPage · Eventora Platform" }] }),
  component: ManagerTeamsPage,
});
