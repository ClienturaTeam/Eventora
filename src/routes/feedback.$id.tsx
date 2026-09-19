import { createFileRoute } from "@tanstack/react-router";
import { FeedbackDetailsPage } from "@/modules/feedback/pages/feedback-details";

export const Route = createFileRoute("/feedback/$id")({
  head: () => ({
    meta: [{ title: "Feedback Details · Eventora Platform" }],
  }),
  component: FeedbackDetailsPage,
});
