import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { GlowSection } from '@/components/ui/glow-section';
import { ChevronRight, User, FileText, Shield, Bell, Palette, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { useOnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useTranslation } from '@/i18n/LanguageContext';

const ACCENT = '210 70% 55%';

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

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden" style={{
        background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15) 0%, hsl(var(--background)) 50%)`,
      }}>
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{
          background: `linear-gradient(90deg, transparent, hsl(${ACCENT} / 0.8), transparent)`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle, hsl(${ACCENT} / 0.4), transparent 70%)`,
        }} />
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(165deg, hsl(${ACCENT} / 0.25), hsl(${ACCENT} / 0.08))`,
              border: `1px solid hsl(${ACCENT} / 0.3)`,
              boxShadow: `0 0 20px hsl(${ACCENT} / 0.15)`,
            }}>
              <SettingsIcon className="w-5 h-5" style={{ color: `hsl(${ACCENT})` }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: `hsl(${ACCENT} / 0.5)` }}>ID # 0572564</p>
              <h1 className="text-lg font-bold text-foreground">{t('settings_title')}</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-4 space-y-5">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: `hsl(${ACCENT})` }}>{section.title}</h2>
            <GlowSection color={ACCENT}>
              <div>
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02] ${
                        index !== section.items.length - 1 ? 'border-b' : ''
                      }`}
                      style={{ borderColor: `hsl(${ACCENT} / 0.1)` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
                          background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15), hsl(${ACCENT} / 0.05))`,
                          border: `1px solid hsl(${ACCENT} / 0.15)`,
                        }}>
                          <Icon className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    </Link>
                  );
                })}
              </div>
            </GlowSection>
          </div>
        ))}

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: `hsl(${ACCENT})` }}>{t('settings_help')}</h2>
          <GlowSection color={ACCENT}>
            <button
              onClick={startTour}
              className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
                  background: `linear-gradient(165deg, hsl(${ACCENT} / 0.15), hsl(${ACCENT} / 0.05))`,
                  border: `1px solid hsl(${ACCENT} / 0.15)`,
                }}>
                  <HelpCircle className="w-4 h-4" style={{ color: `hsl(${ACCENT})` }} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm">{t('settings_app_tour')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('settings_app_tour_desc')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          </GlowSection>
        </div>
      </main>
    </PageShell>
  );
}
