import { createFileRoute } from "@tanstack/react-router";
import { CertificateList } from "@/modules/certificates/pages/certificate-list";

export const Route = createFileRoute("/certificates/")({
  head: () => ({
    meta: [
      { title: "Certificates · Eventora Platform" },
      {
        name: "description",
        content: "Issue and manage digital certificates.",
      },
    ],
  }),
  component: CertificateList,
});
