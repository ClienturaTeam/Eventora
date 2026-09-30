import { createFileRoute } from "@tanstack/react-router";
import { ParticipantDiscoverEventsPage } from "@/modules/participant/pages/discover-events";

export const Route = createFileRoute("/participant/discover-events")({
  head: () => ({ meta: [{ title: "ParticipantDiscoverEventsPage · Eventora Platform" }] }),
  component: ParticipantDiscoverEventsPage,
});
