import { createFileRoute } from "@tanstack/react-router";
import { ManagerMentorsPage } from "@/modules/manager/pages/mentors";

export const Route = createFileRoute("/manager/mentors")({
  head: () => ({ meta: [{ title: "ManagerMentorsPage · Eventora Platform" }] }),
  component: ManagerMentorsPage,
});
