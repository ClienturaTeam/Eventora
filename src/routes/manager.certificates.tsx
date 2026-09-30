import { createFileRoute } from "@tanstack/react-router";
import { ManagerCertificatesPage } from "@/modules/manager/pages/certificates";

export const Route = createFileRoute("/manager/certificates")({
  head: () => ({ meta: [{ title: "ManagerCertificatesPage · Eventora Platform" }] }),
  component: ManagerCertificatesPage,
});
