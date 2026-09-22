import { useState } from "react";
import { ListPageTemplate } from "@/components/templates/list-page";
import { useMyCertificates } from "../hooks/participant.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye, Users, Calendar, Trophy, CheckCircle2 } from "lucide-react";
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
    const token = getAuthToken();
    window.open(`/api/v1/certificates/${selectedCert.id}/download`, "_blank");
  };

  return (
    <>
      <ListPageTemplate<any>
        title="My Certificates"
        description="View your certificates."
        crumbs={[{ label: "Participant" }, { label: "Certificates" }]}
        columns={[
          {
            key: "type",
            header: "Type",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{row.awardTitle || row.title || row.type || 'Certificate'}</span>
              </div>
            )
          },
          {
            key: "event",
            header: "Event",
            render: (row) => <span>{row.event?.name || 'Global AI Hackathon 2026'}</span>
          },
          {
            key: "issuedAt",
            header: "Issued On",
            render: (row) => <span>{formatDate(row.issuedAt || row.createdAt)}</span>
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCert(row);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            )
          }
        ]}
        rows={data}
        loading={isLoading}
        searchKeys={["type", "title", "awardTitle"]}
        onRowClick={(row) => setSelectedCert(row)}
      />

      <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
        {selectedCert && (
          <DialogContent className="sm:max-w-xl max-w-[95vw] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Trophy className="h-6 w-6 text-amber-500 shrink-0" />
                <DialogTitle className="text-xl font-bold leading-tight">
                  {selectedCert.event?.name || "Global AI Hackathon 2026"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm font-medium text-muted-foreground mt-1">
                {selectedCert.awardTitle || selectedCert.title || selectedCert.type} Certificate
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 space-y-4 rounded-lg border border-border p-4 bg-muted/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Team</span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 truncate">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    {selectedCert.teamName || "Code Warriors"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Recipient</span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {selectedCert.recipientName || "Hemanth Kumar"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Award</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {selectedCert.awardTitle || "First Prize"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Issued On</span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {formatDate(selectedCert.issuedAt || selectedCert.createdAt)}
                  </p>
                </div>
              </div>

              {selectedCert.certificateNumber && (
                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Certificate ID:</span>
                  <code className="font-mono bg-background px-2 py-0.5 rounded border border-border font-medium shrink-0">
                    {selectedCert.certificateNumber}
                  </code>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleViewCert} className="gap-1.5 text-xs sm:text-sm">
                <Eye className="h-4 w-4" />
                View Certificate
              </Button>
              <Button onClick={() => handleDownloadMyCert(selectedCert.id)} disabled={isDownloading} className="gap-1.5 text-xs sm:text-sm">
                <Download className="h-4 w-4" />
                Download My Certificate
              </Button>
              {selectedCert.isLead && (
                <Button variant="secondary" onClick={handleDownloadTeamCerts} disabled={isDownloading} className="gap-1.5 text-xs sm:text-sm">
                  <Users className="h-4 w-4" />
                  Download All Team Certificates
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
