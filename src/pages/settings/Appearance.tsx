import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation, LANGUAGE_LABELS, LANGUAGE_FLAGS } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/translations';

export default function Appearance() {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('100');
  const [timezone, setTimezone] = useState('america-bogota');
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <span className="text-xs text-muted-foreground">ID # 0572564</span>
            <h1 className="text-xl font-bold text-foreground">{t('appearance_title')}</h1>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('appearance_prefs')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('appearance_theme')}</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">{t('appearance_theme_dark')}</SelectItem>
                    <SelectItem value="light">{t('appearance_theme_light')}</SelectItem>
                    <SelectItem value="system">{t('appearance_theme_system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('appearance_language')}</label>
                <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('appearance_font_size')}</label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="125">125%</SelectItem>
                    <SelectItem value="150">150%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('appearance_timezone')}</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-bogota">Bogotá, Quito UTC -05:00</SelectItem>
                    <SelectItem value="america-new-york">New York UTC -05:00</SelectItem>
                    <SelectItem value="europe-london">London UTC +00:00</SelectItem>
                    <SelectItem value="asia-tokyo">Tokyo UTC +09:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
