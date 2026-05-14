import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const METAL_API_KEY = "721660a5e9e391dbdbe2065449083f4d";

export function MetalPriceCard() {
  const [prices, setPrices] = useState([
    { name: "Gold 24K", price: 7250, change: 0 },
    { name: "Silver", price: 85.5, change: 0 },
    { name: "Platinum", price: 3120, change: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_API_KEY}&base=INR&currencies=XAU,XAG,XPT`
      );
      const data = await response.json();
      console.log("API Response:", data);

      // Extract rates – the API uses keys: INRXAU, INRXAG, INRXPIT
      const goldTroyOz = data.rates?.INRXAU;
      const silverTroyOz = data.rates?.INRXAG;
      const platinumTroyOz = data.rates?.INRXPIT;  // Note: key is INRXPIT (not INRXPIT)

      const newPrices = [...prices];

      if (goldTroyOz) {
        const goldPerGram = goldTroyOz / 31.1034768;
        newPrices[0] = { ...newPrices[0], price: Math.round(goldPerGram) };
      }
      if (silverTroyOz) {
        const silverPerGram = silverTroyOz / 31.1034768;
        newPrices[1] = { ...newPrices[1], price: parseFloat(silverPerGram.toFixed(2)) };
      }
      if (platinumTroyOz) {
        const platinumPerGram = platinumTroyOz / 31.1034768;
        newPrices[2] = { ...newPrices[2], price: Math.round(platinumPerGram) };
      }

      setPrices(newPrices);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch metal prices", err);
      setError(true);
      // Keep existing (fallback) prices
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = () => {
    const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Live Metal Prices</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchPrices} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">
          {error ? "Using fallback rates • " : ""}Last updated: {timeAgo()}
        </p>
        <div className="space-y-2">
          {prices.map((metal) => (
            <div key={metal.name} className="flex justify-between items-center">
              <span className="text-sm">{metal.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  ₹{metal.price.toLocaleString(undefined, { minimumFractionDigits: metal.price < 100 ? 2 : 0 })}/g
                </span>
                {metal.change !== 0 && (
                  <span className={metal.change > 0 ? "text-green-500" : "text-red-500"}>
                    {metal.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(metal.change).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}