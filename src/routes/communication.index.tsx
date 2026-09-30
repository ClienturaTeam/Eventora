import { createFileRoute } from "@tanstack/react-router";
import { CommunicationDashboard } from "@/modules/communication/pages/dashboard";

export const Route = createFileRoute("/communication/")({
  head: () => ({
    meta: [{ title: "Communication Center · Eventora Platform" }],
  }),
  component: CommunicationDashboard,
});
