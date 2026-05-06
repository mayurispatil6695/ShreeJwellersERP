import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  TrendingUp,
  Scale,
  Gem,
  IndianRupee,
  Percent,
  
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

const PURITY_MAP: Record<string, { value: number; label: string }> = {
  "24K": { value: 1.0, label: "24K (99.9%)" },
  "22K": { value: 0.916, label: "22K (91.6%)" },
  "18K": { value: 0.75, label: "18K (75.0%)" },
  "14K": { value: 0.585, label: "14K (58.5%)" },
};

// Maps inventory metal_type strings to purity keys
function metalTypeToPurity(metalType: string): string {
  if (metalType.includes("24K")) return "24K";
  if (metalType.includes("22K")) return "22K";
  if (metalType.includes("18K")) return "18K";
  if (metalType.includes("14K")) return "14K";
  return "22K"; // default
}

export interface ProductForCalc {
  id: string;
  name: string;
  weight: number;
  metal_type: string;
  unit_price: number;
  sku: string;
  stock: number;
  category?: string;
}

export interface CalcResult {
  productId: string;
  productName: string;
  calculatedPrice: number;
  weight: number;
  purity: string;
  makingCharges: number;
}

interface CalcItem {
  id: string;
  productId?: string;
  productName?: string;
  goldRate: string;
  weight: string;
  purity: string;
  makingType: "percent" | "fixed";
  makingCharges: string;
  additionalCharges: string;
}

const defaultItem = (): CalcItem => ({
  id: crypto.randomUUID(),
  goldRate: "",
  weight: "",
  purity: "22K",
  makingType: "percent",
  makingCharges: "",
  additionalCharges: "",
});

const calcItemResult = (item: CalcItem) => {
  const rate = parseFloat(item.goldRate) || 0;
  const weight = parseFloat(item.weight) || 0;
  const makingAmt = parseFloat(item.makingCharges) || 0;
  const additional = parseFloat(item.additionalCharges) || 0;

  // Gold value (rate × weight)
  const goldValue = rate * weight;

  // Making charges
  const makingTotal =
    item.makingType === "percent"
      ? (goldValue * makingAmt) / 100
      : makingAmt * weight;

  // Total without GST — GST is applied once in the final POS billing
  const total = goldValue + makingTotal + additional;

  return { goldValue, makingTotal, additional, total };
};

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

interface GoldRateCalculatorProps {
  /** Product auto-filled from inventory when user clicks "Calculate" */
  selectedProduct?: ProductForCalc | null;
  /** Called when user wants to add calculated price to cart */
  onAddToCart?: (result: CalcResult) => void;
  /** Called after product is consumed so parent can clear it */
  onProductConsumed?: () => void;
}

export function GoldRateCalculator({
  selectedProduct,
  onAddToCart,
  onProductConsumed,
}: GoldRateCalculatorProps) {
  const [items, setItems] = useState<CalcItem[]>([defaultItem()]);
  const [copied, setCopied] = useState(false);

  // Auto-fill when a product is selected from inventory
  useEffect(() => {
    if (selectedProduct) {
      const purity = metalTypeToPurity(selectedProduct.metal_type);
      const newItem: CalcItem = {
        id: crypto.randomUUID(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        goldRate: "",
        weight: String(selectedProduct.weight),
        purity,
        makingType: "percent",
        makingCharges: "",
        additionalCharges: "",
      };
      // Replace first item or add as new
      setItems((prev) => {
        const first = prev[0];
        if (first && !first.goldRate && !first.weight) {
          return [newItem, ...prev.slice(1)];
        }
        return [newItem, ...prev];
      });
      toast.success(`${selectedProduct.name} loaded — enter gold rate to calculate`);
      onProductConsumed?.();
    }
  }, [selectedProduct, onProductConsumed]);

  const updateItem = useCallback((id: string, patch: Partial<CalcItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.length === 1 ? [defaultItem()] : prev.filter((i) => i.id !== id)
    );
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, defaultItem()]);
  }, []);

  const resetAll = useCallback(() => {
    setItems([defaultItem()]);
    toast.success("Calculator reset");
  }, []);

  const grandTotal = useMemo(
    () => items.reduce((s, i) => s + calcItemResult(i).total, 0),
    [items]
  );

  const copyTotal = useCallback(() => {
    navigator.clipboard.writeText(`₹${fmt(grandTotal)}`);
    setCopied(true);
    toast.success("Price copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [grandTotal]);

  const handleAddToCart = useCallback(
    (item: CalcItem) => {
      if (!onAddToCart) return;
      const res = calcItemResult(item);
      if (res.total <= 0) {
        toast.error("Enter gold rate to calculate price first");
        return;
      }
      onAddToCart({
        productId: item.productId || item.id,
        productName: item.productName || "Custom Gold Item",
        calculatedPrice: Math.round(res.total),
        weight: parseFloat(item.weight) || 0,
        purity: item.purity,
        makingCharges: res.makingTotal,
      });
      // Remove item from calculator after adding to bill
      setItems((prev) => {
        const remaining = prev.filter((i) => i.id !== item.id);
        return remaining.length === 0 ? [defaultItem()] : remaining;
      });
    },
    [onAddToCart]
  );

  // Quick rates from first item's gold rate
  const baseRate = parseFloat(items[0]?.goldRate || "0") || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >

      {/* Calculator Items */}
      <AnimatePresence mode="popLayout">
        {items.map((item, idx) => {
          const res = calcItemResult(item);
          const isProductLinked = !!item.productId;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <Card className="border-primary/10 bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Gem className="h-4 w-4 text-primary" />
                      {isProductLinked ? (
                        <span className="flex items-center gap-1.5">
                          {item.productName}
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            Inventory
                          </Badge>
                        </span>
                      ) : (
                        `Item ${idx + 1}`
                      )}
                    </CardTitle>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inputs Row 1 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <IndianRupee className="h-3 w-3 text-primary" />
                        Gold Rate/g
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 7200"
                        value={item.goldRate}
                        onChange={(e) =>
                          updateItem(item.id, { goldRate: e.target.value })
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Scale className="h-3 w-3 text-primary" />
                        Weight (g)
                        {isProductLinked && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">
                            Auto
                          </Badge>
                        )}
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        value={item.weight}
                        onChange={(e) =>
                          updateItem(item.id, { weight: e.target.value })
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>


                  {/* Making Charges */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <Percent className="h-3 w-3 text-primary" />
                        Making Charges
                      </Label>
                      <div className="flex gap-1.5">
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.makingCharges}
                          onChange={(e) =>
                            updateItem(item.id, {
                              makingCharges: e.target.value,
                            })
                          }
                          className="h-9 text-sm"
                        />
                        <Select
                          value={item.makingType}
                          onValueChange={(v: "percent" | "fixed") =>
                            updateItem(item.id, { makingType: v })
                          }
                        >
                          <SelectTrigger className="h-9 w-16 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="fixed">₹/g</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        Additional ₹
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.additionalCharges}
                        onChange={(e) =>
                          updateItem(item.id, {
                            additionalCharges: e.target.value,
                          })
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {res.total > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-lg border border-primary/10 bg-primary/5 p-3 space-y-1.5"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Price Breakdown
                      </p>
                      <Row label="Gold Value" value={res.goldValue} />
                      <Row label="Making Charges" value={res.makingTotal} />
                      {res.additional > 0 && (
                        <Row label="Additional" value={res.additional} />
                      )}
                      <div className="border-t border-primary/10 pt-1.5 mt-1.5">
                        <div className="flex justify-between font-bold text-sm">
                          <span>Total (excl. GST)</span>
                          <span className="text-primary">₹{fmt(res.total)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">GST (3%) will be added in final bill</p>
                      </div>

                      {/* Add to Bill button — always show when onAddToCart is available */}
                      {onAddToCart && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-2"
                        >
                          <Button
                            variant="gold"
                            size="lg"
                            className="w-full text-sm font-semibold"
                            onClick={() => handleAddToCart(item)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Bill — ₹{fmt(res.total)}
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Item
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetAll}
          className="text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>

      {/* Grand Total */}
      {grandTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Grand Total ({items.length} item{items.length > 1 ? "s" : ""})
                </p>
                <p className="text-xl font-bold text-primary mt-0.5">
                  ₹{fmt(grandTotal)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyTotal}
                className="border-primary/20 text-xs"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span>₹{fmt(value)}</span>
    </div>
  );
}
