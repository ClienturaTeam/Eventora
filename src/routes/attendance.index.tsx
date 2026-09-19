import { createFileRoute } from "@tanstack/react-router";
import { AttendanceDashboard } from "@/modules/attendance/pages/dashboard";

export const Route = createFileRoute("/attendance/")({
  head: () => ({
    meta: [{ title: "Attendance Dashboard · Eventora Platform" }],
  }),
  component: AttendanceDashboard,
});
