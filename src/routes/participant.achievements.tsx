import { createFileRoute } from "@tanstack/react-router";
import { ParticipantAchievementsPage } from "@/modules/participant/pages/achievements";

export const Route = createFileRoute("/participant/achievements")({
  head: () => ({ meta: [{ title: "ParticipantAchievementsPage · Eventora Platform" }] }),
  component: ParticipantAchievementsPage,
});
