import { createFileRoute } from "@tanstack/react-router";
import { CourseDetailsPage } from "@/modules/learning/pages/course-details";

export const Route = createFileRoute("/learning/courses/$id")({
  head: () => ({
    meta: [{ title: "Course Details · Eventora Platform" }],
  }),
  component: CourseDetailsPage,
});
