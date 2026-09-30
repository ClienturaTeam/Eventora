import { createFileRoute } from "@tanstack/react-router";
import { CertificateDetails } from "@/modules/certificates/pages/certificate-details";

export const Route = createFileRoute("/certificates/$id")({
  head: () => ({
    meta: [
      { title: "Certificate preview · Eventora Platform" },
      {
        name: "description",
        content: "Preview, verify and download issued certificates with serial validation.",
      },
    ],
  }),
  component: CertificateDetailsRoute,
});

function CertificateDetailsRoute() {
  const { id } = Route.useParams();
  return <CertificateDetails id={id} />;
}
