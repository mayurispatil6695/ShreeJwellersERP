import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Gem, TrendingUp, Package, IndianRupee, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

interface Sale { id: string; total: number; created_at: string; payment_method: string; }
interface Product { id: string; stock: number; unit_price: number; metal_type: string; weight: number; }
interface Customer { id: string; total_purchases: number; }
interface Investment { id: string; invested_amount: number; current_value: number; status: string; metal_type: string; }

const fmt = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

export function BusinessHealth({ sales = [], products = [], customers = [], investments = [] }: {
  sales?: Sale[]; products?: Product[]; customers?: Customer[]; investments?: Investment[];
}) {
  const safeSales = Array.isArray(sales) ? sales : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeInvestments = Array.isArray(investments) ? investments : [];
  const data = useMemo(() => {
    // Metal weight breakdown
    const metalWeight: Record<string, number> = {};
    safeProducts.forEach(p => {
      const w = Number(p.weight || 0) * Number(p.stock || 0);
      metalWeight[p.metal_type] = (metalWeight[p.metal_type] || 0) + w;
    });
    const totalWeight = Object.values(metalWeight).reduce((a, b) => a + b, 0) || 1;

    // Payment method breakdown
    const payMethod: Record<string, number> = {};
    safeSales.forEach(s => { payMethod[s.payment_method || "Cash"] = (payMethod[s.payment_method || "Cash"] || 0) + Number(s.total || 0); });
    const totalPayment = Object.values(payMethod).reduce((a, b) => a + b, 0) || 1;

    // Investment profit
    const totalInvested = safeInvestments.reduce((a, i) => a + Number(i.invested_amount || 0), 0);
    const totalCurrent = safeInvestments.reduce((a, i) => a + Number(i.current_value || 0), 0);
    const profit = totalCurrent - totalInvested;
    const profitPct = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(1) : "0";

    // Stock health
    const lowStock = safeProducts.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outStock = safeProducts.filter(p => p.stock === 0).length;
    const healthyStock = safeProducts.length - lowStock - outStock;
    const stockHealth = safeProducts.length > 0 ? Math.round((healthyStock / safeProducts.length) * 100) : 100;

    return {
      metalWeight: Object.entries(metalWeight).sort((a, b) => b[1] - a[1]).slice(0, 4),
      totalWeight,
      payMethod: Object.entries(payMethod).sort((a, b) => b[1] - a[1]).slice(0, 4),
      totalPayment,
      profit, profitPct, totalInvested, totalCurrent,
      stockHealth, lowStock, outStock,
    };
  }, [safeSales, safeProducts, safeInvestments]);

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Business Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stock Health */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" /> Stock Health</span>
            <span className="font-bold text-primary">{data.stockHealth}%</span>
          </div>
          <Progress value={data.stockHealth} className="h-2" />
          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
            <span>{data.lowStock} low stock</span>
            <span>{data.outStock} out of stock</span>
          </div>
        </div>

        {/* Metal Weight Distribution */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Gem className="w-3 h-3" /> GOLD & METAL WEIGHT (STOCK)
          </p>
          <div className="space-y-1.5">
            {data.metalWeight.map(([metal, weight]) => (
              <div key={metal} className="flex items-center justify-between text-sm">
                <span>{metal}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(weight / data.totalWeight) * 100}%` }} />
                  </div>
                  <span className="font-medium text-xs w-14 text-right">{weight.toFixed(1)}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <IndianRupee className="w-3 h-3" /> PAYMENT METHODS
          </p>
          <div className="space-y-1.5">
            {data.payMethod.map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between text-sm">
                <span>{method}</span>
                <span className="font-medium text-xs">{fmt(amount)} ({((amount / data.totalPayment) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Summary */}
        {data.totalInvested > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> INVESTMENT PORTFOLIO
            </p>
            <div className="flex justify-between text-sm">
              <span>Invested</span>
              <span className="font-medium">{fmt(data.totalInvested)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Current</span>
              <span className="font-medium">{fmt(data.totalCurrent)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="font-medium">P&L</span>
              <span className={`font-bold ${data.profit >= 0 ? "text-emerald" : "text-ruby"}`}>
                {data.profit >= 0 ? "+" : ""}{fmt(data.profit)} ({data.profitPct}%)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
