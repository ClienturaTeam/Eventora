import { useParams } from "@tanstack/react-router";
import { DetailsPageTemplate } from "@/components/templates/details-page";
import { useManagerEventRevenue } from "@/modules/payments/hooks/payments.hooks";
import { useEvent } from "@/modules/events/services/events.api";

export function ManagerEventRevenuePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data: event, isLoading: isEventLoading } = useEvent(id);
  const { data: revenue, isLoading: isRevenueLoading } = useManagerEventRevenue(id);

  if (isEventLoading || isRevenueLoading) {
    return <div className="p-8">Loading revenue details...</div>;
  }

  if (!event) {
    return <div className="p-8">Event not found</div>;
  }

  return (
    <DetailsPageTemplate
      title={`Revenue: ${event.name}`}
      description="Financial overview for this event."
      crumbs={[
        { label: "Manager" },
        { label: "Events", to: "/manager/events" },
        { label: "Revenue" },
      ]}
      metrics={[
        { label: "Total Revenue", value: `₹${(revenue?.totalRevenue || 0).toLocaleString("en-IN")}` },
        { label: "Net Revenue", value: `₹${(revenue?.netRevenue || 0).toLocaleString("en-IN")}` },
        { label: "Successful Payments", value: revenue?.successfulPayments || "0" },
        { label: "Total Refunds", value: `₹${(revenue?.totalRefunds || 0).toLocaleString("en-IN")}` },
      ]}
      overview={<></>}
    />
  );
}
