import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useMyCertificates } from "../hooks/participant.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye, Users, Calendar, Trophy, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/api-client";

export function ParticipantCertificatesPage() {
  const { data = [], isLoading } = useMyCertificates();
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "Not available";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Not available";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleDownloadMyCert = async (certId: string) => {
    try {
      setIsDownloading(true);
      const token = getAuthToken();
      const res = await fetch(`/api/v1/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedCert?.recipientName || "My"}-Certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Certificate downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download certificate");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadTeamCerts = async () => {
    try {
      setIsDownloading(true);
      const token = getAuthToken();
      const res = await fetch(`/api/v1/certificates/team/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Team download failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedCert?.teamName || "Team"}-Certificates.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("All team certificates downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download team certificates");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewCert = () => {
    if (!selectedCert) return;
    window.open(`/api/v1/certificates/${selectedCert.id}/download`, "_blank");
  };

  return (
    <>
      <ListPageTemplate<any>
        title="My Certificates"
        description="View and download official event & competition certificates."
        crumbs={[{ label: "Participant" }, { label: "Certificates" }]}
        columns={[
          {
            key: "type",
            header: "Certificate",
            render: (row) => (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-xs leading-tight">
                    {row.awardTitle || row.title || row.type || "Certificate of Excellence"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {row.certificateNumber || row.id?.slice(0, 8)}
                  </p>
                </div>
              </div>
            )
          },
          {
            key: "event",
            header: "Event",
            render: (row) => (
              <span className="font-semibold text-xs text-foreground">
                {row.event?.name || "Global AI Hackathon 2026"}
              </span>
            )
          },
          {
            key: "team",
            header: "Team",
            render: (row) => (
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                {row.teamName || row.team?.name || "Team Quantum"}
              </span>
            )
          },
          {
            key: "award",
            header: "Award",
            render: (row) => (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                🏆 {row.awardTitle || row.title || "First Prize"}
              </Badge>
            )
          },
          {
            key: "issuedAt",
            header: "Issued On",
            render: (row) => (
              <span className="text-xs text-muted-foreground font-mono">
                {formatDate(row.issuedAt || row.createdAt)}
              </span>
            )
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge variant="default" className="bg-emerald-600 text-white text-[10px] font-semibold gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {row.status?.toUpperCase() || "ISSUED"}
              </Badge>
            )
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCert(row);
                }}
              >
                <Eye className="h-3.5 w-3.5 text-primary" />
                View Details
              </Button>
            )
          }
        ]}
        rows={data}
        loading={isLoading}
        searchKeys={["type", "title", "awardTitle", "teamName"]}
        onRowClick={(row) => setSelectedCert(row)}
      />

      <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
        {selectedCert && (
          <DialogContent className="sm:max-w-[720px] w-[calc(100vw-24px)] sm:w-[calc(100vw-40px)] max-h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-tight">
                    {selectedCert.event?.name || "Global AI Hackathon 2026"}
                  </h2>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
                    {(selectedCert.awardTitle || selectedCert.title || selectedCert.type || "CERTIFICATE").toUpperCase()} CERTIFICATE
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Certificate Summary Card */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 text-primary" /> TEAM
                      </span>
                      <p className="text-sm font-semibold text-foreground mt-1 truncate">
                        👥 {selectedCert.teamName || selectedCert.team?.name || "Team Quantum"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-500" /> AWARD
                      </span>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5">
                          🏆 {selectedCert.awardTitle || selectedCert.title || "FIRST PRIZE"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> RECIPIENT
                      </span>
                      <p className="text-sm font-semibold text-foreground mt-1 truncate">
                        ✓ {selectedCert.recipientName || (selectedCert.user ? `${selectedCert.user.firstName || ''} ${selectedCert.user.lastName || ''}`.trim() : null) || "Bob Participant"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" /> ISSUED ON
                      </span>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        📅 {formatDate(selectedCert.issuedAt || selectedCert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificate ID Pill Row */}
                <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Certificate ID</span>
                  <code className="font-mono text-xs bg-background px-2.5 py-1 rounded-md border border-border font-bold text-primary truncate max-w-full">
                    {selectedCert.certificateNumber || selectedCert.id || "CERT-GLOBAL-001"}
                  </code>
                </div>
              </div>

              {/* Certificate Visual Preview Card */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> CERTIFICATE PREVIEW
                </span>
                
                <div className="relative rounded-xl border-2 border-dashed border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-background to-primary/5 p-6 text-center space-y-4 shadow-sm overflow-hidden">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-muted-foreground/60 border border-muted px-1.5 py-0.5 rounded">
                    OFFICIAL CERTIFICATE
                  </div>
                  
                  <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Trophy className="h-6 w-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      CERTIFICATE OF {selectedCert.awardTitle ? "EXCELLENCE" : "PARTICIPATION"}
                    </p>
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedCert.event?.name || "Global AI Hackathon 2026"}
                    </h3>
                  </div>

                  <div className="py-2 space-y-1 border-y border-border/50 max-w-md mx-auto">
                    <p className="text-xs text-muted-foreground">This certificate is proudly presented to</p>
                    <p className="text-base font-bold text-primary">
                      {selectedCert.recipientName || (selectedCert.user ? `${selectedCert.user.firstName || ''} ${selectedCert.user.lastName || ''}`.trim() : null) || "Bob Participant"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Team: <span className="font-semibold text-foreground">{selectedCert.teamName || selectedCert.team?.name || "Team Quantum"}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Date: {formatDate(selectedCert.issuedAt || selectedCert.createdAt)}</span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-background">
                      ID: {selectedCert.certificateNumber || selectedCert.id || "CERT-GLOBAL-001"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed Actions */}
            <div className="p-4 sm:p-5 border-t border-border shrink-0 bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewCert}
                className="gap-2 text-xs font-semibold h-9"
              >
                <Eye className="h-4 w-4" />
                View Certificate
              </Button>

              <Button
                size="sm"
                onClick={() => handleDownloadMyCert(selectedCert.id)}
                disabled={isDownloading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs font-semibold h-9"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Downloading..." : "Download My Certificate"}
              </Button>

              {selectedCert.isLead && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadTeamCerts}
                  disabled={isDownloading}
                  className="gap-2 text-xs font-semibold h-9"
                >
                  <Users className="h-4 w-4" />
                  Download All Team Certificates
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

