import { createFileRoute } from "@tanstack/react-router";
import { ParticipantTransactionsPage } from "@/modules/participant/pages/transactions";

export const Route = createFileRoute("/participant/transactions")({
  head: () => ({
    meta: [{ title: "My Transactions · Eventora Platform" }],
  }),
  component: ParticipantTransactionsPage,
});
