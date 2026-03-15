import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, User, FileText, Shield, Bell, Palette, HelpCircle } from 'lucide-react';
import { useOnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useTranslation } from '@/i18n/LanguageContext';

export default function Settings() {
  const { startTour } = useOnboardingTour();
  const { t } = useTranslation();

  const settingsSections = [
    {
      title: t('settings_profile'),
      items: [
        { icon: User, label: t('settings_personal_info'), href: '/settings/personal', description: t('settings_personal_info_desc') },
        { icon: FileText, label: t('settings_documents'), href: '/settings/documents', description: t('settings_documents_desc') },
      ]
    },
    {
      title: t('settings_security'),
      items: [
        { icon: Shield, label: t('settings_security'), href: '/settings/security', description: t('settings_security_desc') },
      ]
    },
    {
      title: t('settings_preferences'),
      items: [
        { icon: Bell, label: t('settings_notifications'), href: '/settings/notifications', description: t('settings_notifications_desc') },
        { icon: Palette, label: t('settings_appearance'), href: '/settings/appearance', description: t('settings_appearance_desc') },
      ]
    }
  ];

  return (
    <PageShell>
      <Header />
      
      <main className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">ID # 0572564</span>
          <span className="text-xl font-bold text-foreground">{t('settings_title')}</span>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-primary mb-3">{section.title}</h2>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {section.items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center justify-between p-4 hover:bg-secondary transition-colors ${
                          index !== section.items.length - 1 ? 'border-b border-border' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}

          <div>
            <h2 className="text-sm font-semibold text-primary mb-3">{t('settings_help')}</h2>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <button
                  onClick={startTour}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{t('settings_app_tour')}</p>
                      <p className="text-xs text-muted-foreground">{t('settings_app_tour_desc')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

    </PageShell>
  );
}
