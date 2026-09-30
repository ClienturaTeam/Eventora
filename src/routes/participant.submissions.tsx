import { createFileRoute } from "@tanstack/react-router";
import { ParticipantSubmissionsPage } from "@/modules/participant/pages/submissions";
import { z } from "zod";

const submissionsSearchSchema = z.object({
  eventId: z.string().optional(),
});

export const Route = createFileRoute("/participant/submissions")({
  validateSearch: (search) => submissionsSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "ParticipantSubmissionsPage · Eventora Platform" }] }),
  component: ParticipantSubmissionsPage,
});

