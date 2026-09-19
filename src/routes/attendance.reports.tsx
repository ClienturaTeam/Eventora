import { createFileRoute } from "@tanstack/react-router";
import { AttendanceReportsPage } from "@/modules/attendance/pages/reports";

export const Route = createFileRoute("/attendance/reports")({
  head: () => ({
    meta: [{ title: "Attendance Reports · Eventora Platform" }],
  }),
  component: AttendanceReportsPage,
});
