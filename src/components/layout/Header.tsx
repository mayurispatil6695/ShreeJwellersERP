import { Search, User, Globe, Store, LogOut } from "lucide-react";
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

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between pl-14 pr-4 sm:px-6 lg:pl-6">
      {/* Left Section - Store info (hidden on mobile, shown on tablet+) */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-secondary/50 text-xs sm:text-sm">
          <Store className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium truncate">Main Store</span>
          <span className="text-muted-foreground hidden md:inline">• Mumbai</span>
        </div>
      </div>

      {/* Search - Responsive width */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4 lg:mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-secondary/30 border-border/50 focus:bg-secondary/50 text-sm h-9 sm:h-10"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Selector - Hidden on mobile */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex h-9 w-9">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Profile with Dropdown */}
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
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
