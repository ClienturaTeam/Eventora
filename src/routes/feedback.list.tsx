import { createFileRoute } from "@tanstack/react-router";
import { FeedbackListPage } from "@/modules/feedback/pages/feedback-list";

export const Route = createFileRoute("/feedback/list")({
  head: () => ({
    meta: [{ title: "Feedback Inbox · Eventora Platform" }],
  }),
  component: FeedbackListPage,
});
