import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Mail, MessageSquare, Bell, Plus, Send, Users, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sent_count: number;
  opened_count: number;
  converted_count: number;
}

const Marketing = () => {
  const { getAll, addItem, updateItem } = useUserData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "Email", status: "Draft" });
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => getAll<Campaign>("campaigns"),
  });

  const addCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return addItem("campaigns", { ...data, sent_count: 0, opened_count: 0, converted_count: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created successfully!");
      setIsDialogOpen(false);
      setFormData({ name: "", type: "Email", status: "Draft" });
    },
    onError: (error) => toast.error("Failed to create campaign: " + error.message),
  });

  const activateCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const sentCount = Math.floor(Math.random() * 2000) + 500;
      const openedCount = Math.floor(sentCount * 0.65);
      const convertedCount = Math.floor(openedCount * 0.1);
      await updateItem("campaigns", campaignId, { status: "Active", sent_count: sentCount, opened_count: openedCount, converted_count: convertedCount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign activated!");
    },
    onError: (error) => toast.error("Failed to activate campaign: " + error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCampaignMutation.mutate(formData);
  };

  const stats = {
    messagesSent: campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
    openRate: campaigns.length > 0 ? (campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0) / Math.max(campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0), 1)) * 100 : 0,
    conversionRate: campaigns.length > 0 ? (campaigns.reduce((acc, c) => acc + (c.converted_count || 0), 0) / Math.max(campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0), 1)) * 100 : 0,
    activeCampaigns: campaigns.filter((c) => c.status === "Active").length,
  };

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in pt-2 sm:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold"><span className="text-gradient-gold">Marketing</span> & Campaigns</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Create campaigns, automate marketing, and track performance</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button variant="gold" className="shrink-0 w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />New Campaign</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create New Campaign</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Campaign Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Diwali Gold Rush" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Campaign Type</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="Push Notification">Push Notification</SelectItem><SelectItem value="Email + SMS">Email + SMS</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Scheduled">Scheduled</SelectItem><SelectItem value="Active">Active</SelectItem></SelectContent></Select></div>
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={addCampaignMutation.isPending}>
                  {addCampaignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Campaign
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><div className="flex items-center gap-1 sm:gap-2"><Send className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" /><p className="text-xs sm:text-sm text-muted-foreground truncate">Messages Sent</p></div><p className="text-xl sm:text-2xl font-bold">{stats.messagesSent.toLocaleString()}</p></CardContent></Card>
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><div className="flex items-center gap-1 sm:gap-2"><Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 shrink-0" /><p className="text-xs sm:text-sm text-muted-foreground">Open Rate</p></div><p className="text-xl sm:text-2xl font-bold text-green-500">{stats.openRate.toFixed(1)}%</p></CardContent></Card>
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><div className="flex items-center gap-1 sm:gap-2"><TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" /><p className="text-xs sm:text-sm text-muted-foreground truncate">Conversion</p></div><p className="text-xl sm:text-2xl font-bold text-primary">{stats.conversionRate.toFixed(1)}%</p></CardContent></Card>
        <Card variant="stat"><CardContent className="pt-4 sm:pt-6 px-3 sm:px-6"><div className="flex items-center gap-1 sm:gap-2"><Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 shrink-0" /><p className="text-xs sm:text-sm text-muted-foreground truncate">Active</p></div><p className="text-xl sm:text-2xl font-bold">{stats.activeCampaigns}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2">
          <Card variant="elevated">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />All Campaigns</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : campaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No campaigns yet. Create your first campaign!</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-gold/20 flex items-center justify-center shrink-0">
                          {campaign.type?.includes("Email") ? <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : campaign.type?.includes("SMS") ? <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{campaign.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{campaign.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <div className="text-left sm:text-right text-xs sm:text-sm">
                          <p className="font-medium">{(campaign.sent_count || 0).toLocaleString()} sent</p>
                          <p className="text-muted-foreground">{campaign.converted_count || 0} conversions</p>
                        </div>
                        {campaign.status === "Draft" ? (
                          <Button variant="outline" size="sm" onClick={() => activateCampaignMutation.mutate(campaign.id)} disabled={activateCampaignMutation.isPending}>Activate</Button>
                        ) : (
                          <Badge variant={campaign.status === "Active" ? "default" : campaign.status === "Scheduled" ? "secondary" : "outline"} className="text-xs whitespace-nowrap">{campaign.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card variant="elevated">
          <CardHeader className="pb-3 sm:pb-4"><CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"><Mail className="w-4 h-4 shrink-0" /><span className="truncate">Send Email Blast</span></Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"><MessageSquare className="w-4 h-4 shrink-0" /><span className="truncate">Send SMS Campaign</span></Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"><Bell className="w-4 h-4 shrink-0" /><span className="truncate">Push Notification</span></Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-10 sm:h-11 text-sm"><Users className="w-4 h-4 shrink-0" /><span className="truncate">Segment Customers</span></Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Marketing;
