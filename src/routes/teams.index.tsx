import { createFileRoute } from "@tanstack/react-router";
import { TeamsListPage } from "@/modules/teams/pages/teams-list";

export const Route = createFileRoute("/teams/")({
  head: () => ({
    meta: [
      { title: "Teams · Eventora Platform" },
      {
        name: "description",
        content: "Team formation, membership and progress across all competitions.",
      },
      { property: "og:title", content: "Teams · Eventora Platform" },
      {
        property: "og:description",
        content: "Team formation, membership and progress across all competitions.",
      },
    ],
  }),
  component: TeamsListPage,
});
