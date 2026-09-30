import { createFileRoute } from "@tanstack/react-router";
import { ParticipantRegistrationsPage } from "@/modules/participant/pages/registrations";

export const Route = createFileRoute("/participant/registrations")({
  head: () => ({ meta: [{ title: "ParticipantRegistrationsPage · Eventora Platform" }] }),
  component: ParticipantRegistrationsPage,
});
