import { createFileRoute } from "@tanstack/react-router";
import { EvaluationsPage } from "@/modules/evaluations/pages/evaluations-page";

export const Route = createFileRoute("/evaluations")({
  head: () => ({
    meta: [
      { title: "Evaluations · Eventora Platform" },
      {
        name: "description",
        content: "Judge workspace with assignment queue, scorecards and calibration insights.",
      },
      { property: "og:title", content: "Evaluations · Eventora Platform" },
      {
        property: "og:description",
        content: "Judge workspace with assignment queue, scorecards and calibration insights.",
      },
    ],
  }),
  component: EvaluationsPage,
});
