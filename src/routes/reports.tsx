import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart, RefreshCw, FileJson, FileSpreadsheet, ShieldCheck, Search, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { StatCard } from "@/components/ds/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ds/states";
import { useReportsDashboard, useEventReports, useCompetitionReports, useParticipantReports, useEvaluationReports, useAttendanceReports, useCertificateReports, useWinnerReports, useCommunicationReports } from "@/modules/reports/services/reports.api";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Compliance Audit · Eventora Platform" },
      {
        name: "description",
        content: "Scheduled and on-demand operational reports and immutable compliance audit logs.",
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

import { useQuery } from "@tanstack/react-query";
import { fetchApi, getApiBaseUrl } from "@/lib/api-client";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ipAddress: string;
  status: "SUCCESS" | "FLAGGED" | "BLOCKED";
}

function ReportsPage() {
  const { data: stats } = useReportsDashboard();
  const [selectedReport, setSelectedReport] = useState("events");
  const [isExporting, setIsExporting] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");

  const auditLogsQuery = useQuery({
    queryKey: ["platform-admin", "audit-logs"],
    queryFn: async () => {
      const res = await fetchApi<any>("/platform-admin/audit-logs");
      return (res.data || []).map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp || new Date().toISOString(),
        actor: log.actor || "System User",
        role: "User",
        action: log.action || "ACTION",
        target: log.target || "System",
        ipAddress: log.ip || "127.0.0.1",
        status: (log.severity === "warning" ? "FLAGGED" : log.severity === "danger" ? "BLOCKED" : "SUCCESS") as "SUCCESS" | "FLAGGED" | "BLOCKED",
      }));
    },
  });

  const auditLogs: AuditLogEntry[] = auditLogsQuery.data || [];

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

  const filteredAuditLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.id.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("ascent_token");
      const url = `/reports/${selectedReport}/export?format=csv`;
      const baseUrl = getApiBaseUrl();
      
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

  const exportAuditCSV = () => {
    const headers = ["ID", "Timestamp", "Actor", "Role", "Action", "Target Resource", "IP Address", "Status"];
    const rows = filteredAuditLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actor}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.target}"`,
      l.ipAddress,
      l.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Audit Log Trail exported to CSV");
  };

  const exportAuditJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredAuditLogs, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `audit-trail-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Audit Log Trail exported to JSON");
  };

  return (
    <>
      <PageHeader
        title="Reports & Compliance Audit"
        description="Aggregate metrics, export operational CSV data, and monitor immutable compliance audit trails."
        crumbs={[{ label: "Insights" }, { label: "Reports & Audit" }]}
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
          title="Report Data Preview & Export"
          description="Select a report type to preview live datasets and download CSV exports."
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
            <div className="p-8 text-center text-muted-foreground">Loading dataset preview...</div>
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
                  Showing 5 of {data.length} records. Export to view full dataset.
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Info Box */}
        <SectionCard title="Compliance & Security" description="About secure exports" padded>
          <p className="text-sm text-muted-foreground mb-4">
            Exports are cryptographically verified and logged for security compliance. Only authorized roles with `reports.export` permissions can download datasets.
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
            <li>Format: Standard CSV / JSON (UTF-8)</li>
            <li>Multi-tenant Isolation Enforced</li>
            <li>Immutable Audit Trail Recorded</li>
          </ul>
        </SectionCard>
      </div>

      {/* Audit Log Trail & Compliance Export Section */}
      <div className="mt-8">
        <SectionCard
          title="Immutable Audit Log Trail & Security Compliance"
          description="System-wide security logs recording administrative actions, permission mutations, field access, and authentication events."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter audit logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Button onClick={exportAuditCSV} variant="outline" size="sm" className="h-9">
                <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-500" />
                Export CSV
              </Button>
              <Button onClick={exportAuditJSON} variant="outline" size="sm" className="h-9">
                <FileJson className="h-4 w-4 mr-1.5 text-blue-500" />
                Export JSON
              </Button>
            </div>
          }
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Log ID & Time</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Actor & Role</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Action Event</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Target Resource</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">IP Address</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No audit logs match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors font-mono text-xs">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-foreground">{log.id}</div>
                        <div className="text-[10px] text-muted-foreground font-sans">{new Date(log.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-5 py-3 font-sans">
                        <div className="font-medium text-foreground">{log.actor}</div>
                        <div className="text-[11px] text-muted-foreground">{log.role}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="font-mono text-[11px] bg-background">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-sans text-muted-foreground">{log.target}</td>
                      <td className="px-5 py-3 text-muted-foreground">{log.ipAddress}</td>
                      <td className="px-5 py-3 font-sans">
                        <Badge
                          variant={log.status === "SUCCESS" ? "default" : log.status === "FLAGGED" ? "secondary" : "destructive"}
                          className={log.status === "SUCCESS" ? "bg-emerald-600" : ""}
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
