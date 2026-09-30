import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronsUpDown,
  CircleHelp,
  Command as CommandIcon,
  LogOut,
  Search,
  Settings,
  UserRound,
  BugPlay,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SeverityChip } from "@/components/ds/status-chip";

import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, Notification } from "@/modules/communication/services/notifications.api";
import { CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserProfileDialog } from "./user-profile-dialog";



export function Topbar() {
  const { user, login, logout, activeOrganization, setActiveOrganization } = useAuth();
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const getDashboardUrl = (user: any) => {
    if (!user || !user.memberships || user.memberships.length === 0) return "/events";
    const roleName = user.memberships[0]?.role?.name;
    if (roleName === "Platform Admin") return "/platform-admin";
    if (roleName === "Organization Admin" || roleName === "Manager") return "/manager";
    if (roleName === "Student Coordinator") return "/coordinator";
    if (roleName === "Participant") return "/participant";
    if (roleName === "Judge") return "/evaluations";
    if (roleName === "Mentor") return "/teams";
    if (roleName === "Volunteer") return "/volunteers";
    return "/events";
  };

  const quickLinks = [
    { label: "Dashboard", to: getDashboardUrl(user) },
    { label: "Events", to: "/events" },
    { label: "Create event", to: "/events/new" },
    { label: "Competitions", to: "/competitions" },
    { label: "Registrations", to: "/registrations" },
    { label: "Submissions", to: "/submissions" },
    { label: "Evaluations", to: "/evaluations" },
    { label: "Certificates", to: "/certificates" },
  ];
  
  const { data: notificationsData } = useNotifications(1, 10);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  
  const notifications = notificationsData?.data || [];
  const unread = notificationsData?.unreadCount || 0;

  const currentMembership = user?.memberships?.find(
    (m) => m.organization.id === activeOrganization
  );
  const orgName = currentMembership?.organization.name || "Ascent Platform";

  const switchDevUser = async (email: string) => {
    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "password123" }),
      });
      if (res.success && res.data?.token) {
        login(res.data.token);
        toast.success(`Switched to ${email}`);
        
        const usr = res.data.user;
        let target = "/events";
        if (usr && usr.memberships && usr.memberships.length > 0) {
          const roleName = usr.memberships[0]?.role?.name;
          if (roleName === "Platform Admin") {
            target = "/platform-admin";
          } else if (roleName === "Organization Admin" || roleName === "Manager") {
            target = "/manager";
          } else if (roleName === "Student Coordinator") {
            target = "/coordinator";
          } else if (roleName === "Faculty Coordinator") {
            target = "/faculty-coordinator";
          } else if (roleName === "Participant") {
            target = "/participant";
          } else if (roleName === "Judge") {
            target = "/judge";
          }
        }
        
        setTimeout(() => {
          window.location.href = target;
        }, 300);
      } else {
        toast.error("Failed to switch user.");
      }
    } catch (e: any) {
      console.error("SWITCH DEV USER ERROR:", e);
      toast.error(e?.message || "Error switching user.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/70 sm:px-4">
      <SidebarTrigger className="min-h-9 min-w-9" />
      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      <div className="hidden max-w-56 gap-2 px-2 md:inline-flex items-center h-9">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary-muted text-[11px] font-semibold text-accent-foreground">
          CO
        </span>
        <span className="min-w-0 truncate text-sm font-medium">{orgName}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:text-foreground md:ml-2 md:w-full md:max-w-md md:justify-start md:gap-2 md:px-3"
        aria-label="Open global search"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden truncate text-sm md:inline">
          Search events, teams, submissions…
        </span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
          <CommandIcon className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5 md:ml-0">
        <Button
          variant="ghost"
          size="icon"
          className="hidden min-h-9 min-w-9 text-muted-foreground sm:inline-flex"
          aria-label="Help and support"
        >
          <CircleHelp className="h-[1.1rem] w-[1.1rem]" />
        </Button>
        
        {/* Dev Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden h-9 border-dashed text-muted-foreground sm:inline-flex"
            >
              <BugPlay className="mr-2 h-4 w-4" />
              Dev Role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Switch Test User</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => switchDevUser("admin@ascent.dev")}>
              Platform Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchDevUser("manager@contoso.com")}>
              Org Admin / Manager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchDevUser("participant1@contoso.com")}>
              Participant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchDevUser("faculty1@contoso.com")}>
              Faculty Coordinator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchDevUser("student1@contoso.com")}>
              Student Coordinator (Sub-manager)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => switchDevUser("elena@ascent.dev")}>
              Judge
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative min-h-9 min-w-9 text-muted-foreground"
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell className="h-[1.1rem] w-[1.1rem]" />
              {unread ? (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unread}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader className="mb-4">
              <div className="flex items-center justify-between">
                <SheetTitle>Notifications</SheetTitle>
                {unread > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()} className="h-8 gap-1.5 text-xs">
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all as read
                  </Button>
                )}
              </div>
              <SheetDescription>{unread} unread across your organizations</SheetDescription>
            </SheetHeader>
            <ul className="space-y-2 overflow-y-auto pb-4 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No notifications.</div>
              ) : (
                notifications.map((n: Notification) => (
                  <li
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markAsRead.mutate(n.id);
                      if (n.link) navigate({ to: n.link });
                    }}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent/40 ${n.isRead ? "border-transparent bg-transparent" : "border-border bg-surface"}`}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <p className={`text-sm leading-snug ${n.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}>{n.title}</p>
                      <SeverityChip severity={n.type === "CERTIFICATE" ? "success" : n.type === "ANNOUNCEMENT" ? "info" : "warning"} />
                    </div>
                    <p className={`mt-1 text-sm ${n.isRead ? "text-muted-foreground/70" : "text-muted-foreground"}`}>{n.message}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 h-9 gap-2 px-1.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary-muted text-[11px] font-semibold text-accent-foreground">
                  {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block truncate text-xs font-medium leading-tight">
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {user?.status || "Active"}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : ""}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
              <UserRound className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a module, event or record…" />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {quickLinks.map((link) => (
              <CommandItem
                key={link.to}
                onSelect={() => {
                  setOpen(false);
                  void navigate({ to: link.to });
                }}
              >
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Recent records">
            <CommandItem onSelect={() => setOpen(false)}>SUB-2291 · SignBridge</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>Team · Neural Nomads</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              Event · Global AI Innovation Summit 2026
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
