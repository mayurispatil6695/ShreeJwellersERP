import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Check, Loader2 } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { SUPPORTED_LANGUAGES, SUPPORTED_REGIONS, SUPPORTED_TIMEZONES, t } from '@/lib/languages';

export function LanguageRegionSettings() {
  const { preferences, loading, updatePreferences } = useUserPreferences();
  const [saving, setSaving] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({
    language: preferences?.language || 'en',
    region: preferences?.region || 'IN',
    timezone: preferences?.timezone || 'Asia/Kolkata',
  });

  // Sync local state when preferences load
  useState(() => {
    if (preferences) {
      setLocalPrefs({
        language: preferences.language,
        region: preferences.region || 'IN',
        timezone: preferences.timezone || 'Asia/Kolkata',
      });
    }
  });

  const handleSave = async () => {
    setSaving(true);
    const success = await updatePreferences({
      language: localPrefs.language,
      region: localPrefs.region,
      timezone: localPrefs.timezone,
      currency: SUPPORTED_REGIONS.find(r => r.code === localPrefs.region)?.currency || 'INR',
    });
    setSaving(false);
  };

  const hasChanges = preferences && (
    localPrefs.language !== preferences.language ||
    localPrefs.region !== (preferences.region || 'IN') ||
    localPrefs.timezone !== (preferences.timezone || 'Asia/Kolkata')
  );

  const currentLang = localPrefs.language;

  if (loading) {
    return (
      <Card variant="elevated">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          {t('language.title', currentLang)}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('language.description', currentLang)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Language</Label>
          <Select
            value={localPrefs.language}
            onValueChange={(value) => setLocalPrefs(prev => ({ ...prev, language: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    <span className="text-muted-foreground text-xs">({lang.nativeName})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region Selection */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Region / Country</Label>
          <Select
            value={localPrefs.region}
            onValueChange={(value) => setLocalPrefs(prev => ({ ...prev, region: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_REGIONS.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  <div className="flex items-center gap-2">
                    <span>{region.flag}</span>
                    <span>{region.name}</span>
                    <span className="text-muted-foreground text-xs">({region.currency})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Timezone</Label>
          <Select
            value={localPrefs.timezone}
            onValueChange={(value) => setLocalPrefs(prev => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center gap-2">
                    <span>{tz.label}</span>
                    <span className="text-muted-foreground text-xs">({tz.offset})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          variant="gold"
          className="w-full sm:w-auto"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              {t('common.save', currentLang)}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
