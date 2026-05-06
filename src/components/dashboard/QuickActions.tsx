import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, UserPlus, PackagePlus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { icon: ShoppingCart, label: "New Sale", description: "Open POS", variant: "gold" as const, path: "/pos" },
  { icon: UserPlus, label: "Add Customer", description: "Register new", variant: "outline" as const, path: "/customers" },
  { icon: PackagePlus, label: "Add Product", description: "Stock items", variant: "outline" as const, path: "/inventory" },
  { icon: BarChart3, label: "Analytics", description: "View reports", variant: "outline" as const, path: "/analytics" },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto py-4 flex-col gap-2 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(action.path)}
            >
              <Icon className="w-5 h-5" />
              <div className="text-center">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs opacity-70 font-normal">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
