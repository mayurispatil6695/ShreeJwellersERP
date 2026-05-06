import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Database, Download, Mail, FileJson, FileText, FileSpreadsheet, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { getByField, getAll } from '@/lib/firebaseDb';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ExportFormat = 'json' | 'csv' | 'pdf';
type ExportType = 'profile' | 'all_data' | 'system';

export function BackupExportSettings() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();
  const { isAdmin } = useUserRole();
  const [exporting, setExporting] = useState<string | null>(null);
  const [autoBackup, setAutoBackup] = useState(preferences?.auto_backup || false);
  const [backupFrequency, setBackupFrequency] = useState(preferences?.backup_frequency || 'weekly');

  const handleExport = async (type: ExportType, fmt: ExportFormat) => {
    if (!user) return;

    const key = `${type}-${fmt}`;
    setExporting(key);

    try {
      let exportData: any = {};

      if (type === 'profile' || type === 'all_data') {
        const profiles = await getByField('profiles', 'user_id', user.uid);
        exportData.profile = profiles[0] || null;
        const prefs = await getByField('user_preferences', 'user_id', user.uid);
        exportData.preferences = prefs[0] || null;
      }

      if (type === 'all_data' || type === 'system') {
        exportData.exportedAt = new Date().toISOString();
        exportData.exportType = type;
      }

      if (type === 'system' && isAdmin) {
        exportData.allProfiles = await getAll('profiles');
      }

      let content: string;
      let mimeType: string;
      let extension: string;

      switch (fmt) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'csv':
          content = convertToCSV(exportData);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'pdf':
          content = generatePDFContent(exportData);
          mimeType = 'text/plain';
          extension = 'txt';
          toast.info('PDF export is downloading as text format');
          break;
        default:
          throw new Error('Unsupported format');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${type}-${fmt}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await updatePreferences({ last_backup_at: new Date().toISOString() });
      toast.success(`${type.replace('_', ' ')} exported successfully!`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  const handleAutoBackupChange = async (enabled: boolean) => {
    setAutoBackup(enabled);
    await updatePreferences({ auto_backup: enabled });
  };

  const handleFrequencyChange = async (frequency: string) => {
    setBackupFrequency(frequency);
    await updatePreferences({ backup_frequency: frequency });
  };

  const lastBackup = preferences?.last_backup_at 
    ? format(new Date(preferences.last_backup_at), 'PPp')
    : 'Never';

  return (
    <Card variant="elevated">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Database className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Backup & Export
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Manage your data backups and exports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Backup</p>
              <p className="text-xs text-muted-foreground">{lastBackup}</p>
            </div>
          </div>
          <Badge variant={preferences?.last_backup_at ? 'default' : 'secondary'}>
            {preferences?.last_backup_at ? (<><CheckCircle className="w-3 h-3 mr-1" /> Backed Up</>) : (<><AlertCircle className="w-3 h-3 mr-1" /> No Backup</>)}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Automatic Backups</p>
              <p className="text-xs text-muted-foreground">Schedule regular backups of your data</p>
            </div>
            <Switch checked={autoBackup} onCheckedChange={handleAutoBackupChange} />
          </div>
          {autoBackup && (
            <div className="space-y-2">
              <Label className="text-xs">Backup Frequency</Label>
              <Select value={backupFrequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-sm font-medium">Export Your Data</Label>
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between"><div><p className="font-medium text-sm">Profile Data</p><p className="text-xs text-muted-foreground">Export your profile and preferences</p></div></div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('profile', 'json')} disabled={!!exporting}>{exporting === 'profile-json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}<span className="ml-2">JSON</span></Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('profile', 'csv')} disabled={!!exporting}>{exporting === 'profile-csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}<span className="ml-2">CSV</span></Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('profile', 'pdf')} disabled={!!exporting}>{exporting === 'profile-pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}<span className="ml-2">PDF</span></Button>
            </div>
          </div>
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between"><div><p className="font-medium text-sm">All User Data</p><p className="text-xs text-muted-foreground">Export all your data including transactions</p></div></div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('all_data', 'json')} disabled={!!exporting}>{exporting === 'all_data-json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}<span className="ml-2">Download JSON</span></Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('all_data', 'csv')} disabled={!!exporting}>{exporting === 'all_data-csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}<span className="ml-2">Download CSV</span></Button>
            </div>
          </div>
          {isAdmin && (
            <div className="border border-primary/50 rounded-lg p-4 space-y-3 bg-primary/5">
              <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><p className="font-medium text-sm">System Data</p><Badge variant="default" className="text-xs">Admin</Badge></div><p className="text-xs text-muted-foreground">Export all system data (admin only)</p></div></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="gold" size="sm" onClick={() => handleExport('system', 'json')} disabled={!!exporting}>{exporting === 'system-json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}<span className="ml-2">Export All</span></Button>
              </div>
            </div>
          )}
        </div>

        <Separator />
        <div className="flex items-center justify-between">
          <div><p className="font-medium text-sm">Email Export</p><p className="text-xs text-muted-foreground">Send export to your email</p></div>
          <Button variant="outline" size="sm" disabled><Mail className="w-4 h-4 mr-2" />Coming Soon</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function convertToCSV(data: any): string {
  const rows: string[] = [];
  if (data.profile) { rows.push('--- Profile ---'); rows.push(Object.keys(data.profile).join(',')); rows.push(Object.values(data.profile).map((v: any) => `"${v || ''}"`).join(',')); rows.push(''); }
  if (data.preferences) { rows.push('--- Preferences ---'); rows.push(Object.keys(data.preferences).join(',')); rows.push(Object.values(data.preferences).map((v: any) => `"${v || ''}"`).join(',')); rows.push(''); }
  if (data.allProfiles) { rows.push('--- All Profiles ---'); if (data.allProfiles.length > 0) { rows.push(Object.keys(data.allProfiles[0]).join(',')); data.allProfiles.forEach((p: any) => { rows.push(Object.values(p).map((v: any) => `"${v || ''}"`).join(',')); }); } }
  return rows.join('\n');
}

function generatePDFContent(data: any): string {
  const lines: string[] = ['='.repeat(50), 'DATA EXPORT REPORT', `Generated: ${new Date().toISOString()}`, '='.repeat(50), ''];
  if (data.profile) { lines.push('PROFILE DATA', '-'.repeat(30)); Object.entries(data.profile).forEach(([key, value]) => { lines.push(`${key}: ${value || 'N/A'}`); }); lines.push(''); }
  if (data.preferences) { lines.push('PREFERENCES', '-'.repeat(30)); Object.entries(data.preferences).forEach(([key, value]) => { lines.push(`${key}: ${value || 'N/A'}`); }); lines.push(''); }
  lines.push('='.repeat(50), 'END OF REPORT');
  return lines.join('\n');
}
