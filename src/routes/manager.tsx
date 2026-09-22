import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Calendar, Users } from "lucide-react";

const navigation = [
  { name: 'Events', href: '/manager/events', icon: Calendar },
  { name: 'Coordinators', href: '/manager/coordinators', icon: Users },
];

export const Route = createFileRoute("/manager")({
  beforeLoad: ({ context }) => {
    // The auth context provides the user. We assume it's passed or available.
    // If we can't access hooks inside beforeLoad directly, we can check inside the component.
  },
  component: ManagerLayout,
});

function ManagerLayout() {
  const { user } = useAuth();
  
  const roleName = user?.memberships?.[0]?.role?.name || "User";
  const allowedRoles = ["Admin", "Sudo Admin", "Platform Admin", "Organization Admin", "Manager"];
  
  if (!allowedRoles.includes(roleName)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-4">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          You do not have administrative permissions to access the management portal.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
