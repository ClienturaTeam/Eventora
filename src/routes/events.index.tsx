import { createFileRoute } from "@tanstack/react-router";
import { EventsListPage } from "@/modules/events/pages/events-list";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events · Eventora Platform" },
      {
        name: "description",
        content:
          "Every event across your organizations with registrations, mode and lifecycle state.",
      },
      { property: "og:title", content: "Events · Eventora Platform" },
      {
        property: "og:description",
        content:
          "Every event across your organizations with registrations, mode and lifecycle state.",
      },
    ],
  }),
  component: EventsListPage,
});
