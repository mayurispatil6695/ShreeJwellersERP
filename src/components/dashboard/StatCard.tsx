import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  description?: string;
  accentColor?: "gold" | "emerald" | "ruby" | "silver";
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  accentColor = "gold",
  delay = 0,
}: StatCardProps) {
  const accentClasses = {
    gold: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald bg-emerald/10 border-emerald/20",
    ruby: "text-ruby bg-ruby/10 border-ruby/20",
    silver: "text-silver bg-silver/10 border-silver/20",
  };

  return (
    <Card
      variant="stat"
      className="animate-fade-in group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-display font-bold tracking-tight">
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded-full",
                    change.positive
                      ? "text-emerald bg-emerald/10"
                      : "text-ruby bg-ruby/10"
                  )}
                >
                  {change.positive ? "+" : ""}
                  {change.value}
                </span>
                {description && (
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl border transition-all duration-300 group-hover:scale-110",
              accentClasses[accentColor]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
