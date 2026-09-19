import { createFileRoute } from "@tanstack/react-router";
import { CompetitionsListPage } from "@/modules/competitions/pages/competitions-list";

export const Route = createFileRoute("/competitions/")({
  head: () => ({
    meta: [
      { title: "Competitions · Eventora Platform" },
      {
        name: "description",
        content: "Hackathons, case studies and challenges with rounds, teams and prize pools.",
      },
      { property: "og:title", content: "Competitions · Eventora Platform" },
      {
        property: "og:description",
        content: "Hackathons, case studies and challenges with rounds, teams and prize pools.",
      },
    ],
  }),
  component: CompetitionsListPage,
});
