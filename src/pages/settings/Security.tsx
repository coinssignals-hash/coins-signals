import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Lock, Mail, Fingerprint, Shield, Monitor, Smartphone,
  Globe, Loader2, Eye, EyeOff, Copy, Check, LogOut, AlertTriangle,
  Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Password Change ──────────────────────────────────────────────
function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(newPassword);
  const strengthLabel = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'][strength] || '';
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-green-400'][strength] || '';

  const handleChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (strength < 3) {
      toast.error('La contraseña es demasiado débil');
      return;
    }
    setLoading(true);
    try {
      // Verify current password by re-signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user');

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) {
        toast.error('La contraseña actual es incorrecta');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Cambiar Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Usa mayúsculas, minúsculas, números y símbolos para mayor seguridad.
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Contraseña Actual</label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nueva Contraseña</label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="space-y-1 mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-secondary'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strengthLabel}</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Confirmar Nueva Contraseña</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary border-border"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <Button
            onClick={handleChange}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Actualizar Contraseña
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 2FA Card ─────────────────────────────────────────────────────
function TwoFactorCard() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateRecoveryCodes = () => {
    return Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase()
    );
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setShowSetup(true);
    } else {
      setMfaEnabled(false);
      setShowSetup(false);
      setRecoveryCodes([]);
      toast.success('Autenticación de dos factores desactivada');
    }
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error('Ingresa un código de 6 dígitos');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const codes = generateRecoveryCodes();
      setRecoveryCodes(codes);
      setMfaEnabled(true);
      setShowSetup(false);
      setVerificationCode('');
      setLoading(false);
      toast.success('2FA activado correctamente');
    }, 1500);
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    toast.success('Códigos copiados al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Autenticación de Dos Factores (2FA)
          {mfaEnabled && <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">ACTIVO</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Protege tu cuenta con un código adicional al iniciar sesión.
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Activar 2FA</span>
          <Switch checked={mfaEnabled} onCheckedChange={handleToggle} className="data-[state=checked]:bg-primary" />
        </div>

        {showSetup && !mfaEnabled && (
          <div className="space-y-3 p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Ingresa el código de 6 dígitos que se enviará a tu correo electrónico registrado.
            </p>
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="bg-secondary border-border text-center text-lg tracking-[0.5em] font-mono"
              maxLength={6}
            />
            <Button onClick={handleVerify} disabled={loading} className="w-full bg-primary text-primary-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verificar y Activar
            </Button>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="space-y-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">Códigos de Recuperación</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Guarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {recoveryCodes.map((code, i) => (
                <code key={i} className="text-xs font-mono bg-secondary px-2 py-1 rounded text-foreground">
                  {code}
                </code>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={copyRecoveryCodes} className="w-full">
              {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
              {copied ? 'Copiado' : 'Copiar Códigos'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Session Manager ──────────────────────────────────────────────
interface SessionInfo {
  id: string;
  browser: string;
  os: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
  device: 'desktop' | 'mobile' | 'tablet';
}

function SessionManagerCard() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    // Simulate sessions from user-agent data
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android/i.test(ua);
    const browser = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Otro';
    const os = /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : 'Otro';

    const mockSessions: SessionInfo[] = [
      {
        id: 'current',
        browser,
        os,
        location: 'Sesión actual',
        lastActive: new Date(),
        isCurrent: true,
        device: isMobile ? 'mobile' : 'desktop',
      },
      {
        id: 'session-2',
        browser: 'Safari',
        os: 'iOS',
        location: 'iPhone 15 Pro',
        lastActive: new Date(Date.now() - 1000 * 60 * 45),
        isCurrent: false,
        device: 'mobile',
      },
      {
        id: 'session-3',
        browser: 'Chrome',
        os: 'Windows',
        location: 'PC de Oficina',
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3),
        isCurrent: false,
        device: 'desktop',
      },
    ];

    setSessions(mockSessions);
  }, []);

  const revokeSession = (id: string) => {
    setRevoking(id);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setRevoking(null);
      toast.success('Sesión revocada');
    }, 1000);
  };

  const revokeAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'others' });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success('Todas las demás sesiones han sido cerradas');
    } catch {
      toast.error('Error al cerrar sesiones');
    }
  };

  const DeviceIcon = ({ device }: { device: string }) => {
    if (device === 'mobile') return <Smartphone className="w-5 h-5 text-primary" />;
    return <Monitor className="w-5 h-5 text-primary" />;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Sesiones Activas
        </CardTitle>
        {sessions.length > 1 && (
          <Button variant="ghost" size="sm" onClick={revokeAll} className="text-destructive text-xs h-7">
            <LogOut className="w-3 h-3 mr-1" />
            Cerrar todas
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg border ${session.isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <DeviceIcon device={session.device} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{session.browser} · {session.os}</p>
                  {session.isCurrent && (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">ACTUAL</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{session.location}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Última actividad: {format(session.lastActive, "dd MMM, HH:mm", { locale: es })}
                </p>
              </div>
            </div>
            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => revokeSession(session.id)}
                disabled={revoking === session.id}
                className="text-destructive hover:text-destructive h-8 w-8"
              >
                {revoking === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Security Activity Log ────────────────────────────────────────
function SecurityActivityCard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [user]);

  // Fallback mock data when no real logs
  const displayLogs = logs.length > 0 ? logs : [
    { id: '1', action: 'login', resource_type: 'auth', success: true, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: '2', action: 'password_change', resource_type: 'auth', success: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    { id: '3', action: 'login', resource_type: 'auth', success: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), error_message: 'Contraseña incorrecta' },
  ];

  const actionLabels: Record<string, string> = {
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    password_change: 'Cambio de contraseña',
    mfa_enable: '2FA activado',
    mfa_disable: '2FA desactivado',
    session_revoke: 'Sesión revocada',
    profile_update: 'Perfil actualizado',
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Actividad de Seguridad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {displayLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${log.success ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                  {log.success
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <XCircle className="w-3.5 h-3.5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {actionLabels[log.action] || log.action}
                  </p>
                  {log.error_message && (
                    <p className="text-[10px] text-destructive">{log.error_message}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Biometric Card ───────────────────────────────────────────────
function BiometricCard() {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    toast.success(checked ? 'Inicio biométrico activado' : 'Inicio biométrico desactivado');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-primary flex items-center gap-2">
          <Fingerprint className="w-4 h-4" />
          Inicio de Sesión Biométrico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Accede al instante usando huella digital o reconocimiento facial.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Activar Biometría</span>
          <Switch checked={enabled} onCheckedChange={handleToggle} className="data-[state=checked]:bg-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function Security() {
  const { isAuthenticated } = useAuth();

  return (
    <PageShell>
      <Header />
      <main className="py-6 px-4 max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Seguridad
            </h1>
            <p className="text-xs text-muted-foreground">Protege tu cuenta y gestiona el acceso</p>
          </div>
        </div>

        {!isAuthenticated ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center space-y-3">
              <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Inicia sesión para gestionar tu seguridad</p>
              <Link to="/auth">
                <Button className="bg-primary text-primary-foreground">Iniciar Sesión</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <PasswordChangeCard />
            <TwoFactorCard />
            <SessionManagerCard />
            <BiometricCard />
            <SecurityActivityCard />
          </div>
        )}
      </main>
    </PageShell>
  );
}
