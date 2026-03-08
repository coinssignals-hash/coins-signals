import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowLeft, Camera, Loader2, Save, Check, Mail, MapPin, Clock, User, CalendarDays, Shield,
  Phone, CreditCard, Play, Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useTranslation } from '@/i18n/LanguageContext';

const COUNTRY_CODES = [
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV',
  'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'ES', 'US',
  'UY', 'VE', 'GB', 'FR', 'DE', 'IT', 'PT',
];

const COUNTRY_FLAGS: Record<string, string> = {
  AR: '🇦🇷', BO: '🇧🇴', BR: '🇧🇷', CL: '🇨🇱', CO: '🇨🇴', CR: '🇨🇷', CU: '🇨🇺', DO: '🇩🇴',
  EC: '🇪🇨', SV: '🇸🇻', GT: '🇬🇹', HN: '🇭🇳', MX: '🇲🇽', NI: '🇳🇮', PA: '🇵🇦', PY: '🇵🇾',
  PE: '🇵🇪', PR: '🇵🇷', ES: '🇪🇸', US: '🇺🇸', UY: '🇺🇾', VE: '🇻🇪', GB: '🇬🇧', FR: '🇫🇷',
  DE: '🇩🇪', IT: '🇮🇹', PT: '🇵🇹',
};

const TIMEZONE_ENTRIES = [
  { value: 'America/New_York', key: 'tz_new_york', offset: 'UTC-5' },
  { value: 'America/Chicago', key: null, label: 'Chicago (CST)', offset: 'UTC-6' },
  { value: 'America/Denver', key: null, label: 'Denver (MST)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', key: 'tz_los_angeles', offset: 'UTC-8' },
  { value: 'America/Mexico_City', key: 'tz_mexico_city', offset: 'UTC-6' },
  { value: 'America/Bogota', key: null, label: 'Bogotá', offset: 'UTC-5' },
  { value: 'America/Lima', key: null, label: 'Lima', offset: 'UTC-5' },
  { value: 'America/Santiago', key: null, label: 'Santiago', offset: 'UTC-4' },
  { value: 'America/Argentina/Buenos_Aires', key: null, label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/Sao_Paulo', key: null, label: 'São Paulo', offset: 'UTC-3' },
  { value: 'Europe/Madrid', key: null, label: 'Madrid', offset: 'UTC+1' },
  { value: 'Europe/London', key: 'tz_london', offset: 'UTC+0' },
  { value: 'Europe/Paris', key: 'tz_paris', offset: 'UTC+1' },
  { value: 'Europe/Berlin', key: 'tz_berlin', offset: 'UTC+1' },
  { value: 'Asia/Tokyo', key: 'tz_tokyo', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', key: 'tz_shanghai', offset: 'UTC+8' },
];

export default function PersonalInfo() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { tier, subscribed, subscriptionEnd, loading: subLoading } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateLocale = useDateLocale();
  const { t } = useTranslation();

  const TIER_LABELS: Record<string, string> = { basico: t('pi_tier_basico') || 'Básico', plus: t('pi_tier_plus') || 'Plus', premium: t('pi_tier_premium') || 'Premium Pro Trader' };
  const TRADING_MODES = [
    { value: 'demo', label: 'Demo', desc: t('pi_demo_desc') },
    { value: 'live', label: 'Live', desc: t('pi_live_desc') },
    { value: 'paper', label: 'Paper Trading', desc: t('pi_paper_desc') },
  ];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [tradingMode, setTradingMode] = useState('demo');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || ''); setLastName(profile.last_name || '');
      setCountry(profile.country || ''); setTimezone(profile.timezone || 'America/New_York');
      setAvatarUrl(profile.avatar_url);
      const raw = profile as any;
      if (raw.date_of_birth) setDateOfBirth(new Date(raw.date_of_birth));
      setAddress(raw.address || ''); setPhone(raw.phone || ''); setTradingMode(raw.trading_mode || 'demo');
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const raw = profile as any;
    const currentDob = dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : '';
    const profileDob = raw.date_of_birth || '';
    const changed = firstName !== (profile.first_name || '') || lastName !== (profile.last_name || '') ||
      country !== (profile.country || '') || timezone !== (profile.timezone || 'America/New_York') ||
      currentDob !== profileDob || address !== (raw.address || '') || phone !== (raw.phone || '') || tradingMode !== (raw.trading_mode || 'demo');
    setHasChanges(changed);
    if (changed) setSaved(false);
  }, [firstName, lastName, country, timezone, dateOfBirth, address, phone, tradingMode, profile]);

  const getInitials = () => {
    const first = firstName?.charAt(0) || ''; const last = lastName?.charAt(0) || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const selectedCountry = country ? { code: country, flag: COUNTRY_FLAGS[country] || '', name: t(`country_${country}` as any) } : undefined;
  const memberSince = user?.created_at ? format(new Date(user.created_at), "d MMMM, yyyy", { locale: dateLocale }) : null;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast({ title: t('common_error'), description: t('pi_invalid_image') || 'Por favor selecciona una imagen válida', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: t('common_error'), description: t('pi_image_too_large') || 'La imagen no puede superar los 5MB', variant: 'destructive' }); return; }
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newUrl = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await updateProfile({ avatar_url: newUrl });
      if (updateError) throw updateError;
      setAvatarUrl(newUrl);
      toast({ title: t('pi_avatar_updated') || '✓ Avatar actualizado', description: t('pi_avatar_updated_desc') || 'Tu foto de perfil se ha actualizado' });
    } catch {
      toast({ title: t('common_error'), description: t('pi_upload_error') || 'No se pudo subir la imagen', variant: 'destructive' });
    } finally { setUploadingAvatar(false); }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updateData: any = {
        first_name: firstName.trim() || null, last_name: lastName.trim() || null,
        country: country || null, timezone: timezone || null,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        address: address.trim() || null, phone: phone.trim() || null, trading_mode: tradingMode,
      };
      const { error } = await updateProfile(updateData);
      if (error) throw error;
      setSaved(true); setHasChanges(false);
      toast({ title: t('pi_profile_updated') || '✓ Perfil actualizado', description: t('pi_profile_updated_desc') || 'Tu información se ha guardado correctamente' });
    } catch {
      toast({ title: t('common_error'), description: t('pi_profile_error') || 'No se pudo guardar el perfil', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (<PageTransition><div className="min-h-[100dvh] bg-[hsl(225,45%,3%)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div></PageTransition>);
  }

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[hsl(225,45%,3%)] flex justify-center">
        <div className="relative w-full max-w-2xl min-h-[100dvh] bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-24 shadow-2xl">
          <Header />
          <div className="px-4 pt-4 pb-2 space-y-5">
            <div className="flex items-center gap-3">
              <Link to="/settings" className="p-2 rounded-lg bg-[hsl(210,40%,12%)] border border-cyan-800/20 hover:border-cyan-600/40 transition-all active:scale-95">
                <ArrowLeft className="w-4 h-4 text-cyan-300" />
              </Link>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-semibold">{t('pi_settings')}</p>
                <h1 className="text-lg font-bold text-white">{t('pi_title')}</h1>
              </div>
            </div>

            {/* Profile Hero Card */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-800/25 bg-[hsl(210,40%,8%)]">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
              <div className="relative flex items-center gap-4 p-5">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-sm" />
                  <Avatar className="relative w-20 h-20 border-2 border-cyan-500/30 ring-2 ring-cyan-400/10">
                    <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                    <AvatarFallback className="bg-[hsl(210,40%,14%)] text-cyan-300 text-xl font-bold">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <button onClick={handleAvatarClick} disabled={uploadingAvatar} className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/30 active:scale-90">
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate">{firstName || lastName ? `${firstName} ${lastName}`.trim() : t('pi_no_name')}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 text-slate-500" /><span className="text-xs text-slate-400 truncate">{user?.email}</span></div>
                  {selectedCountry && (<div className="flex items-center gap-1.5 mt-0.5"><span className="text-sm">{selectedCountry.flag}</span><span className="text-xs text-slate-500">{selectedCountry.name}</span></div>)}
                  {memberSince && (<div className="flex items-center gap-1.5 mt-1"><CalendarDays className="w-3 h-3 text-cyan-500/50" /><span className="text-[10px] text-cyan-400/40">{t('pi_member_since')} {memberSince}</span></div>)}
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 pb-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"><Shield className="w-2.5 h-2.5" /> {t('pi_email_verified')}</span>
                {profile?.country && (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/15"><MapPin className="w-2.5 h-2.5" /> {selectedCountry?.name}</span>)}
              </div>
            </div>

            <SectionCard title={t('pi_personal_data')} icon={User}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('pi_name')} value={firstName} onChange={setFirstName} placeholder={t('pi_first_name_ph') || t('pi_name')} />
                <FormField label={t('pi_last_name')} value={lastName} onChange={setLastName} placeholder={t('pi_last_name_ph') || t('pi_last_name')} />
              </div>
              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_dob')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors", "bg-[hsl(210,30%,10%)] border border-cyan-800/20 hover:border-cyan-600/30", dateOfBirth ? "text-white" : "text-slate-600")}>
                      <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                      {dateOfBirth ? format(dateOfBirth, "d MMMM, yyyy", { locale: dateLocale }) : t('pi_select_date')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[hsl(220,40%,10%)] border-cyan-800/30" align="start">
                    <Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} disabled={(date) => date > new Date() || date < new Date("1920-01-01")} initialFocus className={cn("p-3 pointer-events-auto")} captionLayout="dropdown-buttons" fromYear={1940} toYear={new Date().getFullYear() - 13} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_address')}</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('pi_address_ph') || t('pi_address')} className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 pl-9 placeholder:text-slate-600 focus:border-cyan-500/40 hover:border-cyan-700/30 transition-colors" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t('pi_contact_info')} icon={Mail}>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_email')}</Label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(210,30%,10%)] border border-cyan-800/15">
                  <Mail className="w-3.5 h-3.5 text-slate-600" /><span className="text-sm text-slate-500 truncate">{user?.email}</span><Check className="w-3.5 h-3.5 text-emerald-500 ml-auto flex-shrink-0" />
                </div>
                <p className="text-[10px] text-slate-600">{t('pi_email_readonly')}</p>
              </div>
              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 123 4567" type="tel" className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 pl-9 placeholder:text-slate-600 focus:border-cyan-500/40 hover:border-cyan-700/30 transition-colors" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t('pi_subscription_info')} icon={CreditCard}>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_subscription_type')}</Label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(210,30%,10%)] border border-cyan-800/15">
                  <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                  <span className={cn("text-sm font-medium", subscribed ? "text-cyan-300" : "text-slate-500")}>
                    {subLoading ? t('common_loading') : subscribed && tier ? TIER_LABELS[tier] || tier : t('pi_no_subscription')}
                  </span>
                  {subscribed && (<span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{t('pi_active')}</span>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-slate-400">{t('pi_member_since')}</Label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(210,30%,10%)] border border-cyan-800/15">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-600" /><span className="text-xs text-slate-400">{memberSince || '—'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-slate-400">{t('pi_expiry')}</Label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(210,30%,10%)] border border-cyan-800/15">
                    <Clock className="w-3.5 h-3.5 text-slate-600" /><span className="text-xs text-slate-400">{subscriptionEnd ? format(new Date(subscriptionEnd), "dd/MM/yyyy") : '—'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_trading_mode')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TRADING_MODES.map(mode => (
                    <button key={mode.value} onClick={() => setTradingMode(mode.value)} className={cn('rounded-xl border px-2 py-2.5 text-center transition-all', tradingMode === mode.value ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_hsl(187,72%,50%,0.15)]' : 'bg-[hsl(210,30%,10%)] text-slate-400 border-cyan-800/15 hover:border-cyan-700/30')}>
                      <Play className={cn("w-3 h-3 mx-auto mb-1", tradingMode === mode.value ? "text-cyan-400" : "text-slate-600")} />
                      <span className="text-xs font-bold block">{mode.label}</span>
                      <span className="text-[9px] text-slate-500">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t('pi_location_tz')} icon={MapPin}>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_country')}</Label>
                <Select value={country} onValueChange={(v) => setCountry(v)}>
                  <SelectTrigger className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 hover:border-cyan-600/30 transition-colors"><SelectValue placeholder={t('pi_select_country')} /></SelectTrigger>
                  <SelectContent className="bg-[hsl(220,40%,10%)] border-cyan-800/30 max-h-60">
                    {countries.map((c) => (<SelectItem key={c.code} value={c.code} className="text-white hover:bg-cyan-500/10 focus:bg-cyan-500/10"><span className="flex items-center gap-2"><span>{c.flag}</span><span>{c.name}</span></span></SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">{t('pi_timezone')}</Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
                  <SelectTrigger className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 hover:border-cyan-600/30 transition-colors"><SelectValue placeholder={t('pi_select_tz')} /></SelectTrigger>
                  <SelectContent className="bg-[hsl(220,40%,10%)] border-cyan-800/30 max-h-60">
                    {timezones.map((tz) => (<SelectItem key={tz.value} value={tz.value} className="text-white hover:bg-cyan-500/10 focus:bg-cyan-500/10"><span className="flex items-center justify-between gap-3 w-full"><span>{tz.label}</span><span className="text-[10px] text-slate-500 font-mono">{tz.offset}</span></span></SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {timezone && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-800/15">
                  <Clock className="w-3.5 h-3.5 text-cyan-400/60" />
                  <span className="text-xs text-cyan-300/60">{t('pi_local_time')} {new Date().toLocaleTimeString(undefined, { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </SectionCard>

            <button onClick={handleSave} disabled={saving || !hasChanges} className={cn("w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]", hasChanges ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40" : saved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-[hsl(210,30%,12%)] text-slate-600 border border-cyan-800/15 cursor-not-allowed")}>
              {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('pi_saving')}</>) : saved ? (<><Check className="w-4 h-4" />{t('pi_saved')}</>) : (<><Save className="w-4 h-4" />{t('pi_save_changes')}</>)}
            </button>
          </div>
          <BottomNav />
        </div>
      </div>
    </PageTransition>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-800/20 bg-[hsl(210,40%,8%)]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-cyan-400/60" /><span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/50">{title}</span></div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-slate-400">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 placeholder:text-slate-600 focus:border-cyan-500/40 hover:border-cyan-700/30 transition-colors" />
    </div>
  );
}
