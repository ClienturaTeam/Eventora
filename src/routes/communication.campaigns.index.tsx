import { createFileRoute } from "@tanstack/react-router";
import { CommunicationCampaignsPage } from "@/modules/communication/pages/campaigns";

export const Route = createFileRoute("/communication/campaigns/")({
  head: () => ({
    meta: [{ title: "Campaigns · Eventora Platform" }],
  }),
  component: CommunicationCampaignsPage,
});
