import { useState } from "react";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { employeeGetAll } from "@/lib/employeeFirebaseProxy";

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  metal_type: string;
  weight: number;
  stock: number;
  unit_price: number;
  status: string;
}

const EmployeeInventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["emp-products"],
    queryFn: () => employeeGetAll<Product>("products"),
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMetal =
      metalFilter === "all" ||
      (metalFilter === "Gold" && p.metal_type?.toLowerCase().includes("gold")) ||
      (metalFilter === "Silver" && p.metal_type?.toLowerCase().includes("silver")) ||
      (metalFilter === "Diamond" && p.metal_type?.toLowerCase().includes("diamond")) ||
      (metalFilter === "Platinum" && p.metal_type?.toLowerCase().includes("platinum"));
    return matchesSearch && matchesMetal;
  });

  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((acc, p) => acc + (p.unit_price || 0) * (p.stock || 0), 0),
    inStock: products.filter((p) => (p.stock || 0) > 0).length,
    lowStock: products.filter((p) => p.status === "Low Stock").length,
    outOfStock: products.filter((p) => p.status === "Out of Stock").length,
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <EmployeeLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            <span className="text-gradient-gold">Inventory</span> View
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            View available products, selling prices, and stock levels
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{isLoading ? "—" : stats.totalProducts}</p>
            </CardContent>
          </Card>
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <p className="text-xs sm:text-sm text-muted-foreground">Selling Value</p>
              <p className="text-xl sm:text-2xl font-bold">{isLoading ? "—" : formatCurrency(stats.totalValue)}</p>
            </CardContent>
          </Card>
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <p className="text-xs sm:text-sm text-muted-foreground">In Stock</p>
              <p className="text-xl sm:text-2xl font-bold">{isLoading ? "—" : stats.inStock}</p>
            </CardContent>
          </Card>
          <Card variant="stat">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <p className="text-xs sm:text-sm text-muted-foreground">Low / Out</p>
              <p className="text-xl sm:text-2xl font-bold text-destructive">{isLoading ? "—" : `${stats.lowStock} / ${stats.outOfStock}`}</p>
            </CardContent>
          </Card>
        </div>

        <Card variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                All Products
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search or scan barcode..."
                    className="pl-10 w-full sm:w-48 md:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={metalFilter} onValueChange={setMetalFilter}>
                  <SelectTrigger className="w-[130px] h-9 sm:h-10">
                    <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Metal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metals</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Imitation">Imitation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {products.length === 0 ? "No products available." : "No products found."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Barcode</TableHead>
                    <TableHead className="whitespace-nowrap">Product Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Metal</TableHead>
                    <TableHead className="hidden sm:table-cell">Weight</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Selling ₹</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 border-primary/30">
                          {item.barcode || item.sku}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[150px] truncate">{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{item.category}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{item.metal_type}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{item.weight}g</TableCell>
                      <TableCell className="text-sm font-medium">{item.stock}</TableCell>
                      <TableCell className="font-semibold text-sm text-primary">
                        ₹{(item.unit_price || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "In Stock" ? "default" :
                            item.status === "Low Stock" ? "secondary" : "destructive"
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeInventory;
