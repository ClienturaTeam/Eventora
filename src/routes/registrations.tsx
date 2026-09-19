import { createFileRoute } from "@tanstack/react-router";
import { RegistrationsListPage } from "@/modules/registrations/pages/registrations-list";

export const Route = createFileRoute("/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations · Eventora Platform" },
      {
        name: "description",
        content: "Approve, review and reconcile participant registrations and payments.",
      },
      { property: "og:title", content: "Registrations · Eventora Platform" },
      {
        property: "og:description",
        content: "Approve, review and reconcile participant registrations and payments.",
      },
    ],
  }),
  component: RegistrationsListPage,
});
