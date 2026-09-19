import { createFileRoute } from "@tanstack/react-router";
import { WorkshopsPage } from "@/modules/learning/pages/workshops";

export const Route = createFileRoute("/learning/workshops")({
  head: () => ({
    meta: [{ title: "Workshops · Eventora Platform" }],
  }),
  component: WorkshopsPage,
});
