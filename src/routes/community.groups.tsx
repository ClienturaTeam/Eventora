import { createFileRoute } from "@tanstack/react-router";
import { GroupsPage } from "@/modules/community/pages/groups";

export const Route = createFileRoute("/community/groups")({
  head: () => ({
    meta: [{ title: "Groups · Eventora Platform" }],
  }),
  component: GroupsPage,
});
