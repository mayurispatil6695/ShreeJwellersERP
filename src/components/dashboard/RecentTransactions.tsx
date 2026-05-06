import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Sale {
  id: string;
  total: number;
  created_at: string;
  payment_method: string;
  customer_name: string | null;
  invoice_number: string;
  status: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function RecentTransactions({ sales = [] }: { sales?: Sale[] }) {
  const navigate = useNavigate();
  const safeSales = Array.isArray(sales) ? sales : [];
  const recent = [...safeSales]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <button onClick={() => navigate("/analytics")} className="text-sm text-primary hover:underline">View All</button>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No sales yet. Start selling from POS!</p>
        ) : (
          <div className="divide-y divide-border/30">
            {recent.map((sale, index) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-emerald/10 text-emerald">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{sale.customer_name || "Walk-in Customer"}</p>
                    <p className="text-sm text-muted-foreground">{sale.invoice_number} • {sale.payment_method}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-emerald">
                      +₹{Number(sale.total).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(sale.created_at)}</p>
                  </div>
                  <Badge
                    variant="default"
                    className={cn(
                      "text-xs",
                      sale.status === "Completed" && "bg-emerald/20 text-emerald border-emerald/30"
                    )}
                  >
                    {sale.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
