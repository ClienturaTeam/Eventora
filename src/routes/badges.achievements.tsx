import { createFileRoute } from "@tanstack/react-router";
import { AchievementsPage } from "@/modules/badges/pages/achievements";

export const Route = createFileRoute("/badges/achievements")({
  head: () => ({
    meta: [{ title: "Achievements · Eventora Platform" }],
  }),
  component: AchievementsPage,
});
