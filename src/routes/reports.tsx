import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ds/states";
import { useReportsDashboard, useEventReports, useCompetitionReports, useParticipantReports, useEvaluationReports, useAttendanceReports, useCertificateReports, useWinnerReports, useCommunicationReports } from "@/modules/reports/services/reports.api";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Eventora Platform" },
      {
        name: "description",
        content: "Scheduled and on-demand operational reports across every module.",
      },
    ],
  }),
  component: ReportsPage,
});

const reportTypes = [
  { id: "events", label: "Events" },
  { id: "competitions", label: "Competitions" },
  { id: "participants", label: "Participants" },
  { id: "evaluations", label: "Evaluations" },
  { id: "attendance", label: "Attendance" },
  { id: "certificates", label: "Certificates" },
  { id: "winners", label: "Winners & Prizes" },
  { id: "communications", label: "Communications" },
];

function ReportsPage() {
  const { data: stats, isLoading: isStatsLoading } = useReportsDashboard();
  const [selectedReport, setSelectedReport] = useState("events");
  const [isExporting, setIsExporting] = useState(false);

  // Use all hooks but we can just use the selected one dynamically if we refactored, 
  // but to keep types clean and hooks unconditional we call them all with enabled: false 
  // or just use conditional rendering inside sub-components. 
  // For simplicity since data is small, we'll fetch the selected one.
  // Actually, hooks must not be conditional.
  const eventsQuery = useEventReports({});
  const compsQuery = useCompetitionReports({});
  const partsQuery = useParticipantReports({});
  const evalsQuery = useEvaluationReports({});
  const attQuery = useAttendanceReports({});
  const certsQuery = useCertificateReports({});
  const winnersQuery = useWinnerReports({});
  const commsQuery = useCommunicationReports({});

  const getCurrentQuery = () => {
    switch (selectedReport) {
      case "events": return eventsQuery;
      case "competitions": return compsQuery;
      case "participants": return partsQuery;
      case "evaluations": return evalsQuery;
      case "attendance": return attQuery;
      case "certificates": return certsQuery;
      case "winners": return winnersQuery;
      case "communications": return commsQuery;
      default: return eventsQuery;
    }
  };

  const query = getCurrentQuery();
  const data = query.data || [];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("ascent_token"); // if using token based download
      // Since we need to attach auth headers, we can't just window.open.
      // We will fetch the CSV text and trigger download.
      const url = `/reports/${selectedReport}/export?format=csv`;
      const baseUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:3000/api/v1';
      
      const response = await fetch(`${baseUrl}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-organization-id': localStorage.getItem("ascent_active_org") || ""
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch (e) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports & Exports"
        description="Aggregate metrics and export CSV data across the platform."
        crumbs={[{ label: "Insights" }, { label: "Reports" }]}
      />

      {/* Dashboard Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Total Events" value={stats?.totalEvents?.toString() || "0"} index={0} />
        <StatCard label="Total Competitions" value={stats?.totalCompetitions?.toString() || "0"} index={1} />
        <StatCard label="Total Participants" value={stats?.totalParticipants?.toString() || "0"} index={2} />
        <StatCard label="Total Teams" value={stats?.totalTeams?.toString() || "0"} index={3} />
        <StatCard label="Total Submissions" value={stats?.totalSubmissions?.toString() || "0"} index={4} />
        <StatCard label="Evaluations" value={stats?.totalEvaluations?.toString() || "0"} index={5} />
        <StatCard label="Certificates Issued" value={stats?.certificatesIssued?.toString() || "0"} index={6} />
        <StatCard label="Winners Finalized" value={stats?.winnersFinalized?.toString() || "0"} index={7} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Report Preview */}
        <SectionCard
          title="Report Preview"
          description="Select a report type to preview and export"
          actions={
            <div className="flex gap-2">
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(rt => (
                    <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExport} disabled={isExporting || data.length === 0}>
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export CSV
              </Button>
            </div>
          }
          padded={false}
        >
          {query.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading preview...</div>
          ) : data.length === 0 ? (
            <EmptyState
              title="No data found"
              description="There is no data available for this report type."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-medium text-muted-foreground">ID / Name</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">Status / Detail</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">Created / Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.slice(0, 5).map((row: any, i: number) => (
                    <tr key={row.id || i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium truncate max-w-[200px]">{row.name || row.title || row.id || row.subject || (row.user ? `${row.user.firstName} ${row.user.lastName}` : "N/A")}</td>
                      <td className="px-5 py-3 text-muted-foreground">{row.status || row.type || row.position || (row.event?.name) || "-"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(row.createdAt || row.checkInTime || row.issuedAt || new Date()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <div className="p-4 text-center border-t border-border text-sm text-muted-foreground">
                  Showing 5 of {data.length} records. Export to view all.
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Info Box */}
        <SectionCard title="Exports Info" description="About secure exports" padded>
          <p className="text-sm text-muted-foreground mb-4">
            Exports are secure and logged for compliance. Only authorized roles (e.g., Administrator, Program Office) with the `reports.export` permission can download CSV datasets.
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
            <li>File format: CSV (UTF-8)</li>
            <li>Tenant Isolation enforced</li>
            <li>Audited automatically</li>
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
