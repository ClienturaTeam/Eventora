import { createFileRoute } from "@tanstack/react-router";
import { BadgeDetailsPage } from "@/modules/badges/pages/badge-details";

export const Route = createFileRoute("/badges/$id")({
  head: () => ({
    meta: [{ title: "Badge Details · Eventora Platform" }],
  }),
  component: BadgeDetailsPage,
});
