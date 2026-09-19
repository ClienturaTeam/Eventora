import { createFileRoute } from "@tanstack/react-router";
import { ManagerEvaluationsPage } from "@/modules/manager/pages/evaluations";

export const Route = createFileRoute("/manager/evaluations")({
  head: () => ({ meta: [{ title: "ManagerEvaluationsPage · Eventora Platform" }] }),
  component: ManagerEvaluationsPage,
});
