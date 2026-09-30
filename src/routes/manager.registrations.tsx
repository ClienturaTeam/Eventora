import { createFileRoute } from "@tanstack/react-router";
import { ManagerRegistrationsPage } from "@/modules/manager/pages/registrations";

export const Route = createFileRoute("/manager/registrations")({
  head: () => ({ meta: [{ title: "ManagerRegistrationsPage · Eventora Platform" }] }),
  component: ManagerRegistrationsPage,
});
