import { createFileRoute } from "@tanstack/react-router";
import { ParticipantProblemStatementsPage } from "@/modules/participant/pages/problem-statements";

type ProblemStatementsSearch = {
  eventId?: string | undefined;
};

export const Route = createFileRoute("/participant/problem-statements")({
  validateSearch: (search: Record<string, unknown>): ProblemStatementsSearch => {
    const eventIdVal = search["eventId"];
    return {
      eventId: typeof eventIdVal === "string" ? eventIdVal : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Problem Statements · Eventora Platform" }] }),
  component: ParticipantProblemStatementsPage,
});
