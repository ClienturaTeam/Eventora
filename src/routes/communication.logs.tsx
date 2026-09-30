import { createFileRoute } from "@tanstack/react-router";
import { CommunicationLogsPage } from "@/modules/communication/pages/logs";

export const Route = createFileRoute("/communication/logs")({
  head: () => ({
    meta: [{ title: "Message Logs · Eventora Platform" }],
  }),
  component: CommunicationLogsPage,
});
