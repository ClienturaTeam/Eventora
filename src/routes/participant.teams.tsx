import { createFileRoute } from "@tanstack/react-router";
import { ParticipantTeamsPage } from "@/modules/participant/pages/teams";

export const Route = createFileRoute("/participant/teams")({
  head: () => ({ meta: [{ title: "ParticipantTeamsPage · Eventora Platform" }] }),
  component: ParticipantTeamsPage,
});
