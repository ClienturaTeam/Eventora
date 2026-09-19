import { createFileRoute } from "@tanstack/react-router";
import { EventDetailsPage } from "@/modules/events/pages/event-details";

export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { title: "Global AI Innovation Summit 2026 · Eventora Platform" },
      { name: "description", content: "Hybrid · Berlin + Online · 14–17 September 2026" },
      { property: "og:title", content: "Global AI Innovation Summit 2026 · Eventora Platform" },
      { property: "og:description", content: "Hybrid · Berlin + Online · 14–17 September 2026" },
    ],
  }),
  component: EventDetailsPage,
});
