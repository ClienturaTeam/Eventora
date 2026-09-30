import { createFileRoute } from "@tanstack/react-router";
import { ManagerEventsPage } from "@/modules/manager/pages/events";

export const Route = createFileRoute("/manager/events")({
  head: () => ({ meta: [{ title: "ManagerEventsPage · Eventora Platform" }] }),
  component: ManagerEventsPage,
});
