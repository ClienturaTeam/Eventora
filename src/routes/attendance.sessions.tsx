import { createFileRoute } from "@tanstack/react-router";
import { AttendanceSessionsPage } from "@/modules/attendance/pages/sessions";

export const Route = createFileRoute("/attendance/sessions")({
  head: () => ({
    meta: [{ title: "Session Attendance · Eventora Platform" }],
  }),
  component: AttendanceSessionsPage,
});
