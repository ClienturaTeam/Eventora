import { createFileRoute } from "@tanstack/react-router";
import { DiscussionDetailsPage } from "@/modules/community/pages/discussion-details";

export const Route = createFileRoute("/community/discussions/$id")({
  head: () => ({
    meta: [{ title: "Discussion Details · Eventora Platform" }],
  }),
  component: DiscussionDetailsPage,
});
