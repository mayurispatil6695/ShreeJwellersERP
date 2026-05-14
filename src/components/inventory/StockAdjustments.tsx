import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUserData } from "@/hooks/useUserData";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface StockAdjustment {
  id: string;
  product_id: string;
  product_name: string;
  adjustment_type: "increase" | "decrease";
  quantity: number;
  old_stock: number;
  new_stock: number;
  reason: string;
  notes: string;
  date: string;
}

export default function StockAdjustmentsPage() {
  const { getAll } = useUserData();
  const [search, setSearch] = useState("");
  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ["stock_adjustments"],
    queryFn: () => getAll<StockAdjustment>("stock_adjustments"),
  });

  const filtered = useMemo(() => {
    return adjustments.filter(a =>
      a.product_name.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase())
    );
  }, [adjustments, search]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(a => ({
      Date: format(new Date(a.date), "dd MMM yyyy HH:mm"),
      Product: a.product_name,
      Type: a.adjustment_type === "increase" ? "Increase" : "Decrease",
      Quantity: a.quantity,
      "Old Stock": a.old_stock,
      "New Stock": a.new_stock,
      Reason: a.reason,
      Notes: a.notes,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Adjustments");
    XLSX.writeFile(wb, `stock-adjustments-${new Date().toISOString()}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Stock Adjustments</h1>
            <p className="text-muted-foreground">History of inventory changes (physical count, damage, returns)</p>
          </div>
          <Button variant="outline" onClick={exportToExcel} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search product or reason..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No stock adjustments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Old Stock</TableHead>
                      <TableHead>New Stock</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell className="whitespace-nowrap text-xs">{format(new Date(adj.date), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell>{adj.product_name}</TableCell>
                        <TableCell>
                          <span className={adj.adjustment_type === "increase" ? "text-green-600" : "text-red-600"}>
                            {adj.adjustment_type === "increase" ? "➕ Increase" : "➖ Decrease"}
                          </span>
                        </TableCell>
                        <TableCell>{adj.quantity}</TableCell>
                        <TableCell>{adj.old_stock}</TableCell>
                        <TableCell>{adj.new_stock}</TableCell>
                        <TableCell>{adj.reason}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{adj.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}