import { createFileRoute } from "@tanstack/react-router";
import { ResourcesPage } from "@/modules/learning/pages/resources";

export const Route = createFileRoute("/learning/resources")({
  head: () => ({
    meta: [{ title: "Resource Library · Eventora Platform" }],
  }),
  component: ResourcesPage,
});
