import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/coordinator/")({
  head: () => ({
    meta: [{ title: "Coordinator Dashboard · Eventora Platform" }],
  }),
  component: CoordinatorDashboard,
});

function CoordinatorDashboard() {
  const { user } = useAuth();
  const firstName = user?.firstName || "Coordinator";

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your hackathon proposals and assigned events from here.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/hackathon-proposals" className="block group">
          <Card className="h-full transition-colors hover:bg-accent/50 border-primary/20">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-4">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">My Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground pt-2">
                Submit new hackathon themes, view the status of your pending proposals, and respond to manager feedback.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/events" className="block group">
          <Card className="h-full transition-colors hover:bg-accent/50 border-primary/20">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-4">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Assigned Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground pt-2">
                View hackathons and events that have been assigned to you. Manage teams, schedules, and operations.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
