import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployeeAuth } from "@/contexts/EmployeeAuthContext";
import { Package, ShoppingCart, User, TrendingUp, Loader2, Box, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { employeeGetAll } from "@/lib/employeeFirebaseProxy";
import { MetalPriceCard } from "@/components/dashboard/MetalPriceCard";

interface Product {
  id: string;
  name: string;
  stock: number;
  unit_price: number;
  status: string;
}

interface Sale {
  id: string;
  total: number;
  created_at: string;
  employee_id?: string;
  employee_name?: string;
}

const EmployeeDashboard = () => {
  const { employee } = useEmployeeAuth();

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["emp-dash-products"],
    queryFn: () => employeeGetAll<Product>("products"),
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["emp-dash-sales"],
    queryFn: () => employeeGetAll<Sale>("sales"),
  });

  const totalProducts = products.length;
  const inStock = products.filter((p) => (p.stock || 0) > 0).length;
  const lowStock = products.filter((p) => p.status === "Low Stock").length;
  const todaySales = sales.filter((s) => {
    if (!s.created_at) return false;
    const d = new Date(s.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const isLoading = loadingProducts || loadingSales;

  return (
    <EmployeeLayout>
      <div className="animate-fade-in space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            Welcome, <span className="text-gradient-gold">{employee?.name}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Employee Portal • ID: {employee?.employee_id}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-2 mb-1">
                <Box className="w-4 h-4 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Total Products</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-primary">{isLoading ? "—" : totalProducts}</p>
            </CardContent>
          </Card>
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-emerald-500" />
                <p className="text-xs sm:text-sm text-muted-foreground">In Stock</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{isLoading ? "—" : inStock}</p>
            </CardContent>
          </Card>
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-xs sm:text-sm text-muted-foreground">Low Stock</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-amber-500">{isLoading ? "—" : lowStock}</p>
            </CardContent>
          </Card>
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Today's Sales</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{isLoading ? "—" : formatCurrency(todayRevenue)}</p>
              <p className="text-xs text-muted-foreground">{todaySales.length} transaction{todaySales.length !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access + Metal Prices */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link to="/employee/pos">
              <Card variant="elevated" className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ShoppingCart className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">POS / Billing</CardTitle>
                      <p className="text-sm text-muted-foreground">Process sales & transactions</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Scan barcode, add to cart, calculate gold rates, and process payments.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/employee/inventory">
              <Card variant="elevated" className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Inventory</CardTitle>
                      <p className="text-sm text-muted-foreground">View stock & selling prices</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Check available stock, search products, view selling prices.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Profile */}
            <Card variant="elevated" className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Employee ID</p>
                    <p className="font-medium font-mono">{employee?.employee_id}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{employee?.name}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{employee?.email || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Metal Prices */}
          <div>
            <MetalPriceCard />
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
