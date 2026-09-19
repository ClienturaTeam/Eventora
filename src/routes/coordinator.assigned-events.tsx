import { createFileRoute } from "@tanstack/react-router";
import { AssignedEventsPage } from "@/modules/events/pages/assigned-events";

export const Route = createFileRoute("/coordinator/assigned-events")({
  head: () => ({
    meta: [{ title: "Assigned Events · Eventora Platform" }],
  }),
  component: AssignedEventsPage,
});
