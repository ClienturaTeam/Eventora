import { createFileRoute } from "@tanstack/react-router";
import { PrizeDistributionPage } from "@/modules/winners/pages/prizes";

export const Route = createFileRoute("/winners/prizes")({
  head: () => ({
    meta: [{ title: "Prize Distribution · Eventora Platform" }],
  }),
  component: PrizeDistributionPage,
});
