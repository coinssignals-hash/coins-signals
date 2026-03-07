import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageTransition } from '@/components/layout/PageTransition';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Camera, Loader2, Save, Check, Mail, MapPin, Clock, User, CalendarDays, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const countries = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
];

const timezones = [
  { value: 'America/New_York', label: 'Nueva York (EST)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Chicago (CST)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Denver (MST)', offset: 'UTC-7' },
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
  { value: 'Europe/Berlin', label: 'Berlín', offset: 'UTC+1' },
  { value: 'Asia/Tokyo', label: 'Tokio', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'Shanghái', offset: 'UTC+8' },
];

export default function PersonalInfo() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setCountry(profile.country || '');
      setTimezone(profile.timezone || 'America/New_York');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    const changed =
      firstName !== (profile.first_name || '') ||
      lastName !== (profile.last_name || '') ||
      country !== (profile.country || '') ||
      timezone !== (profile.timezone || 'America/New_York');
    setHasChanges(changed);
    if (changed) setSaved(false);
  }, [firstName, lastName, country, timezone, profile]);

  const getInitials = () => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const selectedCountry = countries.find(c => c.code === country);
  const memberSince = user?.created_at ? format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es }) : null;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Por favor selecciona una imagen válida', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'La imagen no puede superar los 5MB', variant: 'destructive' });
      return;
    }
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
      toast({ title: '✓ Avatar actualizado', description: 'Tu foto de perfil se ha actualizado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo subir la imagen', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const { error } = await updateProfile({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        country: country || null,
        timezone: timezone || null,
      });
      if (error) throw error;
      setSaved(true);
      setHasChanges(false);
      toast({ title: '✓ Perfil actualizado', description: 'Tu información se ha guardado correctamente' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el perfil', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-[100dvh] bg-[hsl(225,45%,3%)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[hsl(225,45%,3%)] flex justify-center">
        <div className="relative w-full max-w-2xl min-h-[100dvh] bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] pb-24 shadow-2xl">
          <Header />

          <div className="px-4 pt-4 pb-2 space-y-5">
            {/* Back + Title */}
            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                className="p-2 rounded-lg bg-[hsl(210,40%,12%)] border border-cyan-800/20 hover:border-cyan-600/40 transition-all active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-300" />
              </Link>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-semibold">Ajustes</p>
                <h1 className="text-lg font-bold text-white">Información Personal</h1>
              </div>
            </div>

            {/* ═══ Profile Hero Card ═══ */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-800/25 bg-[hsl(210,40%,8%)]">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />

              <div className="relative flex items-center gap-4 p-5">
                {/* Avatar */}
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-sm" />
                  <Avatar className="relative w-20 h-20 border-2 border-cyan-500/30 ring-2 ring-cyan-400/10">
                    <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                    <AvatarFallback className="bg-[hsl(210,40%,14%)] text-cyan-300 text-xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/30 active:scale-90"
                  >
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate">
                    {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Sin nombre'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-400 truncate">{user?.email}</span>
                  </div>
                  {selectedCountry && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm">{selectedCountry.flag}</span>
                      <span className="text-xs text-slate-500">{selectedCountry.name}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <CalendarDays className="w-3 h-3 text-cyan-500/50" />
                      <span className="text-[10px] text-cyan-400/40">Miembro desde {memberSince}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 px-5 pb-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-2.5 h-2.5" /> Email verificado
                </span>
                {profile?.country && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
                    <MapPin className="w-2.5 h-2.5" /> {selectedCountry?.name}
                  </span>
                )}
              </div>
            </div>

            {/* ═══ Personal Data Form ═══ */}
            <SectionCard title="Datos Personales" icon={User}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre" value={firstName} onChange={setFirstName} placeholder="Tu nombre" />
                <FormField label="Apellido" value={lastName} onChange={setLastName} placeholder="Tu apellido" />
              </div>

              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">Correo Electrónico</Label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(210,30%,10%)] border border-cyan-800/15">
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-sm text-slate-500 truncate">{user?.email}</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto flex-shrink-0" />
                </div>
                <p className="text-[10px] text-slate-600">El correo no puede ser modificado</p>
              </div>
            </SectionCard>

            {/* ═══ Location & Timezone ═══ */}
            <SectionCard title="Ubicación y Zona Horaria" icon={MapPin}>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400">País</Label>
                <Select value={country} onValueChange={(v) => setCountry(v)}>
                  <SelectTrigger className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 hover:border-cyan-600/30 transition-colors">
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,40%,10%)] border-cyan-800/30 max-h-60">
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-white hover:bg-cyan-500/10 focus:bg-cyan-500/10">
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 mt-3">
                <Label className="text-[11px] font-medium text-slate-400">Zona Horaria</Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
                  <SelectTrigger className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 hover:border-cyan-600/30 transition-colors">
                    <SelectValue placeholder="Selecciona tu zona horaria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,40%,10%)] border-cyan-800/30 max-h-60">
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value} className="text-white hover:bg-cyan-500/10 focus:bg-cyan-500/10">
                        <span className="flex items-center justify-between gap-3 w-full">
                          <span>{tz.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{tz.offset}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {timezone && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-800/15">
                  <Clock className="w-3.5 h-3.5 text-cyan-400/60" />
                  <span className="text-xs text-cyan-300/60">
                    Hora local: {new Date().toLocaleTimeString('es', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </SectionCard>

            {/* ═══ Save Button ═══ */}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]",
                hasChanges
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                  : saved
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-[hsl(210,30%,12%)] text-slate-600 border border-cyan-800/15 cursor-not-allowed"
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Guardado correctamente
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>

          <BottomNav />
        </div>
      </div>
    </PageTransition>
  );
}

/* ═══ Reusable sub-components ═══ */

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-800/20 bg-[hsl(210,40%,8%)]">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-cyan-400/60" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/50">{title}</span>
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-slate-400">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[hsl(210,30%,10%)] border-cyan-800/20 text-white text-sm h-10 placeholder:text-slate-600 focus:border-cyan-500/40 hover:border-cyan-700/30 transition-colors"
      />
    </div>
  );
}
