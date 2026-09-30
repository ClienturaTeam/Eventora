import { createFileRoute } from "@tanstack/react-router";
import { ParticipantCertificatesPage } from "@/modules/participant/pages/certificates";

export const Route = createFileRoute("/participant/certificates")({
  head: () => ({ meta: [{ title: "ParticipantCertificatesPage · Eventora Platform" }] }),
  component: ParticipantCertificatesPage,
});
