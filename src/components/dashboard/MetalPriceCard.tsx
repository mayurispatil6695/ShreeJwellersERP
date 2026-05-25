import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Static fallback prices (realistic as of May 2026)
const FALLBACK_PRICES = [
  { name: "Gold 24K", price: 7250, change: 0 },
  { name: "Silver", price: 85.5, change: 0 },
  { name: "Platinum", price: 3120, change: 0 },
];

export function MetalPriceCard() {
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const calculateChange = (oldPrice: number, newPrice: number) => {
    if (oldPrice === 0) return 0;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  };

  const fetchPrices = async (retryDelay = 0) => {
    if (loading) return;
    if (retryTimeout) clearTimeout(retryTimeout);
    setRetryTimeout(null);
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=gold,silver,platinum&vs_currencies=inr",
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || '10';
          const delay = parseInt(retryAfter) * 1000;
          if (isMounted.current) {
            setError(true);
            setRetryTimeout(setTimeout(() => fetchPrices(delay), delay));
          }
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && data.gold && data.silver && data.platinum) {
        let goldPrice = data.gold.inr;
        let silverPrice = data.silver.inr;
        let platinumPrice = data.platinum.inr;
        // CoinGecko sometimes returns prices per troy ounce; convert if needed
        if (goldPrice > 50000) goldPrice = goldPrice / 31.1034768;
        if (silverPrice > 2000) silverPrice = silverPrice / 31.1034768;
        if (platinumPrice > 20000) platinumPrice = platinumPrice / 31.1034768;
        setPrices(prev => {
          const newPrices = [...prev];
          newPrices[0] = { ...newPrices[0], price: Math.round(goldPrice), change: calculateChange(prev[0].price, goldPrice) };
          newPrices[1] = { ...newPrices[1], price: parseFloat(silverPrice.toFixed(2)), change: calculateChange(prev[1].price, silverPrice) };
          newPrices[2] = { ...newPrices[2], price: Math.round(platinumPrice), change: calculateChange(prev[2].price, platinumPrice) };
          return newPrices;
        });
        setLastUpdated(new Date());
        setError(false);
      } else {
        throw new Error("Invalid data structure");
      }
    } catch (err) {
      console.error("Failed to fetch metal prices", err);
      setError(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Only attempt again once every 15 minutes to avoid rate limits
    const interval = setInterval(() => {
      if (isMounted.current && !loading) fetchPrices();
    }, 15 * 60 * 1000);
    return () => {
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const timeAgo = () => {
    const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const handleRefresh = () => {
    if (retryTimeout) clearTimeout(retryTimeout);
    fetchPrices();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Live Metal Prices</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">
          {error && "Using cached rates • "}Last updated: {timeAgo()}
        </p>
        <div className="space-y-2">
          {prices.map((metal) => (
            <div key={metal.name} className="flex justify-between items-center">
              <span className="text-sm">{metal.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  ₹
                  {metal.price.toLocaleString(undefined, {
                    minimumFractionDigits: metal.price < 100 ? 2 : 0,
                  })}
                  /g
                </span>
                {Math.abs(metal.change) > 0.01 && (
                  <span
                    className={`flex items-center gap-0.5 ${
                      metal.change > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {metal.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
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