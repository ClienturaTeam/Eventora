import { createFileRoute } from "@tanstack/react-router";
import { WinnerListPage } from "@/modules/winners/pages/winner-list";

export const Route = createFileRoute("/winners/list")({
  head: () => ({
    meta: [{ title: "Winners · Eventora Platform" }],
  }),
  component: WinnerListPage,
});
