import { createFileRoute } from "@tanstack/react-router";
import { ParticipantSubmissionsPage } from "@/modules/participant/pages/submissions";

export const Route = createFileRoute("/participant/submissions")({
  head: () => ({ meta: [{ title: "ParticipantSubmissionsPage · Eventora Platform" }] }),
  component: ParticipantSubmissionsPage,
});
