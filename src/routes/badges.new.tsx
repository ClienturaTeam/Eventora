import { createFileRoute } from "@tanstack/react-router";
import { BadgeCreatePage } from "@/modules/badges/pages/badge-create";

export const Route = createFileRoute("/badges/new")({
  head: () => ({
    meta: [{ title: "New Badge · Eventora Platform" }],
  }),
  component: BadgeCreatePage,
});
