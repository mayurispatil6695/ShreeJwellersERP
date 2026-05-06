import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Store, Bell, Shield, Palette, Globe, Database, CreditCard, Sun, Moon, Monitor, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { LanguageRegionSettings } from "@/components/settings/LanguageRegionSettings";
import { BackupExportSettings } from "@/components/settings/BackupExportSettings";
import { BillingPlansSettings } from "@/components/settings/BillingPlansSettings";

type SettingsView = 'main' | 'language' | 'backup' | 'billing';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [currentView, setCurrentView] = useState<SettingsView>('main');

  const renderBackButton = () => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setCurrentView('main')}
      className="mb-4 gap-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Settings
    </Button>
  );

  // Render sub-views
  if (currentView === 'language') {
    return (
      <DashboardLayout>
        <div className="animate-fade-in pt-2 sm:pt-0">
          {renderBackButton()}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              <span className="text-gradient-gold">Language & Region</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Set your preferred language, region, and timezone
            </p>
          </div>
          <div className="max-w-2xl">
            <LanguageRegionSettings />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'backup') {
    return (
      <DashboardLayout>
        <div className="animate-fade-in pt-2 sm:pt-0">
          {renderBackButton()}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              <span className="text-gradient-gold">Backup & Export</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your data backups and exports
            </p>
          </div>
          <div className="max-w-2xl">
            <BackupExportSettings />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'billing') {
    return (
      <DashboardLayout>
        <div className="animate-fade-in pt-2 sm:pt-0">
          {renderBackButton()}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              <span className="text-gradient-gold">Billing & Plans</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your subscription and billing details
            </p>
          </div>
          <div className="max-w-4xl">
            <BillingPlansSettings />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in pt-2 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          <span className="text-gradient-gold">Settings</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Configure your store, preferences, and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Settings */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Store Information */}
          <Card variant="elevated">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Store Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Basic details about your jewellery business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-xs sm:text-sm">Store Name</Label>
                  <Input id="storeName" defaultValue="Sharma Jewellers" className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst" className="text-xs sm:text-sm">GST Number</Label>
                  <Input id="gst" defaultValue="27AADCS0472N1ZV" className="text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs sm:text-sm">Address</Label>
                <Input id="address" defaultValue="12, Jewellers Lane, Connaught Place, New Delhi - 110001" className="text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
                  <Input id="phone" defaultValue="+91 11 2345 6789" className="text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <Input id="email" type="email" defaultValue="contact@sharmajewellers.com" className="text-sm" />
                </div>
              </div>
              <Button variant="gold" className="w-full sm:w-auto">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card variant="elevated">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Low Stock Alerts</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Get notified when items are running low</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Daily Sales Summary</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Receive end-of-day sales reports</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Price Alerts</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notifications for gold price changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Customer Birthdays</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Reminders for special occasions</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card variant="elevated">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage access and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Two-Factor Authentication</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Session Timeout</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Auto logout after 30 min of inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Change Password</Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-4 sm:space-y-6">
          {/* Appearance */}
          <Card variant="elevated">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs sm:text-sm mb-3 block">Theme</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={theme === 'light' ? 'gold' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'gold' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'gold' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"
                onClick={() => setCurrentView('language')}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span className="truncate">Language & Region</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"
                onClick={() => setCurrentView('backup')}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span className="truncate">Backup & Export</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"
                onClick={() => setCurrentView('billing')}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="truncate">Billing & Plans</span>
              </Button>
            </CardContent>
          </Card>

          <Card variant="gold">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Our support team is available 24/7 to help you with any issues.
              </p>
              <Button variant="gold" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
