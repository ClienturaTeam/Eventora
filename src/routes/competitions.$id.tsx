import { createFileRoute } from "@tanstack/react-router";
import { CompetitionDetailsPage } from "@/modules/competitions/pages/competition-details";

export const Route = createFileRoute("/competitions/$id")({
  head: () => ({
    meta: [
      { title: "AI for Accessibility Track · Eventora Platform" },
      { name: "description", content: "Hackathon · 3 rounds · ₹50,00,000 prize pool" },
      { property: "og:title", content: "AI for Accessibility Track · Eventora Platform" },
      { property: "og:description", content: "Hackathon · 3 rounds · ₹50,00,000 prize pool" },
    ],
  }),
  component: CompetitionDetailsPage,
});
