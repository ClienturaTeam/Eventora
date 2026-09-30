import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "./notifications";

export const Route = createFileRoute("/participant/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Eventora Platform" }] }),
  component: NotificationsPage,
});
