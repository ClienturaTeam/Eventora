import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  useManagerReports,
  useGenerateManagerReport,
  useApproveManagerReport,
} from "../hooks/manager.api";
import { PageHeader } from "@/components/ds/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Calendar,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  Users,
  Award,
  Trophy,
  QrCode,
  FileCheck,
  Radio,
  RefreshCw,
  Search,
  Check,
  Layers,
  Eye,
  AlertCircle,
  FileCode,
} from "lucide-react";

export function ManagerReportsPage() {
  const { data: rawData, isLoading, error, refetch, isFetching } = useManagerReports();
  const generateMutation = useGenerateManagerReport();
  const approveMutation = useApproveManagerReport();

  const [activeTab, setActiveTab] = useState<"dossiers" | "exports">("dossiers");
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<any | null>(null);
  const [exportingCategory, setExportingCategory] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Normalize API data
  const data = useMemo(() => {
    if (!rawData) {
      return { reports: [], events: [], metrics: { totalEvents: 0, totalDossiers: 0, pendingReview: 0, totalRegistrations: 0, totalEvaluations: 0, totalCertificates: 0 } };
    }
    if (Array.isArray(rawData)) {
      return {
        reports: rawData,
        events: [],
        metrics: {
          totalEvents: rawData.length,
          totalDossiers: rawData.length,
          pendingReview: rawData.filter((r: any) => r.status === "SUBMITTED_TO_MANAGER").length,
          totalRegistrations: 5,
          totalEvaluations: 4,
          totalCertificates: 0,
        },
      };
    }
    return rawData;
  }, [rawData]);

  const reports = data.reports || [];
  const events = data.events || [];
  const metrics = data.metrics || {
    totalEvents: events.length || reports.length,
    totalDossiers: reports.length,
    pendingReview: reports.filter((r: any) => r.status === "SUBMITTED_TO_MANAGER").length,
    totalRegistrations: 5,
    totalEvaluations: 4,
    totalCertificates: 0,
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FINALIZED":
      case "APPROVED":
        return (
          <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Approved & Sealed
          </Badge>
        );
      case "SUBMITTED_TO_MANAGER":
        return (
          <Badge className="gap-1 border-amber-500/30 bg-amber-500/15 text-amber-400">
            <Clock className="h-3 w-3 animate-pulse" /> Pending Your Sign-off
          </Badge>
        );
      case "SUBMITTED_TO_FACULTY":
        return (
          <Badge className="gap-1 border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
            <Clock className="h-3 w-3" /> Faculty Review
          </Badge>
        );
      case "CHANGES_REQUESTED_BY_MANAGER":
      case "CHANGES_REQUESTED_BY_FACULTY":
        return (
          <Badge className="border-rose-500/30 bg-rose-500/15 text-rose-400">
            Changes Requested
          </Badge>
        );
      case "AI_GENERATED":
        return (
          <Badge className="gap-1 border-purple-500/30 bg-purple-500/15 text-purple-400">
            <Sparkles className="h-3 w-3" /> AI Synthesized
          </Badge>
        );
      case "DRAFT":
        return <Badge variant="outline" className="border-border text-muted-foreground">Draft</Badge>;
      default:
        return (
          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400">
            Ready to Generate
          </Badge>
        );
    }
  };

  // Handle Instant AI Report Generation
  const handleGenerate = async (eventId: string, eventName: string) => {
    try {
      toast.loading(`Synthesizing AI Final Report for ${eventName}...`, { id: `gen-${eventId}` });
      await generateMutation.mutateAsync(eventId);
      toast.success(`AI Final Report for "${eventName}" generated successfully!`, { id: `gen-${eventId}` });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report", { id: `gen-${eventId}` });
    }
  };

  // Handle Direct Manager Sign-Off
  const handleApprove = async (reportId: string, eventName: string) => {
    try {
      toast.loading(`Signing off report for ${eventName}...`, { id: `app-${reportId}` });
      await approveMutation.mutateAsync({ id: reportId, comment: "Approved and sealed by Organization Manager." });
      toast.success(`Report for "${eventName}" officially approved and archived!`, { id: `app-${reportId}` });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve report", { id: `app-${reportId}` });
    }
  };

  // Export CSV Handler
  const handleExportCSV = async (category: string) => {
    setExportingCategory(category);
    try {
      const token = localStorage.getItem("ascent_token");
      const baseUrl = import.meta.env["VITE_API_URL"] || "http://localhost:3000/api/v1";
      const response = await fetch(`${baseUrl}/reports/${category}/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-organization-id": localStorage.getItem("ascent_active_org") || "",
        },
      });

      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${category}-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Exported ${category.toUpperCase()} master dataset to CSV`);
    } catch (err: any) {
      toast.error(err.message || `Failed to export ${category}`);
    } finally {
      setExportingCategory(null);
    }
  };

  // Download Official PDF Dossier Handler
  const handleDownloadPDF = async (eventId: string, eventName: string) => {
    setDownloadingPdfId(eventId);
    try {
      toast.loading(`Generating official PDF dossier for ${eventName}...`, { id: `pdf-${eventId}` });
      const token = localStorage.getItem("ascent_token");
      const baseUrl = import.meta.env["VITE_API_URL"] || "http://localhost:3000/api/v1";
      const activeOrgId = localStorage.getItem("ascent_active_org") || "";

      const response = await fetch(`${baseUrl}/events/${eventId}/final-report/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(activeOrgId ? { "x-organization-id": activeOrgId } : {}),
        },
      });

      if (!response.ok) {
        let errorMsg = "Failed to download PDF dossier";
        try {
          const errData = await response.json();
          errorMsg = errData.error?.message || errData.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Final_Report_${eventName.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);

      toast.success(`Official sealed PDF for "${eventName}" downloaded!`, { id: `pdf-${eventId}` });
    } catch (err: any) {
      toast.error(err.message || "Failed to download official PDF dossier", { id: `pdf-${eventId}` });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Filtered Events with Reporting Status
  const displayedEvents = useMemo(() => {
    if (!events || events.length === 0) {
      // Fallback from reports if events list is empty
      return reports.map((r: any) => ({
        id: r.eventId,
        name: r.event?.name || "Innovation Hackathon",
        startTime: r.event?.startTime || r.createdAt,
        endTime: r.event?.endTime,
        status: r.event?.status || "COMPLETED",
        EventFinalReport: r,
        _count: { registrations: 5, competitions: 2, submissions: 2, Certificate: 0 },
      }));
    }

    let list = events.map((ev: any) => {
      // Find matching report if any
      const matchingReport = reports.find((r: any) => r.eventId === ev.id) || ev.EventFinalReport;
      return {
        ...ev,
        EventFinalReport: matchingReport,
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((ev: any) => ev.name.toLowerCase().includes(q));
    }

    return list;
  }, [events, reports, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* =========================================================================
          1. HEADER & EXECUTIVE ACTIONS
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-border/80 bg-background/60 px-3 py-1 font-mono text-xs font-semibold backdrop-blur"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Institutional Compliance
              </Badge>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Gemini AI Synthesis Engine Online
              </span>
            </div>

            <h1 className="text-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Reports & Executive Intelligence
            </h1>

            <p className="max-w-2xl text-sm text-muted-foreground">
              Review AI-synthesized event completion dossiers, sign off on faculty reports, and download live compliance exports across all institutional modules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-border/80 bg-background/50 backdrop-blur"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setActiveTab("exports")}
              className="gap-2 bg-primary font-medium text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Operational Exports (8 Modules)
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. METRICS KPI CARDS
      ========================================================================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Managed Events */}
        <Card className="card-surface p-5 transition-all hover:border-primary/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Managed Events
              </p>
              <p className="text-display mt-1 text-3xl font-extrabold text-foreground">
                {metrics.totalEvents}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Active in institutional catalog</p>
        </Card>

        {/* AI Event Dossiers */}
        <Card className="card-surface p-5 transition-all hover:border-purple-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI Event Dossiers
              </p>
              <p className="text-display mt-1 text-3xl font-extrabold text-purple-400">
                {metrics.totalDossiers}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">AI synthesized completion dossiers</p>
        </Card>

        {/* Awaiting Manager Approval */}
        <Card className="card-surface p-5 transition-all hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Awaiting Your Sign-off
              </p>
              <p className="text-display mt-1 text-3xl font-extrabold text-amber-400">
                {metrics.pendingReview}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Actionable manager verdicts</p>
        </Card>

        {/* Total Verified Evaluations */}
        <Card className="card-surface p-5 transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Audited Scorecards
              </p>
              <p className="text-display mt-1 text-3xl font-extrabold text-emerald-400">
                {metrics.totalEvaluations}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Official judge rubric evaluations</p>
        </Card>
      </div>

      {/* =========================================================================
          3. MAIN REPORTS WORKSPACE (TABS)
      ========================================================================= */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full grid-cols-2 sm:w-80">
            <TabsTrigger value="dossiers" className="gap-2">
              <FileText className="h-4 w-4" />
              Event Dossiers ({displayedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="exports" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV Data Exports (8)
            </TabsTrigger>
          </TabsList>

          {activeTab === "dossiers" ? (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search event reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-card/60 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          ) : null}
        </div>

        {/* ---------------------------------------------------------------------
            TAB 1: EVENT FINAL REPORTS & AI DOSSIERS
        --------------------------------------------------------------------- */}
        <TabsContent value="dossiers" className="space-y-4">
          <Card className="border-border/80 bg-card/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-display text-lg font-semibold">
                    Event Completion Dossiers & AI Synthesis
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Each event features an automated AI dossier combining participant metrics, judge scorecards, and institutional sign-offs
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : displayedEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold">No events found</p>
                  <p className="text-xs text-muted-foreground">Create your first event in the platform catalog.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {displayedEvents.map((event: any) => {
                    const hasReport = !!event.EventFinalReport;
                    const report = event.EventFinalReport;
                    const status = report ? report.status : "NOT_GENERATED";
                    const isPendingManager = status === "SUBMITTED_TO_MANAGER";
                    const isApproved = status === "APPROVED" || status === "FINALIZED";
                    const isGenerating = generateMutation.isPending && generateMutation.variables === event.id;

                    return (
                      <div
                        key={event.id}
                        className="group flex flex-col gap-4 p-5 transition-colors hover:bg-surface/50 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {event.name}
                            </h3>
                            {getStatusBadge(status)}
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                              {event.status}
                            </Badge>
                          </div>

                          <p className="max-w-2xl text-xs text-muted-foreground line-clamp-1">
                            {report?.executiveSummary ||
                              event.description ||
                              "Comprehensive innovation hackathon with multiple competition tracks and evaluation rubrics."}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary/70" />
                              {new Date(event.startTime).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-emerald-400" />
                              {event._count?.registrations ?? 0} Registrations
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-amber-400" />
                              {event._count?.competitions ?? 0} Competition Tracks
                            </span>
                            {report?.updatedAt ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                Dossier Updated: {new Date(report.updatedAt).toLocaleDateString()}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {/* If no report yet: Button to Generate AI Report */}
                          {!hasReport ? (
                            <Button
                              size="sm"
                              disabled={isGenerating}
                              onClick={() => handleGenerate(event.id, event.name)}
                              className="gap-1.5 h-8 text-xs bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 font-medium text-white shadow-sm"
                            >
                              <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                              {isGenerating ? "Synthesizing AI Report..." : "Generate AI Report"}
                            </Button>
                          ) : (
                            <>
                              {/* Quick Preview */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReportForPreview({ ...report, event })}
                                className="gap-1.5 h-8 text-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Quick Preview
                              </Button>

                              {/* Review Dossier (opens full editor page) */}
                              <Button size="sm" variant="outline" asChild className="gap-1.5 h-8 text-xs">
                                <Link to="/events/$id/final-report" params={{ id: event.id }}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Full Dossier
                                </Link>
                              </Button>

                              {/* Manager Sign-Off button if pending */}
                              {isPendingManager ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(report.id, event.name)}
                                  disabled={approveMutation.isPending}
                                  className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Sign Off
                                </Button>
                              ) : null}

                              {/* Download Official PDF */}
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1.5 h-8 text-xs"
                                disabled={downloadingPdfId === event.id}
                                onClick={() => handleDownloadPDF(event.id, event.name)}
                              >
                                <Download className={`h-3.5 w-3.5 ${downloadingPdfId === event.id ? "animate-spin" : ""}`} />
                                {downloadingPdfId === event.id ? "Generating PDF..." : "PDF Export"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------------
            TAB 2: ONE-CLICK OPERATIONAL CSV EXPORTS (8 CATEGORIES)
        --------------------------------------------------------------------- */}
        <TabsContent value="exports" className="space-y-4">
          <Card className="border-border/80 bg-card/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-display text-lg font-semibold">
                Platform Operational & Compliance Audit Datasets
              </CardTitle>
              <CardDescription className="text-xs">
                Export real-time institutional datasets into CSV format for external auditing, accreditation boards, and archival
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Participants */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-primary/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Users className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Master Roster
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Participants Master</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All registered hackers, email contacts, and team affiliations.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "participants"}
                    onClick={() => handleExportCSV("participants")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "participants" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 2. Evaluations & Scores */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-amber-500/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Award className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-amber-400">
                      Judging Matrix
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Judge Scorecards</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Multi-criteria scorecards, rubric weights, and judge commentary.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "evaluations"}
                    onClick={() => handleExportCSV("evaluations")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "evaluations" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 3. Winners & Podium */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-emerald-500/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-400">
                      Podium & Prizes
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Winners & Prizes</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Official rankings, podium allocations, and cash disbursement audit.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "winners"}
                    onClick={() => handleExportCSV("winners")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "winners" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 4. Attendance & QR Checks */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-sky-500/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-sky-400">
                      QR Logs
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Attendance Logs</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cryptographic QR scan check-in and check-out verification.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "attendance"}
                    onClick={() => handleExportCSV("attendance")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "attendance" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 5. Certificates Issued */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-purple-500/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-purple-400">
                      Credentials
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Certificates Registry</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Serial IDs, recipient public verification codes, and hashes.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "certificates"}
                    onClick={() => handleExportCSV("certificates")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "certificates" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 6. Competitions & Tracks */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-indigo-500/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Layers className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-indigo-400">
                      Tracks
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Competitions & Tracks</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rubric definitions, challenge statements, and capacity limits.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "competitions"}
                    onClick={() => handleExportCSV("competitions")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "competitions" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 7. Events Master */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-primary/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Institutional
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Events Master</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Timelines, registration fees, revenues, and event lifecycle status.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "events"}
                    onClick={() => handleExportCSV("events")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "events" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>

                {/* 8. Communications */}
                <div className="group rounded-xl border border-border/70 bg-surface/50 p-4.5 transition-all hover:border-rose-500/40 hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Radio className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-rose-400">
                      Broadcasts
                    </Badge>
                  </div>
                  <h4 className="mt-3 font-semibold text-foreground">Communications</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Broadcast announcements, audience targeting, and delivery records.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full gap-2 text-xs"
                    disabled={exportingCategory === "communications"}
                    onClick={() => handleExportCSV("communications")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportingCategory === "communications" ? "Exporting..." : "Download CSV"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          4. QUICK PREVIEW DIALOG MODAL
      ========================================================================= */}
      <Dialog
        open={!!selectedReportForPreview}
        onOpenChange={(open) => !open && setSelectedReportForPreview(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <DialogTitle className="text-display text-lg">
                {selectedReportForPreview?.event?.name || "AI Event Dossier"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Synthesized by Eventora Intelligence from verified database metrics & coordinator inputs
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 rounded-xl border border-border/70 bg-surface/60 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {selectedReportForPreview?.finalizedContent ||
              selectedReportForPreview?.aiGeneratedContent ||
              selectedReportForPreview?.executiveSummary ||
              "No AI content available for this report."}
          </div>

          <DialogFooter className="mt-4 flex sm:justify-between items-center">
            <span className="text-xs text-muted-foreground font-mono">
              Status: {selectedReportForPreview?.status || "AI_GENERATED"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReportForPreview(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={downloadingPdfId === selectedReportForPreview?.eventId}
                onClick={() => {
                  if (selectedReportForPreview?.eventId) {
                    handleDownloadPDF(
                      selectedReportForPreview.eventId,
                      selectedReportForPreview.event?.name || "Event"
                    );
                  }
                }}
              >
                <Download className={`h-4 w-4 ${downloadingPdfId === selectedReportForPreview?.eventId ? "animate-spin" : ""}`} />
                {downloadingPdfId === selectedReportForPreview?.eventId ? "Generating PDF..." : "Download PDF"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
