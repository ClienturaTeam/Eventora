import { createFileRoute } from "@tanstack/react-router";
import { DiscussionsPage } from "@/modules/community/pages/discussions";

export const Route = createFileRoute("/community/discussions/")({
  head: () => ({
    meta: [{ title: "Discussions · Eventora Platform" }],
  }),
  component: DiscussionsPage,
});
