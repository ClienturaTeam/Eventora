import { createFileRoute } from "@tanstack/react-router";
import { ParticipantProblemStatementsPage } from "@/modules/participant/pages/problem-statements";

export const Route = createFileRoute("/participant/problem-statements")({
  head: () => ({ meta: [{ title: "Problem Statements · Eventora Platform" }] }),
  component: ParticipantProblemStatementsPage,
});
