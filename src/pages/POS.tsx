import { useState, useCallback, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart, Barcode, Search, Plus, Minus, Trash2,
  CreditCard, Banknote, Smartphone, Loader2, Calculator, Gem, Zap, Gift, Package, UserPlus, Cake, Phone, User, MapPin, Mail, Calendar, Sparkles, Percent, IndianRupee,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoldRateCalculator, type ProductForCalc, type CalcResult } from "@/components/pos/GoldRateCalculator";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/hooks/useNotifications";

// ---------- NEW IMPORTS FOR PRINTING ----------
import qz from 'qz-tray';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
// (Optional) Import certificate – comment out for localhost testing
// import { CERTIFICATE } from '@/constants/qzTrayCertificate';
// ---------------------------------------------

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  metal_type: string;
  weight: number;
  purchase_price: number;
  unit_price: number;
  stock: number;
  status: string;
}

interface CartItem {
  id: string;
  name: string;
  weight: number;
  unit_price: number;
  stock: number;
  qty: number;
  sku: string;
  calculatedPrice?: boolean;
  purity?: string;
  metal_type?: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth?: string | null;
  loyalty_points: number;
  total_purchases: number;
}

const DEFAULT_BIRTHDAY_DISCOUNT = 5;

const isGoldProduct = (p: Product) => p.metal_type?.toLowerCase().includes("gold");
const isImitationProduct = (p: Product) => {
  const name = (p.name || "").toLowerCase();
  const metal = (p.metal_type || "").toLowerCase();
  return name.includes("imitation") || name.includes("artificial") || name.includes("fashion") || metal.includes("imitation");
};

function isTodayBirthday(dob: string | null | undefined): boolean {
  if (!dob) return false;
  const today = new Date();
  const birth = new Date(dob);
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}

const POS = () => {
  const { getAll, addItem, updateItem } = useUserData();
  const { createNotification } = useNotifications();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [calcProduct, setCalcProduct] = useState<ProductForCalc | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [birthdayDiscountApplied, setBirthdayDiscountApplied] = useState(false);
  const [birthdayDiscountPercent, setBirthdayDiscountPercent] = useState(DEFAULT_BIRTHDAY_DISCOUNT);
  const [customerMode, setCustomerMode] = useState<"search" | "new" | "walkin">("search");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerDob, setNewCustomerDob] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  // Imitation discount
  const [imitationDiscountType, setImitationDiscountType] = useState<"percent" | "flat">("percent");
  const [imitationDiscountValue, setImitationDiscountValue] = useState(0);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const all = await getAll<Product>("products");
      return all.filter((p) => p.stock > 0).sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getAll<CustomerRecord>("customers"),
  });

  useEffect(() => {
    if (!selectedCustomer || !isTodayBirthday(selectedCustomer.date_of_birth)) {
      setBirthdayDiscountApplied(false);
      setBirthdayDiscountPercent(DEFAULT_BIRTHDAY_DISCOUNT);
    }
  }, [selectedCustomer]);

  // Barcode scanner detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isScanInput = active === scanInputRef.current;
      const isOtherInput = active instanceof HTMLInputElement && !isScanInput;
      if (isOtherInput) return;
      if (e.key === "Enter" && scanBufferRef.current.length >= 5) {
        e.preventDefault();
        const scannedCode = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        handleBarcodeScan(scannedCode);
        return;
      }
      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => { scanBufferRef.current = ""; }, 100);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, cart]);

  const handleBarcodeScan = useCallback((code: string) => {
    const product = products.find(
      (p) => p.barcode?.toLowerCase() === code.toLowerCase() || p.sku?.toLowerCase() === code.toLowerCase()
    );
    if (!product) { toast.error(`Product not found: ${code}`); return; }
    if (isGoldProduct(product)) {
      sendToCalculator(product);
      toast.success(`🔊 Scanned: ${product.name} → Calculator`);
    } else {
      addToCart(product);
      toast.success(`🔊 Scanned: ${product.name} → Added to Bill`);
    }
    setSearchQuery("");
  }, [products, cart]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().length >= 3) {
      const product = products.find(
        (p) => p.barcode?.toLowerCase() === searchQuery.trim().toLowerCase() || p.sku?.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (product) {
        e.preventDefault();
        if (isGoldProduct(product)) {
          sendToCalculator(product);
        } else {
          addToCart(product);
        }
        setSearchQuery("");
        return;
      }
      const filtered = products.filter(
        (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length === 1) {
        if (isGoldProduct(filtered[0])) {
          sendToCalculator(filtered[0]);
        } else {
          addToCart(filtered[0]);
        }
        setSearchQuery("");
      }
    }
  };

  // Check if cart has imitation items
  const hasImitationItems = cart.some((item) => {
    const name = (item.name || "").toLowerCase();
    const metal = (item.metal_type || "").toLowerCase();
    return name.includes("imitation") || name.includes("artificial") || name.includes("fashion") || metal.includes("imitation");
  });

  const isFullyImitation = cart.length > 0 && cart.every((item) => {
    const name = (item.name || "").toLowerCase();
    const metal = (item.metal_type || "").toLowerCase();
    return name.includes("imitation") || name.includes("artificial") || name.includes("fashion") || metal.includes("imitation");
  });

  const subtotal = cart.reduce((acc, item) => acc + item.unit_price * item.qty, 0);
  const tax = Math.round(subtotal * 0.03);
  const isBirthday = selectedCustomer ? isTodayBirthday(selectedCustomer.date_of_birth) : false;
  const birthdayDiscount = birthdayDiscountApplied ? Math.round(subtotal * (birthdayDiscountPercent / 100)) : 0;

  // Imitation discount calculation
  let imitationDiscount = 0;
  if (hasImitationItems && imitationDiscountValue > 0) {
    if (imitationDiscountType === "percent") {
      imitationDiscount = Math.round(subtotal * (imitationDiscountValue / 100));
    } else {
      imitationDiscount = Math.min(imitationDiscountValue, subtotal);
    }
  }

  const totalDiscount = birthdayDiscount + imitationDiscount;
  const total = subtotal + tax - totalDiscount;

  // ---------- NEW HELPER: Generate ESC/POS receipt data ----------
  const generateReceiptData = (saleData: {
    invoice_number: string;
    customer_name: string;
    created_at: string;
    items: { name: string; qty: number; price: number }[];
    subtotal: number;
    tax: number;
    total: number;
  }) => {
    const encoder = new ReceiptPrinterEncoder({
      language: 'esc-pos',
      width: 48,
      debug: false
    });

    encoder
      .initialize()
      .text('S H R E E   J E W E L L E R S')
      .newline()
      .text('================================')
      .newline()
      .text(`Invoice: ${saleData.invoice_number}`)
      .text(`Date: ${new Date(saleData.created_at).toLocaleString()}`)
      .text(`Customer: ${saleData.customer_name || 'Walk-in Customer'}`)
      .newline()
      .text('Items:')
      .newline();

    saleData.items.forEach(item => {
      const line = `${item.name} x${item.qty}`;
      const price = `₹${(item.price * item.qty).toLocaleString()}`;
      encoder.text(line.padEnd(30) + price.padStart(10)).newline();
    });

    encoder
      .text('================================')
      .newline()
      .text(`Subtotal:     ₹${saleData.subtotal.toLocaleString()}`)
      .text(`GST (3%):     ₹${saleData.tax.toLocaleString()}`)
      .text(`Total:        ₹${saleData.total.toLocaleString()}`)
      .newline()
      .text('================================')
      .newline()
      .text('Thank you for shopping!')
      .newline()
      .cut('full');

    return encoder.encode();
  };
  // ----------------------------------------------------------------

  // ---------- NEW: Print receipt via QZ Tray ----------
  const printReceipt = useCallback(async (saleData: {
    invoice_number: string;
    customer_name: string;
    created_at: string;
    items: { name: string; qty: number; price: number }[];
    subtotal: number;
    tax: number;
    total: number;
  }) => {
    try {
      // For localhost testing, no certificate is needed.
      // For production, uncomment the lines below and import CERTIFICATE.
      // qz.security.setCertificatePromise(() => Promise.resolve(CERTIFICATE));
      // qz.security.setSignatureAlgorithm('SHA512');

      await qz.websocket.connect();

      const printers = await qz.printers.find();
      // Try to find a thermal printer – adjust name pattern as needed
      const thermalPrinter = printers.find(p =>
        p.name.toLowerCase().includes('epson') ||
        p.name.toLowerCase().includes('tm-t82') ||
        p.name.toLowerCase().includes('xp-80c') ||
        p.name.toLowerCase().includes('thermal')
      );

      if (!thermalPrinter) {
        throw new Error('Thermal printer not found. Ensure printer is connected and QZ Tray is running.');
      }

      const config = qz.configs.create(thermalPrinter.name);
      const receiptData = generateReceiptData(saleData);

      await qz.print(config, receiptData);
      toast.success('Bill printed successfully!');
    } catch (error: unknown) {
      console.error('Print error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Print failed: ${message}...`);
    } finally {
      await qz.websocket.disconnect();
    }
  }, []);
  // ----------------------------------------------------

  const completeSaleMutation = useMutation({
    mutationFn: async () => {
      let finalCustomer = selectedCustomer;

      if (customerMode === "new" && newCustomerName.trim() && newCustomerPhone.trim()) {
        const newId = await addItem("customers", {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          email: newCustomerEmail.trim() || null,
          date_of_birth: newCustomerDob || null,
          address: newCustomerAddress.trim() || null,
          loyalty_points: 0,
          total_purchases: 0,
        });
        finalCustomer = { id: newId, name: newCustomerName.trim(), phone: newCustomerPhone.trim(), email: newCustomerEmail.trim() || null, date_of_birth: newCustomerDob || null, loyalty_points: 0, total_purchases: 0 };
      }

      const invoiceNumber = `INV-${Date.now()}`;
      await addItem("sales", {
        invoice_number: invoiceNumber,
        items: cart.map((item) => ({
          product_id: item.id, name: item.name, qty: item.qty, price: item.unit_price,
          calculated: item.calculatedPrice || false, purity: item.purity || null,
          metal_type: item.metal_type || null,
        })),
        subtotal, tax, discount: totalDiscount, total,
        payment_method: paymentMethod,
        status: "Completed",
        customer_id: finalCustomer?.id || null,
        customer_name: finalCustomer?.name || null,
        customer_phone: finalCustomer?.phone || null,
        is_imitation_bill: isFullyImitation,
        birthday_offer_applied: birthdayDiscountApplied,
        discount_type: imitationDiscount > 0 ? imitationDiscountType : (birthdayDiscountApplied ? "percent" : null),
        discount_detail: JSON.stringify({
          birthday: birthdayDiscount,
          imitation: imitationDiscount,
          birthday_percent: birthdayDiscountApplied ? birthdayDiscountPercent : 0,
          imitation_type: imitationDiscountType,
          imitation_value: imitationDiscountValue,
        }),
      });

      for (const item of cart) {
        if (!item.id.startsWith("calc-")) {
          await updateItem("products", item.id, { stock: item.stock - item.qty });
        }
      }

      if (finalCustomer) {
        await updateItem("customers", finalCustomer.id, {
          total_purchases: (finalCustomer.total_purchases || 0) + total,
          ...(birthdayDiscountApplied ? { birthday_offer_sent: true, last_offer_date: new Date().toISOString() } : {}),
        });
      }

      return { invoiceNumber, finalCustomer };
    },
    onSuccess: async ({ invoiceNumber, finalCustomer }) => {
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`Sale completed! Invoice: ${invoiceNumber}`);
      createNotification({
        title: total >= 50000 ? "🔥 High Value Sale!" : "New Sale Completed",
        message: `₹${total.toLocaleString("en-IN")} sale completed. Invoice: ${invoiceNumber}`,
        type: "sales",
        priority: total >= 50000 ? "high" : "medium",
        action_url: "/bills",
      });

      // ---- NEW: Print the receipt ----
      const printData = {
        invoice_number: invoiceNumber,
        customer_name: finalCustomer?.name || (customerMode === "new" ? newCustomerName : "Walk-in Customer"),
        created_at: new Date().toISOString(),
        items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.unit_price })),
        subtotal: subtotal,
        tax: tax,
        total: total,
      };
      await printReceipt(printData);
      // --------------------------------

      setCart([]);
      setSelectedCustomer(null);
      setBirthdayDiscountApplied(false);
      setBirthdayDiscountPercent(DEFAULT_BIRTHDAY_DISCOUNT);
      setImitationDiscountType("percent");
      setImitationDiscountValue(0);
      setShowCheckout(false);
      resetNewCustomerForm();
    },
    onError: (error) => toast.error("Failed to complete sale: " + error.message),
  });

  const resetNewCustomerForm = () => {
    setCustomerMode("search");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
    setNewCustomerDob("");
    setNewCustomerAddress("");
    setCustomerSearch("");
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) { toast.error("Not enough stock"); return; }
      setCart(cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart([...cart, { id: product.id, name: product.name, weight: product.weight, unit_price: product.unit_price, stock: product.stock, qty: 1, sku: product.sku, metal_type: product.metal_type }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const handleCalcAddToCart = useCallback((result: CalcResult) => {
    const product = products.find((p) => p.id === result.productId);
    if (product) {
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { toast.error("Not enough stock"); return; }
        setCart(cart.map((item) => item.id === product.id ? { ...item, unit_price: result.calculatedPrice, qty: item.qty + 1, calculatedPrice: true, purity: result.purity } : item));
      } else {
        setCart([...cart, { id: product.id, name: product.name, weight: result.weight, unit_price: result.calculatedPrice, stock: product.stock, qty: 1, sku: product.sku, calculatedPrice: true, purity: result.purity, metal_type: product.metal_type }]);
      }
    } else {
      setCart([...cart, { id: `calc-${Date.now()}`, name: result.productName, weight: result.weight, unit_price: result.calculatedPrice, stock: 9999, qty: 1, sku: "CUSTOM", calculatedPrice: true, purity: result.purity }]);
    }
    toast.success(`₹${result.calculatedPrice.toLocaleString()} added to bill!`);
  }, [cart, products]);

  const sendToCalculator = (product: Product) => {
    setCalcProduct({ id: product.id, name: product.name, weight: product.weight, metal_type: product.metal_type, unit_price: product.unit_price, sku: product.sku, stock: product.stock, category: product.category });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) { toast.error("Not enough stock"); return item; }
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.id !== productId));

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCustomers = customerSearch.trim()
    ? customers.filter((c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch) ||
      (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
    ).slice(0, 8)
    : [];

  return (
    <DashboardLayout>
      {/* The rest of your JSX remains unchanged – I’m keeping it identical to your original */}
      <div className="mb-6 animate-fade-in pt-2 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          <span className="text-gradient-gold">POS</span> & Sales
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Scan barcode to add • Gold items → Calculator → Bill
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Scanner / Search */}
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Barcode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Scan / Search Products
                <Badge variant="secondary" className="text-[10px] ml-auto"><Zap className="w-3 h-3 mr-1" />Auto-detect</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input ref={scanInputRef} placeholder="Scan barcode or type product name & press Enter..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} autoFocus />
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Inventory
                <Badge variant="secondary" className="ml-2">{filteredProducts.length} products</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No products found</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs text-center">Type</TableHead>
                        <TableHead className="text-xs text-center">Stock</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                        <TableHead className="text-xs text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.slice(0, 50).map((product) => {
                        const gold = isGoldProduct(product);
                        const imitation = isImitationProduct(product);
                        return (
                          <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => gold ? sendToCalculator(product) : addToCart(product)}>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                {gold && <Gem className="w-3.5 h-3.5 text-primary shrink-0" />}
                                {imitation && <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                <span className="text-sm font-medium">{product.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 text-xs font-mono text-muted-foreground">{product.sku}</TableCell>
                            <TableCell className="py-2 text-xs text-center">
                              {imitation ? (
                                <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[9px]">Imitation</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">{product.metal_type}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-xs text-center">
                              <Badge variant={product.stock <= 3 ? "destructive" : "secondary"} className="text-[10px]">{product.stock}</Badge>
                            </TableCell>
                            <TableCell className="py-2 text-sm font-semibold text-primary text-right">₹{product.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-right">
                              {gold ? (
                                <Button variant="gold" size="sm" className="h-6 text-[10px] px-2"><Calculator className="w-3 h-3 mr-1" />Calc</Button>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-6 text-xs"><Plus className="w-3 h-3 mr-1" />Add</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Cart Items
                <Badge variant="secondary" className="ml-2">{cart.length} items</Badge>
                {hasImitationItems && <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[10px] ml-1"><Sparkles className="w-3 h-3 mr-0.5" />Imitation</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Cart is empty. Scan barcode or click products from inventory to add.
                </p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const isImit = (item.name || "").toLowerCase().includes("imitation") || (item.name || "").toLowerCase().includes("artificial") || (item.name || "").toLowerCase().includes("fashion") || (item.metal_type || "").toLowerCase().includes("imitation");
                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${isImit ? "bg-purple-500/10" : "bg-primary/10"}`}>
                            {isImit ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" /> : item.calculatedPrice ? <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate flex items-center gap-1.5">
                              {item.name}
                              {item.calculatedPrice && <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">{item.purity} Calc</Badge>}
                              {isImit && <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[9px]">Imitation</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">Weight: {item.weight}g</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQty(item.id, -1)}><Minus className="w-3 h-3" /></Button>
                            <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.qty}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQty(item.id, 1)}><Plus className="w-3 h-3" /></Button>
                          </div>
                          <p className="font-semibold text-primary text-sm sm:text-base w-20 sm:w-24 text-right">₹{(item.unit_price * item.qty).toLocaleString()}</p>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => removeFromCart(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Calculator + Payment */}
        <div className="space-y-4 sm:space-y-6">
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />Gold Rate Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoldRateCalculator selectedProduct={calcProduct} onAddToCart={handleCalcAddToCart} onProductConsumed={() => setCalcProduct(null)} />
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card variant="gold">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Customer */}
              {selectedCustomer && (
                <div className={`p-3 rounded-lg border ${isBirthday ? "border-pink-500/30 bg-pink-500/5" : "border-border/50 bg-muted/30"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">{selectedCustomer.name?.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          {selectedCustomer.name}
                          {isBirthday && <Cake className="w-3.5 h-3.5 text-pink-500" />}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => { setSelectedCustomer(null); setBirthdayDiscountApplied(false); }}>Change</Button>
                  </div>
                  {/* Birthday banner */}
                  {isBirthday && cart.length > 0 && (
                    <div className="mt-2 p-2 rounded-md bg-gradient-to-r from-pink-500/10 to-orange-400/10 border border-pink-500/20">
                      <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1.5 mb-1.5">
                        🎉 Today is {selectedCustomer.name}'s Birthday!
                      </p>
                      {!birthdayDiscountApplied ? (
                        <div className="flex items-center gap-2">
                          <Input type="number" min={1} max={50} value={birthdayDiscountPercent} onChange={(e) => setBirthdayDiscountPercent(Number(e.target.value))} className="h-7 w-16 text-xs" />
                          <span className="text-xs text-muted-foreground">%</span>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] border-pink-500/30 text-pink-600 hover:bg-pink-500/10 gap-1 ml-auto"
                            onClick={() => { setBirthdayDiscountApplied(true); toast.success(`🎂 Birthday ${birthdayDiscountPercent}% discount applied!`); }}>
                            <Gift className="w-3 h-3" /> Apply
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-medium"><Gift className="w-3 h-3" />Birthday Discount ({birthdayDiscountPercent}%) = -₹{birthdayDiscount.toLocaleString()}</span>
                          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground" onClick={() => setBirthdayDiscountApplied(false)}>Remove</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Imitation Discount Section */}
              {hasImitationItems && cart.length > 0 && (
                <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Imitation Discount
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Select value={imitationDiscountType} onValueChange={(v: "percent" | "flat") => { setImitationDiscountType(v); setImitationDiscountValue(0); }}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage %</SelectItem>
                        <SelectItem value="flat">Flat ₹</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1 flex-1">
                      {imitationDiscountType === "flat" && <span className="text-xs text-muted-foreground">₹</span>}
                      <Input type="number" min={0} max={imitationDiscountType === "percent" ? 100 : subtotal} value={imitationDiscountValue} onChange={(e) => setImitationDiscountValue(Number(e.target.value))} className="h-7 text-xs" />
                      {imitationDiscountType === "percent" && <span className="text-xs text-muted-foreground">%</span>}
                    </div>
                  </div>
                  {imitationDiscount > 0 && (
                    <p className="text-[11px] text-purple-600 dark:text-purple-400">Discount: -₹{imitationDiscount.toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (3%)</span><span>₹{tax.toLocaleString()}</span></div>
                {birthdayDiscount > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><Gift className="w-3 h-3 text-pink-500" />Birthday Discount</span><span className="text-green-500">-₹{birthdayDiscount.toLocaleString()}</span></div>
                )}
                {imitationDiscount > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-500" />Imitation Discount</span><span className="text-green-500">-₹{imitationDiscount.toLocaleString()}</span></div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-bold text-base sm:text-lg"><span>Total</span><span className="text-gradient-gold">₹{total.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={paymentMethod === "Cash" ? "default" : "outline"} className="flex-col h-14 sm:h-16 gap-1" onClick={() => setPaymentMethod("Cash")}><Banknote className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-xs">Cash</span></Button>
                  <Button variant={paymentMethod === "Card" ? "default" : "outline"} className="flex-col h-14 sm:h-16 gap-1" onClick={() => setPaymentMethod("Card")}><CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-xs">Card</span></Button>
                  <Button variant={paymentMethod === "UPI" ? "default" : "outline"} className="flex-col h-14 sm:h-16 gap-1" onClick={() => setPaymentMethod("UPI")}><Smartphone className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-xs">UPI</span></Button>
                </div>
              </div>

              <Button variant="gold" className="w-full mt-4" size="lg"
                disabled={cart.length === 0 || completeSaleMutation.isPending}
                onClick={() => { resetNewCustomerForm(); setShowCheckout(true); }}>
                Complete Sale — ₹{total.toLocaleString()}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog (unchanged) */}
      <Dialog open={showCheckout} onOpenChange={(open) => { setShowCheckout(open); if (!open) resetNewCustomerForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Customer Details & Checkout
            </DialogTitle>
            <DialogDescription>
              Add customer details to generate the bill under their name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode Selector */}
            {!selectedCustomer && (
              <div className="grid grid-cols-3 gap-2">
                <Button variant={customerMode === "search" ? "default" : "outline"} size="sm" className="text-xs gap-1.5" onClick={() => setCustomerMode("search")}>
                  <Search className="w-3.5 h-3.5" />Existing
                </Button>
                <Button variant={customerMode === "new" ? "default" : "outline"} size="sm" className="text-xs gap-1.5" onClick={() => setCustomerMode("new")}>
                  <UserPlus className="w-3.5 h-3.5" />New Customer
                </Button>
                <Button variant={customerMode === "walkin" ? "default" : "outline"} size="sm" className="text-xs gap-1.5" onClick={() => setCustomerMode("walkin")}>
                  <User className="w-3.5 h-3.5" />Walk-in
                </Button>
              </div>
            )}

            {/* Search Existing Customer */}
            {!selectedCustomer && customerMode === "search" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name or phone number..." className="pl-10" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} autoFocus />
                </div>
                {customerSearch.trim() && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-border/50 rounded-lg p-2 bg-muted/20">
                    {filteredCustomers.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">No customers found for "{customerSearch}"</p>
                        <Button variant="link" size="sm" className="text-xs mt-1 text-primary" onClick={() => { setCustomerMode("new"); setNewCustomerPhone(customerSearch.replace(/\D/g, "")); }}>
                          + Add as new customer
                        </Button>
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const bday = isTodayBirthday(c.date_of_birth);
                        return (
                          <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}>
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/15 text-primary text-[10px]">{c.name?.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium flex items-center gap-1.5">{c.name} {bday && <Cake className="w-3.5 h-3.5 text-pink-500" />}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>
                            </div>
                            {bday && <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[9px] px-1.5">🎂 Birthday</Badge>}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* New Customer Form */}
            {!selectedCustomer && customerMode === "new" && (
              <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Customer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" />Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="Customer name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />Phone <span className="text-destructive">*</span></Label>
                    <Input placeholder="Phone number" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} type="tel" maxLength={10} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
                    <Input placeholder="Email (optional)" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Date of Birth</Label>
                    <Input type="date" value={newCustomerDob} onChange={(e) => setNewCustomerDob(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Address</Label>
                  <Input placeholder="Address (optional)" value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} />
                </div>
              </div>
            )}

            {/* Walk-in */}
            {!selectedCustomer && customerMode === "walkin" && (
              <div className="p-4 rounded-lg border border-border/50 bg-muted/10 text-center">
                <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Walk-in Customer</p>
                <p className="text-xs text-muted-foreground mt-1">Bill will be generated without customer details</p>
              </div>
            )}

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className={`p-3 rounded-lg border ${isBirthday ? "border-pink-500/30 bg-pink-500/5" : "border-border/50 bg-muted/30"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{selectedCustomer.name?.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        {selectedCustomer.name}
                        {isBirthday && <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[10px] px-1.5"><Cake className="w-3 h-3 mr-0.5" />Birthday!</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />{selectedCustomer.phone}
                        {selectedCustomer.email && <><span>•</span><Mail className="w-3 h-3" />{selectedCustomer.email}</>}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Total Purchases: ₹{(selectedCustomer.total_purchases || 0).toLocaleString()} • Points: {selectedCustomer.loyalty_points || 0}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedCustomer(null); setCustomerMode("search"); }}>Change</Button>
                </div>
                {isBirthday && !birthdayDiscountApplied && cart.length > 0 && (
                  <div className="mt-2 p-2 rounded-md bg-gradient-to-r from-pink-500/10 to-orange-400/10 border border-pink-500/20">
                    <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-1.5">🎉 Birthday Discount</p>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} max={50} value={birthdayDiscountPercent} onChange={(e) => setBirthdayDiscountPercent(Number(e.target.value))} className="h-7 w-16 text-xs" />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] border-pink-500/30 text-pink-600 hover:bg-pink-500/10 gap-1 ml-auto"
                        onClick={() => { setBirthdayDiscountApplied(true); toast.success(`🎂 Birthday ${birthdayDiscountPercent}% discount applied!`); }}>
                        <Gift className="w-3 h-3" /> Apply
                      </Button>
                    </div>
                  </div>
                )}
                {birthdayDiscountApplied && (
                  <div className="flex items-center justify-between text-xs p-2 rounded-md bg-pink-500/10 border border-pink-500/20 mt-2">
                    <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-medium"><Gift className="w-3 h-3" />Birthday Discount ({birthdayDiscountPercent}%) = -₹{birthdayDiscount.toLocaleString()}</span>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground" onClick={() => setBirthdayDiscountApplied(false)}>Remove</Button>
                  </div>
                )}
              </div>
            )}

            {/* Bill Summary */}
            <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bill Summary</p>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2">{item.name} × {item.qty}</span>
                  <span className="shrink-0">₹{(item.unit_price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border pt-1.5 mt-1.5 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (3%)</span><span>₹{tax.toLocaleString()}</span></div>
                {birthdayDiscount > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><Gift className="w-3 h-3 text-pink-500" />Birthday</span><span className="text-green-500">-₹{birthdayDiscount.toLocaleString()}</span></div>
                )}
                {imitationDiscount > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-500" />Discount</span><span className="text-green-500">-₹{imitationDiscount.toLocaleString()}</span></div>
                )}
              </div>
              <div className="border-t border-border pt-2 mt-1">
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">₹{total.toLocaleString()}</span></div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Payment: {paymentMethod}
                {selectedCustomer ? ` • ${selectedCustomer.name}` : customerMode === "new" && newCustomerName ? ` • ${newCustomerName}` : " • Walk-in"}
                {isFullyImitation && " • Imitation Bill"}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCheckout(false)}>Cancel</Button>
            <Button variant="gold"
              disabled={completeSaleMutation.isPending || (customerMode === "new" && (!newCustomerName.trim() || !newCustomerPhone.trim()))}
              onClick={() => completeSaleMutation.mutate()}>
              {completeSaleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm & Generate Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default POS;