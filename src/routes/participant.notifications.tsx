import { createFileRoute } from "@tanstack/react-router";
import { ParticipantNotificationsPage } from "@/modules/participant/pages/notifications";

export const Route = createFileRoute("/participant/notifications")({
  head: () => ({ meta: [{ title: "ParticipantNotificationsPage · Eventora Platform" }] }),
  component: ParticipantNotificationsPage,
});
