import { createFileRoute } from "@tanstack/react-router";
import { TeamDetailsPage } from "@/modules/teams/pages/team-details";

export const Route = createFileRoute("/teams/$id")({
  head: () => ({
    meta: [
      { title: "Neural Nomads · Eventora Platform" },
      {
        name: "description",
        content: "AI for Accessibility Track · 4 members · led by Rhea Kapoor",
      },
      { property: "og:title", content: "Neural Nomads · Eventora Platform" },
      {
        property: "og:description",
        content: "AI for Accessibility Track · 4 members · led by Rhea Kapoor",
      },
    ],
  }),
  component: TeamDetailsPage,
});
