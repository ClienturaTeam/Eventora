import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { GroupedBarChart, TrendAreaChart } from "@/components/ds/charts";
import { Timeline } from "@/components/ds/timeline";
import { Button } from "@/components/ui/button";
import { Settings, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePlatformAdminSummary, usePlatformTimeline } from "../hooks/platform-admin.hooks";

export function PlatformAdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = usePlatformAdminSummary();
  const { data: timelineData, isLoading: isLoadingTimeline } = usePlatformTimeline();

  if (isLoadingSummary || isLoadingTimeline) {
    return <div className="p-8 text-center text-muted-foreground">Loading platform metrics...</div>;
  }

  // Fallback to 0 if summary is missing
  const stats = summary || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    activeEvents: 0,
    platformRevenue: 0,
    subscriptionRevenue: 0,
    storageUsage: 0,
    apiUsage: 0,
  };

  return (
    <>
      <PageHeader
        title="Platform Administration"
        description="Global metrics and system health for the Eventora Platform."
        crumbs={[{ label: "Platform" }, { label: "Dashboard" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="default" asChild>
              <Link to="/roles">
                <Shield className="w-4 h-4 mr-2" />
                Role Management
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/platform-admin/configuration">
                <Settings className="w-4 h-4 mr-2" />
                System settings
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Organizations", value: stats.totalOrganizations.toString(), delta: 0 },
          { label: "Active Organizations", value: stats.activeOrganizations.toString(), progress: stats.totalOrganizations > 0 ? Math.round((stats.activeOrganizations / stats.totalOrganizations) * 100) : 0 },
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), delta: 0 },
          { label: "Active Events", value: stats.activeEvents.toString(), hint: "Currently running" },
          { label: "Platform Revenue", value: `$${(stats.platformRevenue / 1000).toFixed(1)}k`, delta: 0 },
          { label: "Subscription Revenue", value: `$${(stats.subscriptionRevenue / 1000).toFixed(1)}k`, delta: 0 },
          { label: "Storage Usage", value: `${stats.storageUsage} GB`, progress: 0 },
          { label: "API Usage", value: `${stats.apiUsage} reqs`, delta: 0 },
        ].map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Revenue Trend" description="Monthly recurring revenue by subscription tier ($)">
          <TrendAreaChart
            data={(stats as any).revenueTrend || []}
            xKey="month"
            series={[
              { key: "Enterprise", label: "Enterprise Tier" },
              { key: "Pro", label: "Pro Tier" },
              { key: "Starter", label: "Starter Tier" },
            ]}
            height={260}
          />
        </SectionCard>

        <SectionCard title="Organization Growth" description="New organizations onboarded by sector">
          <GroupedBarChart
            data={(stats as any).orgGrowth || []}
            xKey="month"
            series={[
              { key: "Universities", label: "Universities & Colleges" },
              { key: "Enterprises", label: "Corporate Enterprises" },
              { key: "NonProfits", label: "Non-Profits & Labs" },
            ]}
            height={260}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Recent Activity"
          description="Global platform events"
          className="xl:col-span-2"
        >
          <Timeline items={timelineData || []} />
        </SectionCard>

        <SectionCard title="Subscription Expirations" description="Upcoming renewals">
          <ul className="divide-y divide-border">
            <li className="py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">View detailed subscription statuses in the Licenses page.</span>
            </li>
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
