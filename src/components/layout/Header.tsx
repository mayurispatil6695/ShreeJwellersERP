import { Search, User, Store, LogOut, Globe } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserData } from "@/hooks/useUserData";
import { Loader2 } from "lucide-react";

// Interfaces for type safety
interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface StoreSettings {
  name: string;
  location: string;
}

// Custom hook to fetch store settings from Firebase
function useStoreSettings() {
  const { getById } = useUserData();
  const [store, setStore] = useState<StoreSettings>({ name: "Main Store", location: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getById<StoreSettings>("settings", "store");
        if (settings) {
          setStore({ name: settings.name || "Main Store", location: settings.location || "" });
        }
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [getById]);

  return { store, loading };
}

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStoreSettings();
  const { getAll } = useUserData();

  // Language state (simple toggle)
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const toggleLanguage = () => setLanguage(prev => prev === "en" ? "hi" : "en");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ products: Product[]; customers: Customer[] }>({ products: [], customers: [] });
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: language === "en" ? "Logged out" : "लॉग आउट",
      description: language === "en" ? "You have been successfully logged out." : "आप सफलतापूर्वक लॉग आउट हो गए हैं।",
    });
    navigate('/auth');
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().length >= 2) {
      setIsSearching(true);
      setSearchDialogOpen(true);
      try {
        const [allProducts, allCustomers] = await Promise.all([
          getAll<Product>("products"),
          getAll<Customer>("customers"),
        ]);
        const filteredProducts = allProducts.filter((p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const filteredCustomers = allCustomers.filter((c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults({ products: filteredProducts.slice(0, 10), customers: filteredCustomers.slice(0, 10) });
      } catch (error) {
        console.error("Search failed:", error);
        toast({ title: language === "en" ? "Search failed" : "खोज विफल", description: language === "en" ? "Unable to perform search" : "खोज करने में असमर्थ", variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Translations
  const t = {
    storeName: language === "en" ? store.name : (store.name === "Main Store" ? "मुख्य स्टोर" : store.name),
    searchPlaceholder: language === "en" ? "Search products or customers..." : "उत्पाद या ग्राहक खोजें...",
    myAccount: language === "en" ? "My Account" : "मेरा खाता",
    profile: language === "en" ? "Profile" : "प्रोफ़ाइल",
    logout: language === "en" ? "Logout" : "लॉगआउट",
    admin: language === "en" ? "Admin" : "प्रशासक",
    searchResults: language === "en" ? "Search Results for" : "खोज परिणाम",
    products: language === "en" ? "Products" : "उत्पाद",
    customers: language === "en" ? "Customers" : "ग्राहक",
    noResults: language === "en" ? "No results found." : "कोई परिणाम नहीं मिला।",
    sku: language === "en" ? "SKU" : "एसकेयू",
    stock: language === "en" ? "Stock" : "स्टॉक",
    phone: language === "en" ? "Phone" : "फ़ोन",
    noEmail: language === "en" ? "no email" : "कोई ईमेल नहीं",
  };

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between pl-14 pr-4 sm:px-6 lg:pl-6">
      {/* Left Section - Store info (dynamic) */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-secondary/50 text-xs sm:text-sm">
          <Store className="w-4 h-4 text-primary shrink-0" />
          {storeLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <span className="font-medium truncate">{t.storeName}</span>
              {store.location && <span className="text-muted-foreground hidden md:inline">• {store.location}</span>}
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4 lg:mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-10 bg-secondary/30 border-border/50 focus:bg-secondary/50 text-sm h-9 sm:h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Selector - Simple toggle */}
        <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-muted-foreground hidden sm:flex h-9 w-9">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="ml-1 text-xs hidden md:inline">{language === "en" ? "EN" : "हिंदी"}</span>
        </Button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 ml-1 sm:ml-2 px-2 sm:px-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium leading-tight">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground">{t.admin}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              {t.profile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Results Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.searchResults} “{searchQuery}”</DialogTitle>
          </DialogHeader>
          {isSearching ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              {searchResults.products.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">{t.products}</h4>
                  <div className="space-y-2">
                    {searchResults.products.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          navigate(`/inventory?product=${product.id}`);
                          setSearchDialogOpen(false);
                        }}
                      >
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{t.sku}: {product.sku} | {t.stock}: {product.stock}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.customers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">{t.customers}</h4>
                  <div className="space-y-2">
                    {searchResults.customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          navigate(`/customers?customer=${customer.id}`);
                          setSearchDialogOpen(false);
                        }}
                      >
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{t.phone}: {customer.phone} • {customer.email || t.noEmail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.products.length === 0 && searchResults.customers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">{t.noResults}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}