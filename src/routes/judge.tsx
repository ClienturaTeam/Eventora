import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { JudgeProfileProvider } from "@/modules/judges/hooks/use-judge-profile";
import { JudgeProfileSelector } from "@/modules/judges/components/profile-selector";

export const Route = createFileRoute("/judge")({
  component: JudgeLayout,
});

function JudgeLayout() {
  const { user } = useAuth();
  
  const roleName = user?.memberships?.[0]?.role?.name;
  if (roleName !== "Judge") {
    // If not a judge, redirect or show unauthorized
    return <div className="p-8 text-center text-muted-foreground">Unauthorized. You are not a judge.</div>;
  }

  return (
    <JudgeProfileProvider>
      <JudgeProfileSelector>
        <Outlet />
      </JudgeProfileSelector>
    </JudgeProfileProvider>
  );
}
