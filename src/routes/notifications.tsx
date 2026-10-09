import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { Button } from "@/components/ui/button";
import { SeverityChip } from "@/components/ds/status-chip";
import { useNotifications, useMarkAllNotificationsAsRead } from "@/modules/communication/services/notifications.api";
import { format } from "date-fns";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Eventora Platform" },
      {
        name: "description",
        content: "Platform alerts, approvals and operational notices in one inbox.",
      },
      { property: "og:title", content: "Notifications · Eventora Platform" },
      {
        property: "og:description",
        content: "Platform alerts, approvals and operational notices in one inbox.",
      },
    ],
  }),
  component: NotificationsPage,
});

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Approvals, deadlines and system alerts across your organizations."
        crumbs={[{ label: "Workspace" }, { label: "Notifications" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              markAllAsRead.mutate(undefined, {
                onSuccess: () => toast.success("All notifications marked as read")
              });
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        }
      />
      <SectionCard
        title="Inbox"
        description={`${unreadCount} unread`}
        padded={false}
      >
        <ul className="divide-y divide-border">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3.5 py-3.5 sm:px-5 sm:py-4 ${!n.isRead ? 'bg-muted/50' : ''}`}
            >
              <div className="min-w-0">
                <p className={`truncate text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {format(new Date(n.createdAt), "MMM d, h:mm a")}
                </p>
              </div>
              <SeverityChip severity={n.type === 'SYSTEM' ? 'neutral' : 'info'} />
            </li>
          ))}
          {notifications.length === 0 && !isLoading && (
             <li className="px-5 py-8 text-center text-sm text-muted-foreground">No notifications</li>
          )}
        </ul>
      </SectionCard>
    </>
  );
}
