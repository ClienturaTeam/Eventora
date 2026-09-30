import { createFileRoute } from "@tanstack/react-router";
import { ManagerJudgesPage } from "@/modules/manager/pages/judges";

export const Route = createFileRoute("/manager/judges")({
  head: () => ({ meta: [{ title: "ManagerJudgesPage · Eventora Platform" }] }),
  component: ManagerJudgesPage,
});
