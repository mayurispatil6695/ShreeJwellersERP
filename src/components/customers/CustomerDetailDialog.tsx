import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  User, Phone, Mail, MapPin, Cake, Crown, Edit2, Save, X, Loader2,
  ShoppingBag, IndianRupee, Calendar, Package,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  loyalty_points: number;
  total_purchases: number;
  date_of_birth: string | null;
}

interface SaleItem {
  name: string;
  qty: number;
  price?: number;
  unit_price?: number;
}

interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  created_at: string;
}

const getTierInfo = (totalPurchases: number) => {
  if (totalPurchases >= 5000000) return { tier: "Platinum", class: "bg-gradient-to-r from-slate-400 to-slate-600 text-white" };
  if (totalPurchases >= 1500000) return { tier: "Gold", class: "bg-gradient-gold text-primary-foreground" };
  if (totalPurchases >= 500000) return { tier: "Silver", class: "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900" };
  return { tier: "Bronze", class: "bg-muted text-muted-foreground" };
};

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
};

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({ customer, open, onOpenChange }: Props) {
  const { getAll, updateItem } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", email: "", city: "", address: "", date_of_birth: "" });
  const queryClient = useQueryClient();

  const { data: allSales = [] } = useQuery({
    queryKey: ["all-sales"],
    queryFn: () => getAll<Sale>("sales"),
    enabled: open && !!customer,
  });

  const customerSales = customer
    ? allSales
        .filter((s) => s.customer_id === customer.id || s.customer_name === customer.name)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const allItemsPurchased = customerSales.flatMap((s) => {
    const items = Array.isArray(s.items) ? s.items : [];
    return items.map((item) => ({
      ...item,
      date: s.created_at,
      invoice: s.invoice_number,
    }));
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!customer) return;
      await updateItem("customers", customer.id, {
        name: editData.name,
        phone: editData.phone,
        email: editData.email || null,
        city: editData.city || null,
        address: editData.address || null,
        date_of_birth: editData.date_of_birth || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully!");
      setIsEditing(false);
    },
    onError: (e) => toast.error("Failed to update: " + e.message),
  });

  const startEditing = () => {
    if (!customer) return;
    setEditData({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      city: customer.city || "",
      address: customer.address || "",
      date_of_birth: customer.date_of_birth || "",
    });
    setIsEditing(true);
  };

  if (!customer) return null;
  const tierInfo = getTierInfo(customer.total_purchases || 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setIsEditing(false); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Customer Details
            </span>
            {!isEditing ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}>
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="w-3.5 h-3.5" /></Button>
                <Button variant="gold" size="sm" className="gap-1.5" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Customer Profile Header */}
        <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-muted/20">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
              {customer.name?.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="h-8 text-base font-semibold" />
            ) : (
              <h3 className="text-lg font-bold">{customer.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`${tierInfo.class} text-xs`}><Crown className="w-3 h-3 mr-1" />{tierInfo.tier}</Badge>
              <span className="text-xs text-muted-foreground">{customer.loyalty_points || 0} points</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Purchases</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(customer.total_purchases || 0)}</p>
          </div>
        </div>

        {/* Customer Info (Editable) */}
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />Phone</Label>
              <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
              <Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />City</Label>
              <Input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Cake className="w-3 h-3" />Date of Birth</Label>
              <Input type="date" value={editData.date_of_birth} onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Address</Label>
              <Input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoItem icon={Phone} label="Phone" value={customer.phone} />
            <InfoItem icon={Mail} label="Email" value={customer.email || "—"} />
            <InfoItem icon={MapPin} label="City" value={customer.city || "—"} />
            <InfoItem icon={Cake} label="DOB" value={customer.date_of_birth ? format(new Date(customer.date_of_birth), "dd MMM yyyy") : "—"} />
            {customer.address && <div className="col-span-2 sm:col-span-4"><InfoItem icon={MapPin} label="Address" value={customer.address} /></div>}
          </div>
        )}

        {/* Tabs: Purchase History & Items */}
        <Tabs defaultValue="history" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1 text-xs gap-1.5"><ShoppingBag className="w-3.5 h-3.5" />Purchase History ({customerSales.length})</TabsTrigger>
            <TabsTrigger value="items" className="flex-1 text-xs gap-1.5"><Package className="w-3.5 h-3.5" />Items Purchased ({allItemsPurchased.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {customerSales.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No purchase history found</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Invoice</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-center">Items</TableHead>
                      <TableHead className="text-xs">Payment</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerSales.map((sale) => {
                      const items = Array.isArray(sale.items) ? sale.items : [];
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="text-xs font-mono text-primary">{sale.invoice_number}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sale.created_at ? format(new Date(sale.created_at), "dd MMM yyyy") : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-center">{items.length}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{sale.payment_method}</Badge></TableCell>
                          <TableCell className="text-xs font-semibold text-right text-primary">₹{(sale.total || 0).toLocaleString("en-IN")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="items">
            {allItemsPurchased.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No items purchased yet</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs text-center">Qty</TableHead>
                      <TableHead className="text-xs text-right">Price</TableHead>
                      <TableHead className="text-xs">Invoice</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allItemsPurchased.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{item.name}</TableCell>
                        <TableCell className="text-xs text-center">{item.qty}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-primary">
                          ₹{((item.price || item.unit_price || 0) * (item.qty || 1)).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-[10px] font-mono text-muted-foreground">{item.invoice}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {item.date ? format(new Date(item.date), "dd MMM") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <Card className="border-border/50">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <ShoppingBag className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{customerSales.length}</p>
              <p className="text-[10px] text-muted-foreground">Orders</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <Package className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{allItemsPurchased.reduce((a, i) => a + (i.qty || 1), 0)}</p>
              <p className="text-[10px] text-muted-foreground">Items</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-3 pb-2 px-3 text-center">
              <IndianRupee className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{formatCurrency(customerSales.reduce((a, s) => a + (s.total || 0), 0))}</p>
              <p className="text-[10px] text-muted-foreground">Spent</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
