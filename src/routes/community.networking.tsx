import { createFileRoute } from "@tanstack/react-router";
import { NetworkingPage } from "@/modules/community/pages/networking";

export const Route = createFileRoute("/community/networking")({
  head: () => ({
    meta: [{ title: "Networking · Eventora Platform" }],
  }),
  component: NetworkingPage,
});
