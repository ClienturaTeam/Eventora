import { createFileRoute } from "@tanstack/react-router";
import { ManagerTransactionsPage } from "@/modules/manager/pages/transactions";

export const Route = createFileRoute("/manager/transactions")({
  head: () => ({
    meta: [{ title: "Transactions · Manager · Eventora Platform" }],
  }),
  component: ManagerTransactionsPage,
});
