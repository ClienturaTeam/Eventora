import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell, CalendarDays, ClipboardCheck,
  FileBarChart, FileCheck2, Gavel, GraduationCap,
  HeartHandshake, LayoutDashboard,
  Sparkles, Trophy, Users, UsersRound,
  ClipboardList, Compass, Wallet, Award, Medal,
  FilePlus2, Shield
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

const orgAdminSections = [
  {
    label: "Platform",
    items: [
      { title: "Dashboard", url: "/platform-admin", icon: LayoutDashboard },
      { title: "All Proposals", url: "/platform-admin/all-proposals", icon: Sparkles },
      { title: "Proposal Approvals", url: "/principal/proposals", icon: Sparkles },
      { title: "Approved Proposals", url: "/platform-admin/approved-proposals", icon: Sparkles },
      { title: "Events", url: "/events", icon: CalendarDays },
      { title: "Users", url: "/users", icon: Users },
      { title: "Role Management", url: "/roles", icon: Shield },
      { title: "Reports", url: "/reports", icon: FileBarChart },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
];

const managerSections = [
  {
    label: "Management",
    items: [
      { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
      { title: "All Proposals", url: "/manager/all-proposals", icon: Sparkles },
      { title: "Proposal Reviews", url: "/manager/proposals", icon: Sparkles },
      { title: "Approved Proposals", url: "/manager/approved-proposals", icon: Sparkles },
      { title: "Events", url: "/manager/events", icon: CalendarDays },
      { title: "Users", url: "/users", icon: Users },
      { title: "Role Management", url: "/roles", icon: Shield },
      { title: "Faculty Coordinators", url: "/manager/coordinators", icon: UsersRound },
      { title: "FC Requests", url: "/manager/requests", icon: ClipboardCheck },
      { title: "Registrations", url: "/manager/registrations", icon: ClipboardCheck },
      { title: "Teams", url: "/manager/teams", icon: UsersRound },
      { title: "Submissions", url: "/manager/submissions", icon: Sparkles },
      { title: "Evaluations", url: "/manager/evaluations", icon: FileCheck2 },
      { title: "Judges", url: "/manager/judges", icon: Gavel },
      { title: "Mentors", url: "/manager/mentors", icon: GraduationCap },
      { title: "Reports", url: "/manager/reports", icon: FileBarChart },
      { title: "Notifications", url: "/participant/notifications", icon: Bell },
    ],
  },
];

const participantSections = [
  {
    label: "My Space",
    items: [
      { title: "Dashboard", url: "/participant", icon: LayoutDashboard },
      { title: "Discover Events", url: "/participant/discover-events", icon: Compass },
    ],
  },
  {
    label: "My Activities",
    items: [
      { title: "My Registrations", url: "/participant/registrations", icon: ClipboardCheck },
      { title: "My Teams", url: "/participant/teams", icon: UsersRound },
      { title: "My Submissions", url: "/participant/submissions", icon: Sparkles },
      { title: "My Transactions", url: "/participant/transactions", icon: Wallet },
    ],
  },
  {
    label: "My Profile",
    items: [
      { title: "Certificates", url: "/participant/certificates", icon: Award },
      { title: "Achievements", url: "/participant/achievements", icon: Medal },
      { title: "Notifications", url: "/participant/notifications", icon: Bell },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string) => {
    if (url === "/" || url === "/manager" || url === "/participant" || url === "/coordinator") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  const roleName = user?.memberships?.[0]?.role?.name;
  const permissions = user?.memberships?.[0]?.role?.permissions?.map(p => p.permission.action) || [];
  
  let sections = orgAdminSections;
  let basePath = "/events";
  if (roleName === "Organization Admin" || roleName === "Manager") {
    sections = managerSections;
    basePath = "/manager";
  } else if (roleName === "Participant") {
    sections = participantSections;
    basePath = "/participant";
  } else if (roleName === "Faculty Coordinator") {
    sections = [
      {
        label: "Faculty Space",
        items: [
          { title: "Dashboard", url: "/faculty-coordinator", icon: LayoutDashboard },
          { title: "Assigned Events", url: "/faculty-coordinator/assigned-events", icon: CalendarDays },
          { title: "Student Coordinators", url: "/faculty-coordinator/student-coordinators", icon: UsersRound },
          { title: "Notifications", url: "/notifications", icon: Bell },
        ]
      }
    ];
    basePath = "/faculty-coordinator";
  } else if (roleName === "Student Coordinator" || (!permissions.includes("events.read") && permissions.includes("events.read_assigned"))) {
    // Hide administrative navigation, only show what they have access to
    sections = [
      {
        label: "My Coordinator Space",
        items: [
          { title: "Dashboard", url: "/coordinator", icon: LayoutDashboard },
          { title: "My Proposals", url: "/hackathon-proposals", icon: FilePlus2 },
          { title: "Assigned Events", url: "/coordinator/assigned-events", icon: CalendarDays },
          { title: "Participants", url: "/coordinator/participants", icon: UsersRound },
          { title: "Notifications", url: "/notifications", icon: Bell },
        ]
      }
    ];
    basePath = "/coordinator";
  } else if (roleName === "Sudo Admin" || roleName === "Platform Admin") {
    sections = orgAdminSections;
    basePath = "/platform-admin";
  }

  // Clone sections to avoid mutating static arrays across renders
  sections = sections.map(section => ({
    ...section,
    items: [...section.items]
  }));

  if (permissions.includes("users.create_manager") || permissions.includes("users.create_faculty_coordinator") || permissions.includes("platform.manage")) {
    if (roleName === "Admin" || roleName === "Organization Admin" || roleName === "Sudo Admin" || roleName === "Platform Admin") {
      const platformSection = sections.find(s => s.label === "Platform");
      if (platformSection && !platformSection.items.some(i => i.title === "Privileged Accounts")) {
        platformSection.items.push({ title: "Privileged Accounts", url: "/platform-admin/privileged-accounts", icon: Users });
      }
    } else if (roleName === "Manager") {
      const managementSection = sections.find(s => s.label === "Management");
      if (managementSection && !managementSection.items.some(i => i.title === "Faculty Coordinators")) {
        managementSection.items.push({ title: "Faculty Coordinators", url: "/manager/coordinators", icon: Users });
      }
    }
  }

  // Filter sections by granular permissions
  sections = sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.url === "/events" || item.url === "/manager/events") {
        return permissions.includes("events.read") || permissions.includes("events.manage") || permissions.includes("events.create") || permissions.includes("platform.manage") || permissions.includes("organization.manage") || roleName === "Sudo Admin" || roleName === "Platform Admin" || roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager";
      }
      if (item.url === "/users") {
        return permissions.includes("users.read") || permissions.includes("users.manage") || permissions.includes("platform.manage") || permissions.includes("organization.manage") || roleName === "Sudo Admin" || roleName === "Platform Admin" || roleName === "Admin" || roleName === "Organization Admin";
      }
      if (item.url === "/roles") {
        return permissions.includes("platform.manage") || permissions.includes("organization.manage") || permissions.includes("users.manage") || roleName === "Sudo Admin" || roleName === "Platform Admin" || roleName === "Admin" || roleName === "Organization Admin";
      }
      if (item.url === "/reports" || item.url === "/manager/reports") {
        return permissions.includes("reports.read") || permissions.includes("organization.manage") || permissions.includes("platform.manage") || roleName === "Sudo Admin" || roleName === "Platform Admin" || roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager";
      }
      if (item.url === "/manager/submissions") {
        return permissions.includes("submissions.read") || permissions.includes("submissions.manage") || roleName === "Sudo Admin" || roleName === "Platform Admin" || roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager";
      }
      if (item.url === "/manager/evaluations") {
        return permissions.includes("evaluations.read") || permissions.includes("evaluations.manage") || roleName === "Sudo Admin" || roleName === "Platform Admin" || roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager";
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3.5">
        <Link to={basePath} className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="text-display block truncate text-sm font-semibold leading-tight">
                Eventora Platform
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {roleName || "Events · Competitions"}
              </span>
            </span>
          ) : null}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed ? (
              <SidebarGroupLabel className="text-[11px] uppercase tracking-wide">
                {section.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url as any} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed ? (
                          <span className="min-w-0 flex-1 truncate">{item.title}</span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {!collapsed && roleName !== "Participant" && roleName !== "Manager" ? (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
            <p className="text-xs font-medium">Enterprise trial</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              21 days left · 4,820 of 5,000 seats used
            </p>
          </div>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}
