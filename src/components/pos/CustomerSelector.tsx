import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, X, Cake, Gift, Phone, Mail } from "lucide-react";

export interface SelectedCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  loyalty_points: number;
  total_purchases: number;
  isBirthday: boolean;
}

interface CustomerSelectorProps {
  customers: Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    date_of_birth?: string | null;
    loyalty_points: number;
    total_purchases: number;
  }>;
  selectedCustomer: SelectedCustomer | null;
  onSelect: (customer: SelectedCustomer | null) => void;
  isLoading?: boolean;
}

function isTodayBirthday(dob: string | null | undefined): boolean {
  if (!dob) return false;
  const today = new Date();
  const birth = new Date(dob);
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}

export function CustomerSelector({ customers, selectedCustomer, onSelect, isLoading }: CustomerSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [search, customers]);

  const handleSelect = (c: (typeof customers)[0]) => {
    const birthday = isTodayBirthday(c.date_of_birth);
    onSelect({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      date_of_birth: c.date_of_birth || null,
      loyalty_points: c.loyalty_points || 0,
      total_purchases: c.total_purchases || 0,
      isBirthday: birthday,
    });
    setSearch("");
    setIsOpen(false);
  };

  if (selectedCustomer) {
    return (
      <Card className={`border ${selectedCustomer.isBirthday ? "border-primary/50 bg-primary/5" : "border-border/50"}`}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {selectedCustomer.name?.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{selectedCustomer.name}</p>
                  {selectedCustomer.isBirthday && (
                    <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[10px] px-1.5 gap-1">
                      <Cake className="w-3 h-3" /> Birthday!
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedCustomer.phone}</span>
                  <span>•</span>
                  <span>{selectedCustomer.loyalty_points} pts</span>
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onSelect(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {selectedCustomer.isBirthday && (
            <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-pink-500/10 to-orange-400/10 border border-pink-500/20">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">🎂 Birthday Offer Available!</p>
                  <p className="text-[11px] text-muted-foreground">Apply 5% birthday discount for this customer</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="py-2.5 px-4 pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Select Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2.5 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>

        {isOpen && search.trim() && (
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-border/50 rounded-lg p-1.5 bg-background">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No customers found</p>
            ) : (
              filtered.map((c) => {
                const birthday = isTodayBirthday(c.date_of_birth);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelect(c)}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                        {c.name?.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium truncate">{c.name}</p>
                        {birthday && <Cake className="w-3 h-3 text-pink-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
