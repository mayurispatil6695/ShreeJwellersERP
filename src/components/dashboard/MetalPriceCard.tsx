import { useState, useCallback } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface MetalPrice {
  name: string;
  price: number;
  change: number;
}

const fallbackPrices: MetalPrice[] = [
  { name: "Gold 24K", price: 7250, change: 0.45 },
  { name: "Gold 22K", price: 6640, change: 0.42 },
  { name: "Silver", price: 85.50, change: -0.23 },
  { name: "Platinum", price: 3120, change: 0.18 },
];

async function fetchMetalPrices(): Promise<{ prices: MetalPrice[]; updated_at: string }> {
  const { data, error } = await supabase.functions.invoke("metal-prices");
  if (error) throw error;
  return {
    prices: data?.prices || fallbackPrices,
    updated_at: data?.updated_at || new Date().toISOString(),
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export function MetalPriceCard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["metal-prices"],
    queryFn: fetchMetalPrices,
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    staleTime: 2 * 60 * 1000,
    placeholderData: { prices: fallbackPrices, updated_at: new Date().toISOString() },
  });

  const prices = data?.prices || fallbackPrices;
  const updatedAt = data?.updated_at || new Date().toISOString();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg">Live Metal Prices</h3>
          <p className="text-xs text-muted-foreground">
            {isFetching ? "Updating..." : `Last updated: ${timeAgo(updatedAt)}`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {prices.map((metal) => (
            <div
              key={metal.name}
              className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    metal.name.includes("Gold")
                      ? "bg-primary"
                      : metal.name === "Silver"
                      ? "bg-silver"
                      : "bg-platinum"
                  )}
                />
                <span className="font-medium">{metal.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold",
                      metal.name.includes("Gold")
                        ? "text-primary"
                        : metal.name === "Silver"
                        ? "text-silver"
                        : "text-platinum"
                    )}
                  >
                    ₹{metal.price.toLocaleString("en-IN", { minimumFractionDigits: metal.price < 100 ? 2 : 0 })}
                    <span className="text-xs text-muted-foreground ml-1">/gram</span>
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                    metal.change >= 0
                      ? "text-emerald bg-emerald/10"
                      : "text-ruby bg-ruby/10"
                  )}
                >
                  {metal.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(metal.change)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
