import { createFileRoute } from "@tanstack/react-router";
import { FeedbackDashboard } from "@/modules/feedback/pages/dashboard";

export const Route = createFileRoute("/feedback/")({
  head: () => ({
    meta: [{ title: "Feedback Dashboard · Eventora Platform" }],
  }),
  component: FeedbackDashboard,
});
