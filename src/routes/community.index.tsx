import { createFileRoute } from "@tanstack/react-router";
import { CommunityDashboard } from "@/modules/community/pages/dashboard";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [{ title: "Community Dashboard · Eventora Platform" }],
  }),
  component: CommunityDashboard,
});
