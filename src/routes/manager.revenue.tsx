import { createFileRoute } from "@tanstack/react-router";
import { ManagerRevenuePage } from "@/modules/manager/pages/revenue";

export const Route = createFileRoute("/manager/revenue")({
  head: () => ({ meta: [{ title: "Event Revenue - Eventora Platform" }] }),
  component: ManagerRevenuePage,
});
