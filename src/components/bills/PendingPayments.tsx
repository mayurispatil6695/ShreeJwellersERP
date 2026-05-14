import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Calendar, IndianRupee, X, Download } from "lucide-react";

interface Sale {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total: number;
  paid_amount: number;
  pending_amount: number;
  created_at: string;
}

export function PendingPayments() {
  const { getAll, updateItem, addItem } = useUserData();
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "invoice" | "customer" | "pending">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["all-sales"],
    queryFn: () => getAll<Sale>("sales"),
  });

  // Filter and sort pending sales
  const filteredSales = useMemo(() => {
    let pending = sales.filter(s => (s.pending_amount || 0) > 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      pending = pending.filter(s =>
        s.customer_name?.toLowerCase().includes(q) ||
        s.invoice_number.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0,0,0,0);
      pending = pending.filter(s => new Date(s.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23,59,59,999);
      pending = pending.filter(s => new Date(s.created_at) <= toDate);
    }

    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) pending = pending.filter(s => s.pending_amount >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) pending = pending.filter(s => s.pending_amount <= max);
    }

    pending.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortBy) {
        case "invoice": aVal = a.invoice_number; bVal = b.invoice_number; break;
        case "customer": aVal = a.customer_name || ""; bVal = b.customer_name || ""; break;
        case "pending": aVal = a.pending_amount; bVal = b.pending_amount; break;
        default: aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime();
      }
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

    return pending;
  }, [sales, search, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortOrder]);

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date");
    setSortOrder("desc");
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast.info("No data to export");
      return;
    }
    const headers = ["Invoice", "Customer", "Total", "Paid", "Pending", "Date"];
    const rows = filteredSales.map(s => [
      s.invoice_number,
      s.customer_name || "Walk-in",
      s.total,
      s.paid_amount || 0,
      s.pending_amount,
      format(new Date(s.created_at), "dd/MM/yyyy")
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending-payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  };

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSale) return;
      if (paymentAmount <= 0 || paymentAmount > selectedSale.pending_amount) {
        throw new Error("Invalid payment amount");
      }
      const newPaid = (selectedSale.paid_amount || 0) + paymentAmount;
      const newPending = selectedSale.pending_amount - paymentAmount;
      await updateItem("sales", selectedSale.id, {
        paid_amount: newPaid,
        pending_amount: newPending,
        payment_status: newPending === 0 ? 'paid' : 'partially_paid',
      });
      await addItem("payments", {
        sale_id: selectedSale.id,
        invoice_number: selectedSale.invoice_number,
        amount: paymentAmount,
        payment_method: paymentMethod,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-sales"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Payment recorded successfully!");
      setDialogOpen(false);
      setSelectedSale(null);
      setPaymentAmount(0);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to record payment"),
  });

  return (
    <Card variant="elevated">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>Outstanding Payments</CardTitle>
        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredSales.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Bar - Responsive */}
        <div className="flex flex-col md:flex-row gap-3 p-3 bg-muted/30 rounded-lg flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[130px]" placeholder="From" />
            <span className="text-muted-foreground">–</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[130px]" placeholder="To" />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
            <Input type="number" placeholder="Min pending" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-[110px]" />
            <span className="text-muted-foreground">–</span>
            <Input type="number" placeholder="Max pending" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-[110px]" />
          </div>

          <div className="flex items-center gap-1">
            <Select value={sortBy} onValueChange={(v: "date" | "invoice" | "customer" | "pending") => setSortBy(v)}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="pending">Pending Amt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}>
              <SelectTrigger className="w-[90px]"><SelectValue placeholder="Order" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={resetFilters} title="Clear filters">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No pending payments match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono">{sale.invoice_number}</TableCell>
                    <TableCell>{sale.customer_name || "Walk-in"}</TableCell>
                    <TableCell>₹{sale.total.toLocaleString()}</TableCell>
                    <TableCell>₹{(sale.paid_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-amber-600">₹{(sale.pending_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(sale.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSale(sale);
                          setPaymentAmount(sale.pending_amount);
                          setDialogOpen(true);
                        }}
                      >
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedSale?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pending Amount</Label>
              <p className="text-lg font-bold text-amber-600">
                ₹{(selectedSale?.pending_amount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Amount to pay</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                max={selectedSale?.pending_amount}
                step="100"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => recordPaymentMutation.mutate()} disabled={recordPaymentMutation.isPending}>
              {recordPaymentMutation.isPending ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}