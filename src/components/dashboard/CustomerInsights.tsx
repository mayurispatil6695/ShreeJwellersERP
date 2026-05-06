import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Customer {
  id: string;
  name: string;
  total_purchases: number;
  loyalty_points: number;
  city: string | null;
}

interface Sale {
  id: string;
  customer_name: string | null;
  total: number;
}

const fmt = (v: number) => {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

const getTier = (tp: number) => {
  if (tp >= 5000000) return { tier: "Platinum", cls: "bg-muted text-muted-foreground" };
  if (tp >= 1500000) return { tier: "Gold", cls: "bg-primary/20 text-primary" };
  if (tp >= 500000) return { tier: "Silver", cls: "bg-silver/20 text-silver" };
  return { tier: "Bronze", cls: "bg-secondary text-muted-foreground" };
};

export function CustomerInsights({ customers = [], sales = [] }: { customers?: Customer[]; sales?: Sale[] }) {
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSales = Array.isArray(sales) ? sales : [];
  const topCustomers = useMemo(() =>
    [...safeCustomers].sort((a, b) => Number(b.total_purchases || 0) - Number(a.total_purchases || 0)).slice(0, 5),
    [safeCustomers]
  );

  const cityData = useMemo(() => {
    const m: Record<string, number> = {};
    safeCustomers.forEach(c => { m[c.city || "Unknown"] = (m[c.city || "Unknown"] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city, count]) => ({ city, count }));
  }, [safeCustomers]);

  const totalLoyalty = safeCustomers.reduce((a, c) => a + Number(c.loyalty_points || 0), 0);
  const repeatBuyers = safeCustomers.filter(c => Number(c.total_purchases || 0) > 0).length;

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Customer Insights
        </CardTitle>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>{safeCustomers.length} total</span>
          <span>•</span>
          <span>{repeatBuyers} active buyers</span>
          <span>•</span>
          <span>{totalLoyalty.toLocaleString()} loyalty pts</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Customers */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Crown className="w-3 h-3" /> TOP CUSTOMERS
          </p>
          {topCustomers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No customers yet</p>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((c, i) => {
                const { tier, cls } = getTier(Number(c.total_purchases || 0));
                return (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <span className="font-medium truncate max-w-[120px]">{c.name}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${cls}`}>{tier}</Badge>
                    </div>
                    <span className="font-medium text-primary">{fmt(Number(c.total_purchases || 0))}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* City distribution mini bar */}
        {cityData.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> BY CITY
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="city" fontSize={10} width={60} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(43, 74%, 49%)" radius={[0, 4, 4, 0]} name="customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
