import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Bell,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotifications } from "@/modules/communication/services/notifications.api";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { toggleSidebar, openMobile } = useSidebar();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { data: notificationsData } = useNotifications(1, 10);
  const unreadCount = notificationsData?.unreadCount || 0;

  const getDashboardUrl = () => {
    if (!user || !user.memberships || user.memberships.length === 0) return "/events";
    const roleName = user.memberships[0]?.role?.name;
    if (roleName === "Platform Admin") return "/platform-admin";
    if (roleName === "Organization Admin" || roleName === "Manager") return "/manager";
    if (roleName === "Student Coordinator") return "/coordinator";
    if (roleName === "Faculty Coordinator") return "/faculty-coordinator";
    if (roleName === "Participant") return "/participant";
    if (roleName === "Judge") return "/evaluations";
    if (roleName === "Mentor") return "/teams";
    if (roleName === "Volunteer") return "/volunteers";
    return "/events";
  };

  const roleName = user?.memberships?.[0]?.role?.name;
  const eventsUrl = roleName === "Participant" ? "/participant/discover-events" : roleName === "Manager" ? "/manager/events" : "/events";
  const standingsUrl = roleName === "Participant" ? "/leaderboard" : "/winners";

  const navItems = [
    {
      label: "Home",
      to: getDashboardUrl(),
      icon: LayoutDashboard,
      isActive: currentPath === getDashboardUrl() || (currentPath.startsWith("/manager") && !currentPath.includes("events")),
    },
    {
      label: "Events",
      to: eventsUrl,
      icon: CalendarDays,
      isActive: currentPath.includes("/events") || currentPath.includes("discover-events"),
    },
    {
      label: "Standings",
      to: standingsUrl,
      icon: Trophy,
      isActive: currentPath.includes("/winners") || currentPath.includes("/leaderboard"),
    },
    {
      label: "Alerts",
      to: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: currentPath.includes("/notifications"),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl px-1.5 py-1.5 shadow-lg supports-[backdrop-filter]:bg-background/85"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to as any}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 select-none active:scale-95",
                item.isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground/80 hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 transition-transform", item.isActive && "scale-110")} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="mt-1 leading-none tracking-tight">{item.label}</span>
              {item.isActive && (
                <span className="absolute bottom-0 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* Menu toggle for opening full sidebar on mobile */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={openMobile ? "Close menu" : "Open full menu"}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 select-none cursor-pointer active:scale-95",
            openMobile
              ? "text-primary font-semibold"
              : "text-muted-foreground/80 hover:text-foreground"
          )}
        >
          <Menu className={cn("h-5 w-5 transition-transform", openMobile && "scale-110 text-primary")} />
          <span className="mt-1 leading-none tracking-tight">Menu</span>
          {openMobile && (
            <span className="absolute bottom-0 h-0.5 w-4 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </nav>
  );
}
