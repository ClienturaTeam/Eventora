import { createFileRoute } from "@tanstack/react-router";
import { QRScannerPage } from "@/modules/attendance/pages/qr-scanner";

export const Route = createFileRoute("/attendance/qr")({
  head: () => ({
    meta: [{ title: "QR Scanner · Eventora Platform" }],
  }),
  component: QRScannerPage,
});
