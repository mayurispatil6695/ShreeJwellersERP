import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface StockAdjustmentProps {
  productId: string;
  productName: string;
  currentStock: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockAdjustment({ productId, productName, currentStock, open, onOpenChange }: StockAdjustmentProps) {
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { updateItem, addItem } = useUserData();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    setSaving(true);
    try {
      const newStock = adjustmentType === "increase" ? currentStock + quantity : currentStock - quantity;
      if (newStock < 0) {
        toast.error("Stock cannot be negative");
        return;
      }
      await updateItem("products", productId, { stock: newStock });
      await addItem("stock_adjustments", {
        product_id: productId,
        product_name: productName,
        adjustment_type: adjustmentType,
        quantity,
        old_stock: currentStock,
        new_stock: newStock,
        reason,
        notes,
        date: new Date().toISOString(),
      });
      toast.success(`Stock adjusted: ${adjustmentType === "increase" ? "+" : "-"}${quantity}`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock – {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Stock</Label>
            <p className="text-lg font-bold">{currentStock}</p>
          </div>
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(v: "increase" | "decrease") => setAdjustmentType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">➕ Increase Stock</SelectItem>
                <SelectItem value="decrease">➖ Decrease Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Physical Count">📦 Physical Count</SelectItem>
                <SelectItem value="Damaged">💔 Damaged / Breakage</SelectItem>
                <SelectItem value="Return from Customer">🔄 Return from Customer</SelectItem>
                <SelectItem value="Supplier Return">📤 Return to Supplier</SelectItem>
                <SelectItem value="Theft / Loss">⚠️ Theft / Loss</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional details..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Adjusting..." : "Apply Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}