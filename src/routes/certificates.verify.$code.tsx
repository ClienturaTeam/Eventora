import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { useVerifyCertificate } from "@/modules/certificates/services/certificates.api";
import { format } from "date-fns";

export const Route = createFileRoute("/certificates/verify/$code")({
  component: VerifyCertificatePage,
});

function VerifyCertificatePage() {
  const { code } = Route.useParams();
  const { data: cert, isLoading, isError } = useVerifyCertificate(code);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  const isValid = cert && cert.status === "ISSUED";
  const isRevoked = cert && cert.status === "REVOKED";

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-2xl w-full text-center mb-12">
        <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground">Certificate Verification</h1>
        <p className="text-muted-foreground mt-2">
          Verify the authenticity of digital certificates issued by Eventora Platform.
        </p>
      </div>

      <div className="max-w-2xl w-full bg-card shadow-sm border border-border rounded-2xl overflow-hidden">
        {(isError || !cert) && (
          <div className="p-12 text-center flex flex-col items-center">
            <XCircle className="w-16 h-16 text-destructive mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Certificate</h2>
            <p className="text-muted-foreground">
              We couldn't find a certificate matching the verification code <span className="font-mono">{code}</span>.
              This certificate may be forged or the code is incorrect.
            </p>
          </div>
        )}

        {isRevoked && (
          <div className="p-12 text-center flex flex-col items-center">
            <XCircle className="w-16 h-16 text-destructive mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Revoked Certificate</h2>
            <p className="text-muted-foreground mb-6">
              This certificate was issued but has since been revoked by the issuing organization. It is no longer valid.
            </p>
            <div className="bg-muted p-4 rounded-xl w-full text-left space-y-2">
              <p className="text-sm font-medium">Serial Number</p>
              <p className="text-sm text-muted-foreground font-mono">{cert.certificateNumber}</p>
            </div>
          </div>
        )}

        {isValid && (
          <div>
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-8 flex flex-col items-center text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Valid Certificate</h2>
              <p className="text-emerald-600 dark:text-emerald-500 max-w-md">
                This is a valid, authentic certificate securely issued via the Eventora Platform.
              </p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Recipient</p>
                  <p className="text-lg font-semibold text-foreground">
                    {cert.user.firstName} {cert.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Type</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {cert.type.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Event</p>
                  <p className="text-foreground">{cert.event.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Issue Date</p>
                  <p className="text-foreground">{format(new Date(cert.issuedAt), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Issued By</p>
                  <p className="text-foreground">{cert.organization?.name || 'Eventora Platform'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Serial Number</p>
                  <p className="font-mono text-sm text-foreground">{cert.certificateNumber}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
