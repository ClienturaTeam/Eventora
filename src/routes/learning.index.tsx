import { createFileRoute } from "@tanstack/react-router";
import { LearningDashboard } from "@/modules/learning/pages/dashboard";

export const Route = createFileRoute("/learning/")({
  head: () => ({
    meta: [{ title: "Learning Center · Eventora Platform" }],
  }),
  component: LearningDashboard,
});
