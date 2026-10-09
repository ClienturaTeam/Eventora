import { useEffect, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useScanAttendance } from "../services/attendance.api";
import { Button } from "@/components/ui/button";

export function AttendeeCheckInPage() {
  const search = useSearch({ from: "/attendance/check-in" }) as { token?: string };
  const navigate = useNavigate();
  const scanMutation = useScanAttendance();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    if (!search.token) {
      setStatus("error");
      setErrorMessage("No token provided in the URL.");
      return;
    }

    scanMutation.mutateAsync(search.token)
      .then((res) => {
        setRecord(res);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message || "Failed to check in. The QR code might be expired or invalid.");
      });
  }, [search.token]);

  return (
    <>
      <PageHeader
        title="Session Check-in"
        description="Verify your attendance."
        crumbs={[{ label: "Event Operations" }, { label: "Attendance" }, { label: "Check-in" }]}
      />

      <div className="max-w-md mx-auto mt-6 sm:mt-12 px-1">
        <SectionCard title="Attendance Status" className="text-center p-4 sm:p-8">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Verifying your check-in...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-semibold text-green-600">Check-in Successful!</h2>
              <p className="text-muted-foreground mt-2">
                You have been marked as present for this session.
              </p>
              {record && (
                <div className="bg-muted p-4 rounded-lg w-full text-left mt-4 text-sm space-y-2">
                  <p><span className="font-medium text-foreground">Session:</span> {record.session?.name}</p>
                  <p><span className="font-medium text-foreground">Time:</span> {new Date(record.checkInTime).toLocaleString()}</p>
                </div>
              )}
              <Button className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
                Return to Dashboard
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-semibold text-destructive">Check-in Failed</h2>
              <p className="text-muted-foreground mt-2">{errorMessage}</p>
              <Button variant="outline" className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
