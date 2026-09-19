import { createFileRoute } from "@tanstack/react-router";
import { BadgeListPage } from "@/modules/badges/pages/badge-list";

export const Route = createFileRoute("/badges/list")({
  head: () => ({
    meta: [{ title: "Badges · Eventora Platform" }],
  }),
  component: BadgeListPage,
});
