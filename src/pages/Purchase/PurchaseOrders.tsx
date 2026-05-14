import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Loader2, Eye, CheckCircle, XCircle, Package, TrendingUp, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserData } from "@/hooks/useUserData";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { format } from "date-fns";

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  gst: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  stock: number;
}

interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Draft" | "Approved" | "Received" | "Cancelled";
  notes: string;
  created_at: string;
}

const emptyItem = (): PurchaseOrderItem => ({
  product_id: "",
  product_name: "",
  sku: "",
  quantity: 0,
  unit_price: 0,
  total: 0,
});

export default function PurchaseOrders() {
  const { getAll, addItem, updateItem } = useUserData();
  const { createNotification } = useNotifications();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    supplier_id: "",
    expected_delivery_date: "",
    notes: "",
    items: [emptyItem()],
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: () => getAll<PurchaseOrder>("purchase_orders"),
  });

  useQuery({
    queryKey: ["suppliers_for_po"],
    queryFn: async () => {
      const data = await getAll<Supplier>("suppliers");
      setSuppliers(data);
      return data;
    },
  });

  useQuery({
    queryKey: ["products_for_po"],
    queryFn: async () => {
      const data = await getAll<Product>("products");
      setProducts(data);
      return data;
    },
  });

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.po_number.toLowerCase().includes(q) ||
      o.supplier_name.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, emptyItem()] });
  };

  const updateItemRow = (idx: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const newItems = [...form.items];
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[idx] = {
          ...newItems[idx],
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          unit_price: product.unit_price,
        };
      }
    } else if (field === "quantity" || field === "unit_price") {
      newItems[idx][field] = Number(value);
      newItems[idx].total = newItems[idx].quantity * newItems[idx].unit_price;
    } else {
      // For product_name, sku (or other string fields) – cast via unknown to avoid index signature error
      (newItems[idx] as unknown as Record<string, unknown>)[field] = value;
    }
    setForm({ ...form, items: newItems });
  };

  const removeItemRow = (idx: number) => {
    const newItems = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items: newItems.length ? newItems : [emptyItem()] });
  };

  const calculateTotals = () => {
    const subtotal = form.items.reduce((sum, i) => sum + i.total, 0);
    const tax = Math.round(subtotal * 0.03);
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = async () => {
    if (!form.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    if (form.items.length === 0 || !form.items[0].product_id) {
      toast.error("Please add at least one product");
      return;
    }
    const { subtotal, tax, total } = calculateTotals();
    const supplier = suppliers.find(s => s.id === form.supplier_id);
    if (!supplier) return;

    setSubmitting(true);
    try {
      const poNumber = `PO-${Date.now()}`;
      await addItem("purchase_orders", {
        po_number: poNumber,
        supplier_id: form.supplier_id,
        supplier_name: supplier.name,
        order_date: new Date().toISOString(),
        expected_delivery_date: form.expected_delivery_date,
        items: form.items.filter(i => i.product_id),
        subtotal,
        tax,
        total,
        status: "Draft",
        notes: form.notes,
      });
      toast.success(`Purchase order ${poNumber} created`);
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to create purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      supplier_id: "",
      expected_delivery_date: "",
      notes: "",
      items: [emptyItem()],
    });
    setEditing(null);
  };

  const handleReceiveOrder = async (order: PurchaseOrder) => {
    if (order.status !== "Approved" && order.status !== "Draft") {
      toast.info("Order cannot be received");
      return;
    }
    try {
      // Increase stock for each product
      for (const item of order.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newStock = product.stock + item.quantity;
          await updateItem("products", item.product_id, { stock: newStock });
          // Update purchase price (the unit price from the order is the cost)
          await updateItem("products", item.product_id, { purchase_price: item.unit_price });
        }
      }
      await updateItem("purchase_orders", order.id, { status: "Received" });
      toast.success(`Order ${order.po_number} received. Stock updated.`);
      createNotification({
        title: "Purchase Order Received",
        message: `${order.po_number} from ${order.supplier_name} has been received. Stock levels updated.`,
        type: "inventory",
        priority: "medium",
      });
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error("Failed to receive order");
    }
  };

  const handleApproveOrder = async (order: PurchaseOrder) => {
    if (order.status !== "Draft") return;
    await updateItem("purchase_orders", order.id, { status: "Approved" });
    toast.success(`Order ${order.po_number} approved`);
    queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft": return <Badge variant="secondary">Draft</Badge>;
      case "Approved": return <Badge className="bg-blue-500">Approved</Badge>;
      case "Received": return <Badge className="bg-green-500">Received</Badge>;
      case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage supplier orders and receive stock</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Purchase Order
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by PO # or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No purchase orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono">{po.po_number}</TableCell>
                        <TableCell>{po.supplier_name}</TableCell>
                        <TableCell>{format(new Date(po.order_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>₹{po.total.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewing(po)} title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {po.status === "Draft" && (
                              <Button variant="outline" size="sm" onClick={() => handleApproveOrder(po)}>Approve</Button>
                            )}
                            {(po.status === "Draft" || po.status === "Approved") && (
                              <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleReceiveOrder(po)}>
                                <Package className="w-4 h-4 mr-1" /> Receive
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input type="date" value={form.expected_delivery_date} onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Order Items</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price (₹)</TableHead>
                      <TableHead>Total (₹)</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={item.product_id} onValueChange={(v) => updateItemRow(idx, "product_id", v)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{item.sku || "-"}</TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItemRow(idx, "quantity", e.target.value)} className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={(e) => updateItemRow(idx, "unit_price", e.target.value)} className="w-28" />
                        </TableCell>
                        <TableCell className="font-semibold">₹{item.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItemRow(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="border-t pt-3 space-y-1 text-right">
              <div className="flex justify-end gap-4 text-sm">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-end gap-4 text-sm">
                <span>GST (3%):</span>
                <span className="font-mono">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-end gap-4 font-bold text-base">
                <span>Total:</span>
                <span className="text-primary">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold">PO Number:</span> {viewing.po_number}</div>
                <div><span className="font-semibold">Supplier:</span> {viewing.supplier_name}</div>
                <div><span className="font-semibold">Order Date:</span> {format(new Date(viewing.order_date), "dd MMM yyyy")}</div>
                <div><span className="font-semibold">Expected Delivery:</span> {viewing.expected_delivery_date ? format(new Date(viewing.expected_delivery_date), "dd MMM yyyy") : "Not set"}</div>
                <div><span className="font-semibold">Status:</span> {getStatusBadge(viewing.status)}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewing.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.unit_price.toLocaleString()}</TableCell>
                      <TableCell>₹{item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1">
                <div>Subtotal: ₹{viewing.subtotal.toLocaleString()}</div>
                <div>GST (3%): ₹{viewing.tax.toLocaleString()}</div>
                <div className="font-bold text-lg">Total: ₹{viewing.total.toLocaleString()}</div>
              </div>
              {viewing.notes && <div><span className="font-semibold">Notes:</span> {viewing.notes}</div>}
              {viewing.status !== "Received" && viewing.status !== "Cancelled" && (
                <div className="flex justify-end gap-2">
                  {viewing.status === "Draft" && (
                    <Button onClick={() => { handleApproveOrder(viewing); setViewing(null); }}>Approve Order</Button>
                  )}
                  {(viewing.status === "Draft" || viewing.status === "Approved") && (
                    <Button className="bg-green-600" onClick={() => { handleReceiveOrder(viewing); setViewing(null); }}>Receive Order</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}