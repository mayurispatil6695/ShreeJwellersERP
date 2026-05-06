import { useRef } from "react";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer } from "lucide-react";

interface ProductBarcodeProps {
  barcode: string;
  productName: string;
  metalType: string;
  weight: number;
  price: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductBarcodeDialog({
  barcode,
  productName,
  metalType,
  weight,
  price,
  open,
  onOpenChange,
}: ProductBarcodeProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Barcode - ${productName}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
            .label { text-align: center; padding: 16px; border: 1px dashed #ccc; }
            .name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
            .info { font-size: 11px; color: #666; margin-bottom: 8px; }
            .price { font-weight: bold; font-size: 16px; margin-top: 4px; }
            svg { max-width: 100%; }
          </style>
        </head>
        <body>
          <div class="label">
            ${content.innerHTML}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Product Barcode</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div ref={printRef} className="bg-white rounded-lg p-4 text-center">
            <p className="name font-bold text-sm text-black">{productName}</p>
            <p className="info text-xs text-gray-500">
              {metalType} • {weight}g
            </p>
            <Barcode
              value={barcode}
              width={1.5}
              height={50}
              fontSize={12}
              background="#ffffff"
              lineColor="#000000"
              margin={4}
            />
            <p className="price font-bold text-base text-black mt-1">
              ₹{price.toLocaleString()}
            </p>
          </div>
          <Button variant="gold" className="w-full" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Barcode Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Generate a unique barcode string for a product */
export function generateBarcode(metalType: string): string {
  const prefix = metalType.replace(/\s/g, "").substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}
