import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Product {
  id: string;
  name: string;
  stock: number;
  metal_type: string;
  category: string;
}

export function InventoryAlerts({ products = [] }: { products?: Product[] }) {
  const safeProducts = Array.isArray(products) ? products : [];
  const alerts = useMemo(() => {
    const items: { id: string; title: string; description: string; priority: "high" | "medium"; icon: typeof AlertTriangle }[] = [];

    const outOfStock = safeProducts.filter(p => p.stock === 0);
    outOfStock.forEach(p => {
      items.push({ id: p.id + "-oos", title: p.name, description: `Out of stock • ${p.metal_type} ${p.category}`, priority: "high", icon: XCircle });
    });

    const lowStock = safeProducts.filter(p => p.stock > 0 && p.stock <= 5);
    lowStock.forEach(p => {
      items.push({ id: p.id + "-low", title: p.name, description: `Only ${p.stock} left • ${p.metal_type}`, priority: "medium", icon: AlertTriangle });
    });

    return items.slice(0, 5);
  }, [safeProducts]);

  const urgentCount = alerts.filter(a => a.priority === "high").length;

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          Inventory Alerts
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {urgentCount} urgent
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">All stock levels healthy! ✅</p>
        ) : (
          <div className="divide-y divide-border/30">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 border-l-4 hover:bg-secondary/20 transition-colors animate-fade-in",
                    alert.priority === "high" ? "border-l-ruby bg-ruby/5" : "border-l-primary bg-primary/5"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("w-5 h-5 mt-0.5", alert.priority === "high" ? "text-ruby" : "text-primary")} />
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
