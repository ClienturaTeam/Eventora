import { useState, useEffect } from "react";
import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode, Scan, Users, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useEvents } from "@/modules/events/services/events.api";
import { useAttendanceSessions, useGenerateSessionQr, useAttendanceSession, useCheckIn } from "../services/attendance.api";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

export function QRScannerPage() {
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: sessions = [], isLoading: sessionsLoading } = useAttendanceSessions();
  const generateQrMutation = useGenerateSessionQr();
  const checkInMutation = useCheckIn();

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [cameraMode, setCameraMode] = useState<boolean>(false);

  const { data: activeSession } = useAttendanceSession(selectedSessionId);

  // Filter sessions for selected event
  const availableSessions = sessions.filter(s => s.eventId === selectedEventId);

  useEffect(() => {
    // Reset session if event changes
    setSelectedSessionId("");
    setQrToken(null);
  }, [selectedEventId]);

  useEffect(() => {
    let interval: any;
    if (expiresAt) {
      interval = setInterval(() => {
        if (new Date() > expiresAt) {
          setQrToken(null);
          setExpiresAt(null);
          toast.error("QR Code expired. Please generate a new one.");
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerateQr = async () => {
    if (!selectedSessionId) {
      toast.error("Please select a session first.");
      return;
    }
    setCameraMode(false);
    try {
      const res = await generateQrMutation.mutateAsync(selectedSessionId);
      setQrToken(res.token);
      setExpiresAt(new Date(res.expiresAt));
      toast.success("QR Code generated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate QR code.");
    }
  };

  const handleStartCamera = () => {
    if (!selectedSessionId) {
      toast.error("Please select a session before scanning.");
      return;
    }
    setQrToken(null);
    setCameraMode(true);
  };

  useEffect(() => {
    if (!cameraMode) return;
    
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render((decodedText) => {
      scanner.clear();
      setCameraMode(false);
      checkInMutation.mutateAsync({ sessionId: selectedSessionId, userId: decodedText, method: "QR" })
        .then(() => toast.success("Attendee checked in successfully."))
        .catch((err) => toast.error(err.message || "Invalid badge or check-in failed."));
    }, (error) => {
      // ignore errors to avoid spamming the console
    });
    
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [cameraMode, selectedSessionId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:8080";
  const qrUrl = qrToken ? `${origin}/attendance/check-in?token=${qrToken}` : "";

  return (
    <>
      <PageHeader
        title="QR Attendance Scanner"
        description="Select a session to begin accepting attendee check-ins."
        crumbs={[
          { label: "Event Operations" },
          { label: "Attendance", to: "/attendance" },
          { label: "QR Scanner" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <SectionCard title="Session Configuration" description="Target event and session">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event">Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="event">
                  <SelectValue placeholder={eventsLoading ? "Loading..." : "Select Event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session">Session</Label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId} disabled={!selectedEventId}>
                <SelectTrigger id="session">
                  <SelectValue placeholder={sessionsLoading ? "Loading..." : "Select Session"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSessions.length === 0 && (
                    <SelectItem value="none" disabled>No sessions available</SelectItem>
                  )}
                  {availableSessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-2" onClick={handleGenerateQr} disabled={generateQrMutation.isPending || !selectedSessionId}>
              {generateQrMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
              Generate Session QR
            </Button>
            <Button variant="outline" className="w-full" onClick={handleStartCamera} disabled={!selectedSessionId}>
              <Scan className="w-4 h-4 mr-2" />
              Use Camera Scanner
            </Button>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="QR Code Display" className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center border-dashed">
            {cameraMode ? (
              <div className="w-full max-w-md mx-auto">
                <div id="reader" className="overflow-hidden rounded-xl"></div>
                <Button variant="ghost" className="mt-4" onClick={() => setCameraMode(false)}>Cancel Scanner</Button>
              </div>
            ) : qrToken ? (
              <>
                <div className="bg-white p-4 sm:p-6 rounded-2xl mb-6 shadow-sm max-w-[260px] mx-auto">
                  <QRCodeSVG value={qrUrl} size={200} className="w-full h-auto" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-2">Display QR for Attendees</h3>
                <p className="text-muted-foreground max-w-md mb-2 text-xs sm:text-sm">
                  Attendees can scan this code with their mobile device to check in.
                </p>
                <p className="text-xs sm:text-sm font-semibold text-primary">
                  Expires at {expiresAt?.toLocaleTimeString()}
                </p>
              </>
            ) : (
              <>
                <div className="bg-muted p-5 sm:p-6 rounded-2xl mb-6">
                  <QrCode className="w-24 h-24 sm:w-32 sm:h-32 opacity-20" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-2">Display QR for Attendees</h3>
                <p className="text-muted-foreground max-w-md text-xs sm:text-sm">
                  Select an event and session from the left panel to generate a unique QR code.
                  Attendees can scan this code with their mobile device to check in.
                </p>
              </>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-lg border border-border bg-surface p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-md">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Checked In</p>
                  <p className="text-xs text-muted-foreground">This session</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{activeSession?._count?.records ?? 0}</span>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-md text-muted-foreground">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Session Status</p>
                  <p className="text-xs text-muted-foreground">Is Active?</p>
                </div>
              </div>
              <span className="text-xl font-bold">
                {activeSession ? activeSession.status : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
