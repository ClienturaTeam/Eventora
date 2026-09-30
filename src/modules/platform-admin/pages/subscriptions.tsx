import { PageHeader, SectionCard } from "@/components/ds/page-header";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ds/status-chip";
import { 
  useSubscriptionPlans, 
  useCurrentSubscription, 
  useCheckout, 
  usePaymentTransactions,
  useValidateCoupon,
  useRefundPayment,
  exportPaymentsCSV
} from "../../payments/hooks/payments.hooks";
import { CreditCard, Check, AlertCircle, FileText, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function SubscriptionsPage() {
  const { data: plans = [], isLoading: loadingPlans } = useSubscriptionPlans();
  const { data: subData, isLoading: loadingSub } = useCurrentSubscription();
  const { data: transactions = [] } = usePaymentTransactions();
  
  const checkoutMutation = useCheckout();
  const validateCouponMutation = useValidateCoupon();
  const refundMutation = useRefundPayment();

  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<{valid?: boolean; message?: string}>({});

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await validateCouponMutation.mutateAsync(couponCode);
      if (res.valid) {
        setCouponStatus({ valid: true, message: `Coupon applied: ${res.coupon.code}` });
      } else {
        setCouponStatus({ valid: false, message: res.reason });
      }
    } catch (err: any) {
      setCouponStatus({ valid: false, message: "Error validating coupon" });
    }
  };

  const handleCheckout = (planId: string) => {
    checkoutMutation.mutate({
      planId,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
      ...(couponStatus.valid && couponCode ? { couponCode } : {})
    });
  };

  const handleRefund = (paymentId: string) => {
    if (confirm("Are you sure you want to refund this payment?")) {
      refundMutation.mutate({ paymentId, reason: "Requested by admin" });
    }
  };

  const subscription = subData?.subscription;
  const profile = subData?.billingProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your organization's subscription plan, view invoices, and update billing details."
        crumbs={[{ label: "Business" }, { label: "Billing" }]}
      />

      {/* Current Subscription Status */}
      <SectionCard title="Current Plan" description="Your active subscription details">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-lg">
                {subscription?.plan?.name || "Free Tier"}
              </h3>
              <StatusChip 
                status={subscription?.status === "ACTIVE" ? "success" : subscription ? "warning" : "default"} 
                label={subscription?.status || "NO ACTIVE PLAN"}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription?.currentPeriodEnd 
                ? `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` 
                : "Select a plan below to unlock premium features."}
            </p>
          </div>
          {subscription?.status === "ACTIVE" && (
            <Button variant="outline">
              Manage in Stripe
            </Button>
          )}
        </div>
      </SectionCard>

      {/* Coupon Application */}
      <SectionCard title="Promotions" description="Apply a discount code to your next subscription purchase">
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Enter coupon code" 
            value={couponCode} 
            onChange={(e) => setCouponCode(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            variant="secondary" 
            onClick={handleValidateCoupon}
            disabled={validateCouponMutation.isPending || !couponCode}
          >
            Validate
          </Button>
          {couponStatus.message && (
            <span className={`text-sm ${couponStatus.valid ? 'text-emerald-500' : 'text-red-500'}`}>
              {couponStatus.message}
            </span>
          )}
        </div>
      </SectionCard>

      {/* Available Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan: any) => {
          const isCurrent = subscription?.planId === plan.id && subscription?.status === "ACTIVE";
          
          return (
            <SectionCard
              key={plan.id}
              title={plan.name}
              description={plan.description || "Select this plan"}
              className={isCurrent ? "border-primary ring-1 ring-primary" : ""}
              padded={true}
            >
              <div className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹{Number(plan.price).toLocaleString("en-IN")}</span>
                  <span className="text-sm text-muted-foreground">
                    /{plan.interval === "month" ? "mo" : "yr"}
                  </span>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Features
                  </p>
                  <ul className="space-y-2">
                    {(plan.features || []).map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent || checkoutMutation.isPending}
                    onClick={() => handleCheckout(plan.id)}
                  >
                    {isCurrent ? "Current Plan" : "Upgrade to " + plan.name}
                  </Button>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      {/* Transaction History */}
      <SectionCard 
        title="Transaction History" 
        description="Recent payments and invoices"
        actions={
          <Button variant="outline" size="sm" onClick={() => exportPaymentsCSV()} disabled={transactions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
      >
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {tx.description || "Subscription Payment"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={tx.status === "SUCCEEDED" ? "success" : "warning"} label={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tx.status === "SUCCEEDED" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRefund(tx.id)}
                          disabled={refundMutation.isPending}
                          title="Refund Payment"
                        >
                          <RotateCcw className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
