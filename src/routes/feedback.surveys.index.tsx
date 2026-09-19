import { createFileRoute } from "@tanstack/react-router";
import { SurveysPage } from "@/modules/feedback/pages/surveys";

export const Route = createFileRoute("/feedback/surveys/")({
  head: () => ({
    meta: [{ title: "Surveys · Eventora Platform" }],
  }),
  component: SurveysPage,
});
