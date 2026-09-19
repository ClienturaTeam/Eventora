import { createFileRoute } from "@tanstack/react-router";
import { JudgesPage } from "@/modules/judges/pages/judges-page";

export const Route = createFileRoute("/judges")({
  head: () => ({
    meta: [
      { title: "Judges · Eventora Platform" },
      {
        name: "description",
        content: "Judge panel workload, completion rate and scoring calibration.",
      },
      { property: "og:title", content: "Judges · Eventora Platform" },
      {
        property: "og:description",
        content: "Judge panel workload, completion rate and scoring calibration.",
      },
    ],
  }),
  component: JudgesPage,
});
