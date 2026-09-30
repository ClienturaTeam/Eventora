import { createFileRoute } from "@tanstack/react-router";
import { CoursesListPage } from "@/modules/learning/pages/courses";

export const Route = createFileRoute("/learning/courses/")({
  head: () => ({
    meta: [{ title: "Courses · Eventora Platform" }],
  }),
  component: CoursesListPage,
});
