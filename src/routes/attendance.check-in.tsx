import { createFileRoute } from "@tanstack/react-router";
import { AttendeeCheckInPage } from "@/modules/attendance/pages/check-in";

export const Route = createFileRoute("/attendance/check-in")({
  head: () => ({
    meta: [{ title: "Session Check-in · Eventora Platform" }],
  }),
  component: AttendeeCheckInPage,
});
