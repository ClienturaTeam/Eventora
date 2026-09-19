import { createFileRoute } from "@tanstack/react-router";
import { LicensesPage } from "@/modules/platform-admin/pages/licenses";

export const Route = createFileRoute("/platform-admin/licenses")({
  head: () => ({
    meta: [{ title: "License Management · Eventora Platform" }],
  }),
  component: LicensesPage,
});
