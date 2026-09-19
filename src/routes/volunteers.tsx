import { createFileRoute } from "@tanstack/react-router";
import { VolunteersPage } from "@/modules/volunteers/pages/volunteers-page";

export const Route = createFileRoute("/volunteers")({
  head: () => ({
    meta: [
      { title: "Volunteers · Eventora Platform" },
      {
        name: "description",
        content: "Volunteer management, event assignments, shifts and hours.",
      },
      { property: "og:title", content: "Volunteers · Eventora Platform" },
      {
        property: "og:description",
        content: "Volunteer management, event assignments, shifts and hours.",
      },
    ],
  }),
  component: VolunteersPage,
});
