import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Receipt, Search, Eye, IndianRupee, ShoppingBag, Calendar, Printer, Download, MessageCircle, Gem, Sparkles, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserData } from "@/hooks/useUserData";
import { format } from "date-fns";
import { toast } from "sonner";

interface SaleItem {
  name: string;
  qty: number;
  unit_price: number;
  price?: number;
  weight?: number;
  purity?: string;
}

interface Sale {
  id: string;
  invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

function isImitationSale(sale: Sale & { is_imitation_bill?: boolean }): boolean {
  if (sale.is_imitation_bill) return true;
  const items = Array.isArray(sale.items) ? sale.items : [];
  return items.some((item) => {
    const name = (item.name || "").toLowerCase();
    return name.includes("imitation") || name.includes("artificial") || name.includes("fashion");
  });
}

const Bills = () => {
  const { getAll, updateItem, deleteItem } = useUserData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);
  const [editingBill, setEditingBill] = useState<Sale | null>(null);
  const [deletingBill, setDeletingBill] = useState<Sale | null>(null);
  const [editData, setEditData] = useState({ customer_name: "", payment_method: "", discount: 0 });
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const generateBillText = (sale: Sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    const lines = [
      `🧾 *Invoice: ${sale.invoice_number}*`,
      `👤 Customer: ${sale.customer_name || "Walk-in"}`,
      `📅 Date: ${sale.created_at ? format(new Date(sale.created_at), "dd MMM yyyy, hh:mm a") : "—"}`,
      `💳 Payment: ${sale.payment_method}`,
      "",
      "*Items:*",
      ...items.map((item: SaleItem) => `  • ${item.name} × ${item.qty} = ₹${((item.unit_price || item.price || 0) * (item.qty || 1)).toLocaleString("en-IN")}`),
      "",
      `Subtotal: ₹${(sale.subtotal || 0).toLocaleString("en-IN")}`,
      `Tax: ₹${(sale.tax || 0).toLocaleString("en-IN")}`,
      ...(sale.discount > 0 ? [`Discount: -₹${(sale.discount || 0).toLocaleString("en-IN")}`] : []),
      `*Total: ₹${(sale.total || 0).toLocaleString("en-IN")}*`,
    ];
    return lines.join("\n");
  };

 const handleWhatsAppShare = (sale: Sale) => {
  const text = generateBillText(sale);
  let phone = sale.customer_phone?.replace(/\D/g, ""); // remove non-digits

  if (phone && phone.length >= 10) {
    // Ensure India country code (91) if not present
    if (!phone.startsWith("91")) phone = "91" + phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  } else {
    // Fallback: open without number (user will need to search)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    toast.info("Customer phone not available. Please search manually.");
  }
};

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Pop-up blocked. Please allow pop-ups."); return; }
    printWindow.document.write(`
      <html><head><title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #c8a45a; padding-bottom: 12px; }
        .header h1 { font-size: 20px; margin: 0; color: #c8a45a; }
        .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .items-table th, .items-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
        .items-table th { background: #f5f5f5; font-weight: 600; }
        .totals { border-top: 2px solid #ddd; padding-top: 8px; }
        .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
        .grand-total { font-size: 16px; font-weight: bold; color: #c8a45a; border-top: 2px solid #c8a45a; padding-top: 6px; margin-top: 4px; }
        @media print { body { padding: 0; } }
      </style></head><body>${printRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const handleExport = (sale: Sale) => {
    const text = generateBillText(sale).replace(/\*/g, "");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${sale.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bill exported successfully!");
  };

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: () => getAll("sales") as Promise<Sale[]>,
  });

  const updateBillMutation = useMutation({
    mutationFn: async () => {
      if (!editingBill) return;
      const subtotal = (Array.isArray(editingBill.items) ? editingBill.items : [])
        .reduce((s, i) => s + (i.unit_price || i.price || 0) * (i.qty || 1), 0);
      const tax = Math.round(subtotal * 0.03);
      const total = subtotal + tax - (editData.discount || 0);
      await updateItem("sales", editingBill.id, {
        customer_name: editData.customer_name || null,
        payment_method: editData.payment_method,
        discount: editData.discount || 0,
        subtotal, tax, total,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Bill updated successfully!");
      setEditingBill(null);
    },
    onError: (e) => toast.error("Failed to update: " + e.message),
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      await deleteItem("sales", billId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Bill deleted successfully!");
      setDeletingBill(null);
      setSelectedBill(null);
    },
    onError: (e) => toast.error("Failed to delete: " + e.message),
  });

  const startEditing = (sale: Sale) => {
    setEditData({
      customer_name: sale.customer_name || "",
      payment_method: sale.payment_method || "Cash",
      discount: sale.discount || 0,
    });
    setEditingBill(sale);
  };

  const completedSales = sales
    .filter((s) => s.status === "Completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const regularSales = completedSales.filter((s) => !isImitationSale(s));
  const imitationSales = completedSales.filter((s) => isImitationSale(s));

  const filterSales = (list: Sale[]) => {
    const q = searchQuery.toLowerCase();
    return list.filter((s) =>
      s.invoice_number?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.payment_method?.toLowerCase().includes(q)
    );
  };

  const totalRevenue = completedSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const imitationRevenue = imitationSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const todaySales = completedSales.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

  const renderBillTable = (list: Sale[]) => {
    const filtered = filterSales(list);
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
          <p>No bills found</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Invoice #</TableHead>
              <TableHead className="whitespace-nowrap">Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Items</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              <TableHead className="hidden md:table-cell">Payment</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sale) => {
              const items = Array.isArray(sale.items) ? sale.items : [];
              return (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono font-medium text-primary text-xs sm:text-sm">{sale.invoice_number}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{sale.customer_name || "Walk-in"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{items.length} item(s)</TableCell>
                  <TableCell className="text-right font-semibold text-xs sm:text-sm">₹{(sale.total || 0).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{sale.payment_method}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {sale.created_at ? format(new Date(sale.created_at), "dd MMM yyyy, hh:mm a") : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setSelectedBill(sale)} title="View"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700" onClick={() => startEditing(sale)} title="Edit"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive" onClick={() => setDeletingBill(sale)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex text-green-600 hover:text-green-700" onClick={() => handleWhatsAppShare(sale)} title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex" onClick={() => handleExport(sale)} title="Export"><Download className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Bills</h1>
          <p className="text-muted-foreground text-sm">All completed sale invoices</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Receipt className="w-5 h-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Total Bills</p><p className="text-xl font-bold text-foreground">{completedSales.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><IndianRupee className="w-5 h-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Today's Revenue</p><p className="text-xl font-bold text-foreground">₹{todayRevenue.toLocaleString("en-IN")}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-500" /></div>
              <div><p className="text-xs text-muted-foreground">Imitation Revenue</p><p className="text-xl font-bold text-purple-600">₹{imitationRevenue.toLocaleString("en-IN")}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Tabs */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" />Invoices</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by invoice, customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">Loading bills...</div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all" className="text-xs sm:text-sm gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> All Bills ({completedSales.length})
                  </TabsTrigger>
                  <TabsTrigger value="regular" className="text-xs sm:text-sm gap-1.5">
                    <Gem className="w-3.5 h-3.5" /> Regular ({regularSales.length})
                  </TabsTrigger>
                  <TabsTrigger value="imitation" className="text-xs sm:text-sm gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Imitation ({imitationSales.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all">{renderBillTable(completedSales)}</TabsContent>
                <TabsContent value="regular">{renderBillTable(regularSales)}</TabsContent>
                <TabsContent value="imitation">{renderBillTable(imitationSales)}</TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Bill Detail Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Invoice {selectedBill?.invoice_number}
                {selectedBill && isImitationSale(selectedBill) && (
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[10px]"><Sparkles className="w-3 h-3 mr-0.5" />Imitation</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4">
                <div ref={printRef}>
                  <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "2px solid #c8a45a", paddingBottom: 10 }}>
                    <h1 style={{ fontSize: 18, margin: 0, color: "#c8a45a" }}>INVOICE</h1>
                    <p style={{ fontSize: 12, margin: "4px 0 0", color: "#666" }}>{selectedBill.invoice_number}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{selectedBill.customer_name || "Walk-in"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{selectedBill.created_at ? format(new Date(selectedBill.created_at), "dd MMM yyyy, hh:mm a") : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{selectedBill.payment_method}</span></div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 12 }}>Item</th>
                        <th style={{ textAlign: "center", padding: "6px 4px", fontSize: 12 }}>Qty</th>
                        <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 12 }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(selectedBill.items) ? selectedBill.items : []).map((item: SaleItem, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "6px 4px", fontSize: 13 }}>{item.name}</td>
                          <td style={{ textAlign: "center", padding: "6px 4px", fontSize: 13 }}>{item.qty}</td>
                          <td style={{ textAlign: "right", padding: "6px 4px", fontSize: 13 }}>₹{((item.unit_price || item.price || 0) * (item.qty || 1)).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="border-t border-border pt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(selectedBill.subtotal || 0).toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax (3%)</span><span>₹{(selectedBill.tax || 0).toLocaleString("en-IN")}</span></div>
                    {(selectedBill.discount || 0) > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-₹{(selectedBill.discount || 0).toLocaleString("en-IN")}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t border-border"><span>Total</span><span className="text-primary">₹{(selectedBill.total || 0).toLocaleString("en-IN")}</span></div>
                  </div>
                </div>
                {/* Customer Billing History */}
                {selectedBill.customer_name && selectedBill.customer_name !== "Walk-in" && (() => {
                  const customerHistory = completedSales.filter(
                    (s) => s.customer_name === selectedBill.customer_name && s.id !== selectedBill.id
                  );
                  if (customerHistory.length === 0) return null;
                  return (
                    <div className="border-t border-border pt-3">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        Customer History — {customerHistory.length} previous bill(s)
                      </h4>
                      <div className="max-h-[180px] overflow-y-auto rounded-lg border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Invoice</TableHead>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs text-center">Items</TableHead>
                              <TableHead className="text-xs text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerHistory.map((s) => (
                              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBill(s)}>
                                <TableCell className="text-xs font-mono text-primary">{s.invoice_number}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {s.created_at ? format(new Date(s.created_at), "dd MMM yyyy") : "—"}
                                </TableCell>
                                <TableCell className="text-xs text-center">{(Array.isArray(s.items) ? s.items : []).length}</TableCell>
                                <TableCell className="text-xs text-right font-semibold text-primary">₹{(s.total || 0).toLocaleString("en-IN")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Total spent: ₹{customerHistory.reduce((a, s) => a + (s.total || 0), 0).toLocaleString("en-IN")} across {customerHistory.length} previous orders
                      </p>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-green-600 border-green-600/30 hover:bg-green-50" onClick={() => handleWhatsAppShare(selectedBill)}><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExport(selectedBill)}><Download className="w-4 h-4 mr-1" /> Export</Button>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-600/30 hover:bg-blue-50" onClick={() => { setSelectedBill(null); startEditing(selectedBill); }}><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setSelectedBill(null); setDeletingBill(selectedBill); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Bill Dialog */}
        <Dialog open={!!editingBill} onOpenChange={() => setEditingBill(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-600" /> Edit Bill — {editingBill?.invoice_number}</DialogTitle>
            </DialogHeader>
            {editingBill && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input value={editData.customer_name} onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })} placeholder="Walk-in" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={editData.payment_method} onValueChange={(v) => setEditData({ ...editData, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount (₹)</Label>
                  <Input type="number" min={0} value={editData.discount} onChange={(e) => setEditData({ ...editData, discount: Number(e.target.value) })} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setEditingBill(null)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                  <Button variant="gold" className="flex-1" disabled={updateBillMutation.isPending} onClick={() => updateBillMutation.mutate()}>
                    {updateBillMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingBill} onOpenChange={() => setDeletingBill(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete invoice <span className="font-semibold text-primary">{deletingBill?.invoice_number}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteBillMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (deletingBill) deleteBillMutation.mutate(deletingBill.id);
                }}
              >
                {deleteBillMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Bills;
