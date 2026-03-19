import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Building2, Users, Globe, Server, Briefcase, UserCheck, MapPin, Phone, Mail, Target, TrendingUp, Shield, Award, Zap, BarChart3, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/LanguageContext';
import aboutHero from '@/assets/about-hero.jpg';
import isabellaAvatar from '@/assets/team/isabella-walker.jpg';
import cristopherAvatar from '@/assets/team/cristopher-hayes.jpg';
import edithAvatar from '@/assets/team/edith-sanchez.jpg';
import andresAvatar from '@/assets/team/andres-lopez.jpg';
import kenjiAvatar from '@/assets/team/kenji-tanaka.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const offices = [
  { flag: '🇲🇹', country: 'Malta', address: 'Marija Immakulata', city: 'Gzira 1326', email: 'valleta-coins@signal.com', phone: '+356-7950124' },
  { flag: '🇳🇱', country: 'Netherlands', address: 'Boomgaardstraat 12', city: 'Fijnaart 2544', email: 'hollad-coins@signal.com', phone: '+31 06 85006065' },
];

export default function About() {
  const { t } = useTranslation();

  const stats = [
    { icon: Briefcase, value: '6+', label: t('about_stat_experience'), desc: t('about_stat_experience_desc') },
    { icon: UserCheck, value: '93%', label: t('about_stat_recurring'), desc: t('about_stat_recurring_desc') },
    { icon: Globe, value: '400+', label: t('about_stat_clients'), desc: t('about_stat_clients_desc') },
    { icon: Server, value: '40+', label: t('about_stat_domains'), desc: t('about_stat_domains_desc') },
    { icon: Building2, value: '1.6K+', label: t('about_stat_projects'), desc: t('about_stat_projects_desc') },
    { icon: Users, value: '3K+', label: t('about_stat_professionals'), desc: t('about_stat_professionals_desc') },
  ];

  const values = [
    { icon: Target, title: t('about_val_precision'), desc: t('about_val_precision_desc') },
    { icon: Shield, title: t('about_val_security'), desc: t('about_val_security_desc') },
    { icon: TrendingUp, title: t('about_val_innovation'), desc: t('about_val_innovation_desc') },
    { icon: Award, title: t('about_val_transparency'), desc: t('about_val_transparency_desc') },
  ];

  const teamMembers = [
    { name: 'Isabella Walker', role: t('about_role_support'), desc: t('about_role_support_desc'), year: 2023, avatar: isabellaAvatar },
    { name: 'Cristopher Hayes', role: t('about_role_intl'), desc: t('about_role_intl_desc'), year: 2021, avatar: cristopherAvatar },
    { name: 'Edith Sanchez', role: t('about_role_marketing'), desc: t('about_role_marketing_desc'), year: 2022, avatar: edithAvatar },
    { name: 'Andres Lopez', role: t('about_role_accountant'), desc: t('about_role_accountant_desc'), year: 2021, avatar: andresAvatar },
    { name: 'Kenji Tanaka', role: t('about_role_engineer'), desc: t('about_role_engineer_desc'), year: 2023, avatar: kenjiAvatar },
  ];

  const milestones = [
    { year: '2019', event: t('about_milestone_2019') },
    { year: '2020', event: t('about_milestone_2020') },
    { year: '2021', event: t('about_milestone_2021') },
    { year: '2022', event: t('about_milestone_2022') },
    { year: '2023', event: t('about_milestone_2023') },
    { year: '2024', event: t('about_milestone_2024') },
  ];

  return (
    <PageShell>
      <Header />
      <main className="py-4 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('about_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('about_subtitle')}</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6 overflow-hidden bg-card border-border">
            <div className="relative">
              <img src={aboutHero} alt="Kinderdijk" className="w-full h-48 md:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary mb-2">
                  <Zap className="w-3 h-3 mr-1" /> {t('about_founded')}
                </Badge>
                <h2 className="text-lg font-bold text-foreground leading-tight">{t('about_hero_title')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('about_hero_subtitle')}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> {t('about_origin_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t('about_origin_p1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about_origin_p2') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about_origin_p3') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about_origin_p4') }} />
          </CardContent>
        </Card>

        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Shield className="w-4 h-4" /> {t('about_values_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {values.map((v, i) => (
                <motion.div key={v.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-secondary border border-border/50">
                    <v.icon className="w-5 h-5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> {t('about_stats_title')}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <GlowCard className="h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-lg font-bold text-primary tabular-nums">{s.value}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-1">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <Zap className="w-4 h-4" /> {t('about_timeline_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l-2 border-primary/30 space-y-4">
              {milestones.map((m, i) => (
                <motion.div key={m.year} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary border-2 border-card" />
                  <div>
                    <span className="text-xs font-bold text-primary tabular-nums">{m.year}</span>
                    <p className="text-xs text-muted-foreground">{m.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> {t('about_team_title')}
        </h2>
        <div className="space-y-3 mb-6">
          {teamMembers.map((m, i) => (
            <motion.div key={m.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <GlowCard>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-14 h-14 border-2 border-border shrink-0">
                      <AvatarImage src={m.avatar} alt={m.name} />
                      <AvatarFallback className="bg-secondary text-foreground text-sm font-bold">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground">{m.name}</h3>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-primary/30 text-primary shrink-0">{m.year}</Badge>
                      </div>
                      <p className="text-[11px] font-medium text-primary mb-1">{m.role}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> {t('about_offices_title')}
        </h2>
        <div className="grid grid-cols-1 gap-3 mb-6">
          {offices.map((o) => (
            <Card key={o.country} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{o.flag}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{o.country}</h3>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">{o.address}, {o.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-primary shrink-0" />
                        <a href={`mailto:${o.email}`} className="text-xs text-primary hover:underline truncate">{o.email}</a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-xs text-primary tabular-nums">{o.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <GlowCard className="mb-4">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-foreground font-medium mb-1">{t('about_cta_title')}</p>
            <p className="text-xs text-muted-foreground mb-3">{t('about_cta_subtitle')}</p>
            <div className="flex gap-2 justify-center">
              <Link to="/signals">
                <Button size="sm" className="text-xs gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> {t('about_cta_signals')} <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
              <Link to="/support">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Mail className="w-3.5 h-3.5" /> {t('about_cta_contact')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </GlowCard>
      </main>
    </PageShell>
  );
}