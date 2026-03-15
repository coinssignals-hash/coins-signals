import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User, MapPin, Phone, CalendarDays, Home, ChevronRight, ChevronLeft,
  Camera, Loader2, Check, Clock, Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useTranslation } from '@/i18n/LanguageContext';
import { useRef } from 'react';
import logoImg from '@/assets/logo.svg';

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
  { value: 'America/New_York', label: 'New York (EST)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Chicago (CST)', offset: 'UTC-6' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (PST)', offset: 'UTC-8' },
  { value: 'America/Mexico_City', label: 'Ciudad de México', offset: 'UTC-6' },
  { value: 'America/Bogota', label: 'Bogotá', offset: 'UTC-5' },
  { value: 'America/Lima', label: 'Lima', offset: 'UTC-5' },
  { value: 'America/Santiago', label: 'Santiago', offset: 'UTC-4' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+1' },
  { value: 'Europe/London', label: 'Londres', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'París', offset: 'UTC+1' },
];

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-fill from existing profile data
  useEffect(() => {
    if (profile) {
      const raw = profile as any;
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.country) setCountry(profile.country);
      if (profile.timezone) setTimezone(profile.timezone);
      if (raw.phone) setPhone(raw.phone);
      if (raw.address) setAddress(raw.address);
      if (raw.date_of_birth) setDateOfBirth(new Date(raw.date_of_birth));
    }
  }, [profile]);

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    } catch { /* silent */ }
    finally { setUploadingAvatar(false); }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        country: country || null,
        timezone: timezone || null,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        address: address.trim() || null,
        phone: phone.trim() || null,
      };
      if (avatarUrl) updateData.avatar_url = avatarUrl;
      const { error } = await updateProfile(updateData as any);
      if (error) throw error;
      localStorage.setItem('onboarding_completed', 'true');
      toast({ title: '🎉 ¡Perfil completado!', description: 'Bienvenido a Coins Signals' });
      navigate('/');
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el perfil', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  const getInitials = () => {
    const f = firstName?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[hsl(222,45%,5%)] via-[hsl(218,52%,7%)] to-[hsl(222,45%,5%)] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo + Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <img src={logoImg} alt="Coins Signals" className="w-14 h-14 mx-auto rounded-xl shadow-lg mb-3" />
        <h1 className="text-xl font-bold text-foreground">
          {step === 0 ? '¡Bienvenido! 👋' : step === 1 ? 'Información de contacto' : 'Tu ubicación'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 0 ? 'Cuéntanos un poco sobre ti' : step === 1 ? 'Para mantenerte informado' : 'Ajusta tu zona horaria'}
        </p>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i === step ? 'w-8 bg-primary' : i < step ? 'w-5 bg-primary/50' : 'w-5 bg-muted'
            )}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md overflow-hidden">
        <div className="relative rounded-2xl border border-border bg-card p-5 min-h-[340px]">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-sm" />
                      <Avatar className="relative w-20 h-20 border-2 border-primary/30 ring-2 ring-primary/10">
                        <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                        <AvatarFallback className="bg-secondary text-primary text-xl font-bold">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <button
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50 shadow-lg active:scale-90"
                      >
                        {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </div>
                  </div>

                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <OnboardingField icon={User} label={t('pi_name') || 'Nombre'} value={firstName} onChange={setFirstName} placeholder="Juan" />
                    <OnboardingField icon={User} label={t('pi_last_name') || 'Apellido'} value={lastName} onChange={setLastName} placeholder="Pérez" />
                  </div>

                  {/* Date of birth */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" /> {t('pi_dob') || 'Fecha de nacimiento'}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                          "bg-secondary border border-border hover:border-primary/30",
                          dateOfBirth ? "text-foreground" : "text-muted-foreground"
                        )}>
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          {dateOfBirth ? format(dateOfBirth, "d MMMM, yyyy", { locale: dateLocale }) : 'Seleccionar fecha'}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={setDateOfBirth}
                          disabled={(date) => date > new Date() || date < new Date("1920-01-01")}
                          initialFocus
                          className="p-3 pointer-events-auto"
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear() - 13}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                    <Phone className="w-7 h-7 text-primary" />
                  </div>
                  <OnboardingField icon={Phone} label={t('pi_phone') || 'Teléfono'} value={phone} onChange={setPhone} placeholder="+57 300 123 4567" type="tel" />
                  <OnboardingField icon={Home} label={t('pi_address') || 'Dirección'} value={address} onChange={setAddress} placeholder="Calle 123, Ciudad" />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                    <MapPin className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">{t('pi_country') || 'País'}</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="bg-secondary border-border text-foreground text-sm h-10">
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-60">
                        {COUNTRY_CODES.map((code) => (
                          <SelectItem key={code} value={code}>
                            <span className="flex items-center gap-2">
                              <span>{COUNTRY_FLAGS[code]}</span>
                              <span>{t(`country_${code}` as any) || code}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">{t('pi_timezone') || 'Zona horaria'}</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="bg-secondary border-border text-foreground text-sm h-10">
                        <SelectValue placeholder="Zona horaria" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-60">
                        {TIMEZONE_ENTRIES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            <span className="flex items-center justify-between gap-3 w-full">
                              <span>{tz.label}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{tz.offset}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {timezone && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                      <Clock className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-xs text-primary/70">
                        Hora local: {new Date().toLocaleTimeString(undefined, { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 mt-5">
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground bg-secondary border border-border hover:border-primary/30 transition-all active:scale-[0.97]"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          )}

          <div className="flex-1" />

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.97]"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 transition-all active:scale-[0.97] disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Comenzar'}
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 py-2 transition-colors"
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  );
}

function OnboardingField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="bg-secondary border-border text-foreground text-sm h-10 placeholder:text-muted-foreground/50 focus:border-primary/40 transition-colors"
      />
    </div>
  );
}
