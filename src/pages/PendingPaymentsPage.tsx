import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PendingPayments } from "@/components/bills/PendingPayments";

export default function PendingPaymentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Payments</h1>
          <p className="text-muted-foreground">Record payments against outstanding invoices</p>
        </div>
        <PendingPayments />
      </div>
    </DashboardLayout>
  );
}