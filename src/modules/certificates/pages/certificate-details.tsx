import { useRouter } from "@tanstack/react-router";
import { Download, Printer, XCircle, CheckCircle } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { Button } from "@/components/ui/button";
import { MetricWidget } from "@/components/ds/stat-card";
import { StatusChip } from "@/components/ds/status-chip";
import { useCertificate, useRevokeCertificate, useDeleteCertificate } from "../services/certificates.api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

export function CertificateDetails({ id }: { id: string }) {
  const { data: cert, isLoading } = useCertificate(id);
  const revokeMutation = useRevokeCertificate();
  const deleteMutation = useDeleteCertificate();
  const router = useRouter();

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!cert) return <div className="p-8 text-destructive">Certificate not found.</div>;

  const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke this certificate? This marks it as invalid but keeps the record.")) {
      revokeMutation.mutate(id, {
        onSuccess: () => toast.success("Certificate revoked successfully"),
        onError: () => toast.error("Failed to revoke certificate"),
      });
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this certificate?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Certificate deleted");
          router.navigate({ to: "/certificates" });
        },
        onError: () => toast.error("Failed to delete certificate"),
      });
    }
  };

  const isRevoked = cert.status === 'REVOKED';

  return (
    <>
      <PageHeader
        title="Certificate Details"
        description={`${cert.title} · ${cert.event?.name} · serial ${cert.certificateNumber}`}
        crumbs={[
          { label: "Certificates", to: "/certificates" },
          { label: "Details" },
        ]}
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => window.open(`/api/v1/certificates/${id}/download`, '_blank')}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button className="gap-2" onClick={() => window.open(`/api/v1/certificates/${id}/download`, '_blank')}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 sm:p-6 lg:p-8 pt-0">
        <div className="md:col-span-3 space-y-6">
          <SectionCard title="Certificate Preview">
            <div className="aspect-[1.414] w-full max-w-3xl mx-auto border border-border shadow-sm rounded-lg bg-card overflow-hidden flex flex-col relative">
              {isRevoked && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="rotate-[-15deg] border-4 border-destructive text-destructive px-8 py-2 rounded-xl text-4xl font-bold uppercase tracking-widest opacity-80 shadow-sm">
                    Revoked
                  </div>
                </div>
              )}
              <div className="flex-1 p-16 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-medium tracking-widest uppercase text-muted-foreground mb-12">
                  Certificate of {cert.type.toLowerCase()}
                </h3>
                <h2 className="text-4xl font-serif mb-6 text-foreground">
                  {cert.user.firstName} {cert.user.lastName}
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
                  {cert.description || `This certificate is proudly presented to ${cert.user.firstName} ${cert.user.lastName} for their participation in ${cert.event?.name}.`}
                </p>
              </div>
              <div className="bg-muted/30 p-8 flex items-end justify-between border-t border-border">
                <div>
                  <p className="text-sm font-medium mb-1">Issued By</p>
                  <p className="text-xs text-muted-foreground">Eventora Platform</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium mb-1">Date</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(cert.issuedAt), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Issuance Record">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recipient</p>
                <p className="font-medium">{cert.user.firstName} {cert.user.lastName}</p>
                <p className="text-xs text-muted-foreground">{cert.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Event</p>
                <Link to="/events/$id" params={{ id: cert.event.id }} className="font-medium hover:underline text-primary">
                  {cert.event.name}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
                <p className="font-medium">{format(new Date(cert.issuedAt), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <StatusChip status={isRevoked ? 'suspended' : 'active'} label={cert.status} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Verification">
            <div className="space-y-4">
              <MetricWidget
                label="Serial Number"
                value={cert.certificateNumber}
                caption="Unique ID"
              />
              <div className="bg-muted p-4 rounded-xl space-y-2">
                <p className="text-sm font-medium">Verify Authenticity</p>
                <p className="text-xs text-muted-foreground">
                  Anyone can verify this certificate using the public link below.
                </p>
                <div className="pt-2">
                  <Link 
                    to="/certificates/verify/$code"
                    params={{ code: cert.verificationCode }}
                    className="text-xs text-primary font-medium hover:underline block break-all"
                  >
                    {window.location.origin}/certificates/verify/{cert.verificationCode}
                  </Link>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Actions" className="border-destructive/20">
            <div className="space-y-3">
              {!isRevoked && (
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRevoke}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Revoke Certificate
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                <XCircle className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
