import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Users, Search, Plus, Filter, Phone, Mail, Crown, Loader2, Cake, Trash2, Gift, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { CustomerDetailDialog } from "@/components/customers/CustomerDetailDialog";
import { BirthdayOfferModal } from "@/components/customers/BirthdayOfferModal";
import { useNotifications } from "@/hooks/useNotifications";

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
  birthday_offer_sent?: boolean;
  last_offer_date?: string | null;
}

const getTierColor = (totalPurchases: number) => {
  if (totalPurchases >= 5000000) return { tier: "Platinum", class: "bg-gradient-to-r from-slate-400 to-slate-600 text-white" };
  if (totalPurchases >= 1500000) return { tier: "Gold", class: "bg-gradient-gold text-primary-foreground" };
  if (totalPurchases >= 500000) return { tier: "Silver", class: "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900" };
  return { tier: "Bronze", class: "bg-muted text-muted-foreground" };
};

function isTodayBirthday(dob: string | null): boolean {
  if (!dob) return false;
  const today = new Date();
  const birth = new Date(dob);
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}

const Customers = () => {
  const { getAll, addItem, deleteItem } = useUserData();
  const { createNotification } = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [dob, setDob] = useState<Date | undefined>();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [offerCustomer, setOfferCustomer] = useState<Customer | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const birthdayCheckedRef = useRef(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getAll<Customer>("customers"),
  });

  // Auto-create birthday notifications when customers load
  useEffect(() => {
    if (isLoading || birthdayCheckedRef.current || customers.length === 0) return;
    birthdayCheckedRef.current = true;
    const today = new Date();
    customers.forEach((c) => {
      if (isTodayBirthday(c.date_of_birth)) {
        createNotification({
          title: "🎂 Birthday Today!",
          message: `${c.name}'s birthday is today. Send them a special offer!`,
          type: "birthday",
          priority: "high",
          action_url: "/customers",
        });
      }
    });
  }, [isLoading, customers, createNotification]);

  const addCustomerMutation = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, "id" | "loyalty_points" | "total_purchases">) => {
      return addItem("customers", { ...newCustomer, loyalty_points: 0, total_purchases: 0 });
    },
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully!");
      createNotification({
        title: "New Customer Added",
        message: `${variables.name} has been added to your customer list.`,
        type: "customer",
        priority: "medium",
      });
      setIsDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", address: "", city: "" });
      setDob(undefined);
    },
    onError: (error) => toast.error("Failed to add customer: " + error.message),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await deleteItem("customers", customerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully!");
      setDeletingCustomer(null);
    },
    onError: (e) => toast.error("Failed to delete: " + e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomerMutation.mutate({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      address: formData.address || null,
      city: formData.city || null,
      date_of_birth: dob ? format(dob, "yyyy-MM-dd") : null,
    });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const birthdayCustomers = customers.filter((c) => isTodayBirthday(c.date_of_birth));

  const stats = {
    totalCustomers: customers.length,
    platinumCustomers: customers.filter((c) => (c.total_purchases || 0) >= 5000000).length,
    birthdaysToday: birthdayCustomers.length,
    avgLifetimeValue: customers.length > 0 ? customers.reduce((acc, c) => acc + (c.total_purchases || 0), 0) / customers.length : 0,
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in pt-2 sm:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold"><span className="text-gradient-gold">Customer</span> CRM</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage customer relationships, loyalty tiers, and purchase history</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" className="shrink-0 w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Add Customer</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Full Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Priya Sharma" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="phone">Phone *</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" required /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="priya@email.com" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dob ? format(dob, "PPP") : <span>Pick date of birth</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dob} onSelect={setDob} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus className={cn("p-3 pointer-events-auto")} captionLayout="dropdown-buttons" fromYear={1930} toYear={new Date().getFullYear()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Mumbai" /></div>
                <div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address..." rows={2} /></div>
                <Button type="submit" variant="gold" className="w-full" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Customer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><p className="text-xs sm:text-sm text-muted-foreground">Total Customers</p><p className="text-xl sm:text-2xl font-bold text-primary">{stats.totalCustomers}</p></CardContent></Card>
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><div className="flex items-center gap-1 sm:gap-2"><Crown className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" /><p className="text-xs sm:text-sm text-muted-foreground truncate">Platinum</p></div><p className="text-xl sm:text-2xl font-bold">{stats.platinumCustomers}</p></CardContent></Card>
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><div className="flex items-center gap-1 sm:gap-2"><Cake className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500 shrink-0" /><p className="text-xs sm:text-sm text-muted-foreground truncate">Birthdays Today</p></div><p className="text-xl sm:text-2xl font-bold text-pink-500">{stats.birthdaysToday}</p></CardContent></Card>
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><p className="text-xs sm:text-sm text-muted-foreground truncate">Avg. Lifetime Value</p><p className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.avgLifetimeValue)}</p></CardContent></Card>
      </div>

      {/* Birthday Section */}
      {birthdayCustomers.length > 0 && (
        <Card className="mb-6 border-pink-500/30 bg-gradient-to-r from-pink-500/5 to-orange-400/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-pink-600 dark:text-pink-400">
              <Cake className="w-4 h-4" /> 🎂 Today's Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {birthdayCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white gap-1.5 px-3 py-1">
                      <Cake className="w-3 h-3" /> {c.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                    {c.birthday_offer_sent && (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600">Offer Sent ✓</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 border-pink-500/30 text-pink-600 hover:bg-pink-500/10"
                    onClick={() => { setOfferCustomer(c); setOfferModalOpen(true); }}
                  >
                    <Send className="w-3 h-3" /> Send Offer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />All Customers</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-10 w-full sm:w-48 md:w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <Button variant="outline" size="icon" className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{customers.length === 0 ? "No customers yet. Add your first customer!" : "No customers found."}</div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => {
                const tierInfo = getTierColor(customer.total_purchases || 0);
                const birthday = isTodayBirthday(customer.date_of_birth);
                return (
                  <div key={customer.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-colors ${birthday ? "bg-pink-500/5 border-pink-500/30 hover:bg-pink-500/10" : "bg-muted/30 border-border/50 hover:bg-muted/50"}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setDetailOpen(true); }}>
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0"><AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">{customer.name?.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm sm:text-base truncate">{customer.name}</p>
                          <Badge className={`${tierInfo.class} text-xs`}>{tierInfo.tier}</Badge>
                          {birthday && (
                            <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[10px] gap-1">
                              <Cake className="w-3 h-3" /> Birthday!
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                          {customer.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{customer.email}</span></span>}
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{customer.phone}</span>
                          {customer.date_of_birth && (
                            <span className="flex items-center gap-1"><Cake className="w-3 h-3 shrink-0" />{format(new Date(customer.date_of_birth), "dd MMM yyyy")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-primary text-sm sm:text-base">{formatCurrency(customer.total_purchases || 0)}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{customer.loyalty_points || 0} points</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {birthday && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-pink-500 hover:text-pink-600 hover:bg-pink-500/10 h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setOfferCustomer(customer); setOfferModalOpen(true); }}
                            title="Send birthday offer"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); setDeletingCustomer(customer); }}
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDetailDialog customer={selectedCustomer} open={detailOpen} onOpenChange={setDetailOpen} />
      <BirthdayOfferModal customer={offerCustomer} open={offerModalOpen} onOpenChange={setOfferModalOpen} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-primary">{deletingCustomer?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomerMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deletingCustomer) deleteCustomerMutation.mutate(deletingCustomer.id);
              }}
            >
              {deleteCustomerMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Customers;
