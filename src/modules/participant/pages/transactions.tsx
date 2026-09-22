import { useMyTransactions } from "@/modules/payments/hooks/payments.hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Download, Receipt, ShieldCheck } from "lucide-react";

// Static Payment Service Config as requested by workflow section 13
const STATIC_PAYMENT_DATA = [
  {
    id: "txn-demo-001",
    event: { name: "Eventora Hackathon 2026" },
    status: "PAID",
    transactionId: "TXN-DEMO-001",
    amount: 500,
    currency: "INR",
    formattedAmount: "₹500",
    paymentDate: "21 September 2026",
    paymentMethod: "UPI",
    receiptAvailable: true,
  },
];

export function ParticipantTransactionsPage() {
  const { data: transactions = [], isLoading } = useMyTransactions();
  const displayData = transactions.length > 0 ? transactions : STATIC_PAYMENT_DATA;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Details</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View your team's hackathon registration payment receipts and transaction records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayData.map((txn: any) => (
          <Card key={txn.id || txn.transactionId} className="border-emerald-500/30 shadow-sm">
            <CardHeader className="bg-emerald-500/5 border-b pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base font-bold text-foreground">
                    {txn.event?.name || "Eventora Hackathon 2026"}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
                  {txn.status || "PAID"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Transaction ID:</span>
                <span className="font-mono font-bold text-foreground">{txn.transactionId || "TXN-DEMO-001"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Amount Paid:</span>
                <span className="font-bold text-base text-emerald-600">{txn.formattedAmount || `₹${txn.amount}`}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Payment Date:</span>
                <span className="font-medium text-foreground">{txn.paymentDate || "21 September 2026"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Payment Method:</span>
                <span className="font-semibold text-foreground">{txn.paymentMethod || "UPI"}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground font-medium">Receipt:</span>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Receipt className="h-3 w-3" /> Available
                </Badge>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Download Official Receipt PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-3 bg-muted/40 rounded-lg border text-xs text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span>Static Payment Service active. Designed for seamless replacement with live payment gateways.</span>
      </div>
    </div>
  );
}
