import { createFileRoute } from "@tanstack/react-router";
import { WinnerDetailsPage } from "@/modules/winners/pages/winner-details";

export const Route = createFileRoute("/winners/$id")({
  head: () => ({
    meta: [{ title: "Winner Details · Eventora Platform" }],
  }),
  component: WinnerDetailsPage,
});
