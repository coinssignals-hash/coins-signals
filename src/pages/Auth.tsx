import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound, Gift } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from '@/i18n/LanguageContext';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify-pending';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const emailSchema = z.object({
    email: z.string().trim().email({ message: t('auth_invalid_email') }).max(255),
  });
  const authSchema = emailSchema.extend({
    password: z.string().min(6, { message: t('auth_password_min') }).max(100),
  });

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      localStorage.setItem('referral_code', ref.toUpperCase());
      setMode('register');
    } else {
      const stored = localStorage.getItem('referral_code');
      if (stored) setReferralCode(stored);
    }
  }, [searchParams]);

  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') setMode('reset');
  }, [location]);

  const validateEmail = () => {
    try { emailSchema.parse({ email }); setErrors({}); return true; }
    catch (error) { if (error instanceof z.ZodError) setErrors({ email: error.errors[0]?.message }); return false; }
  };

  const validateForm = () => {
    try { authSchema.parse({ email, password }); setErrors({}); return true; }
    catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const validateResetPassword = () => {
    if (password.length < 6) { setErrors({ password: t('auth_password_min') }); return false; }
    if (password !== confirmPassword) { setErrors({ confirmPassword: t('auth_passwords_mismatch') }); return false; }
    setErrors({}); return true;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/onboarding` } });
      if (error) toast({ title: t('common_error'), description: error.message, variant: 'destructive' });
    } catch {
      toast({ title: t('common_error'), description: t('auth_error_google'), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth#type=recovery` });
      if (error) { toast({ title: t('common_error'), description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('auth_email_sent'), description: t('auth_email_sent_desc') });
      setMode('login');
    } catch { toast({ title: t('common_error'), description: t('auth_error_unexpected'), variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetPassword()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast({ title: t('common_error'), description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('auth_password_updated'), description: t('auth_password_updated_desc') });
      navigate('/');
    } catch { toast({ title: t('common_error'), description: t('auth_error_unexpected'), variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const checkProfileAndRedirect = async (userId: string, isNewUser = false) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('first_name, country').eq('id', userId).maybeSingle();
      const isComplete = profile?.first_name && profile?.country;
      const onboardingDone = localStorage.getItem('onboarding_completed') === 'true';
      if (!isComplete && !onboardingDone) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch {
      navigate(isNewUser ? '/onboarding' : '/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({ title: t('auth_error_credentials'), description: t('auth_error_credentials_desc'), variant: 'destructive' });
          } else { toast({ title: t('common_error'), description: error.message, variant: 'destructive' }); }
          return;
        }
        toast({ title: t('auth_welcome'), description: t('auth_welcome_desc') });
        if (data.user) await checkProfileAndRedirect(data.user.id);
        else navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({ title: t('auth_user_exists'), description: t('auth_user_exists_desc'), variant: 'destructive' });
          } else { toast({ title: t('common_error'), description: error.message, variant: 'destructive' }); }
          return;
        }
        if (data.user && !data.session) {
          if (referralCode && data.user.id) {
            try { await supabase.functions.invoke('referrals', { body: { action: 'register', referral_code: referralCode, referred_user_id: data.user.id } }); localStorage.removeItem('referral_code'); } catch (refErr) { console.error('Referral registration error:', refErr); }
          }
          setMode('verify-pending');
          toast({ title: t('auth_check_email'), description: t('auth_check_email_desc') });
        } else {
          if (referralCode && data.user?.id) {
            try { await supabase.functions.invoke('referrals', { body: { action: 'register', referral_code: referralCode, referred_user_id: data.user.id } }); localStorage.removeItem('referral_code'); } catch (refErr) { console.error('Referral registration error:', refErr); }
          }
          toast({ title: t('auth_account_created'), description: t('auth_account_created_desc') });
          if (data.user) await checkProfileAndRedirect(data.user.id, true);
          else navigate('/onboarding');
        }
      }
    } catch { toast({ title: t('common_error'), description: t('auth_error_unexpected'), variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth` } });
      if (error) { toast({ title: t('common_error'), description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('auth_email_resent'), description: t('auth_email_resent_desc') });
    } catch { toast({ title: t('common_error'), description: t('auth_error_unexpected'), variant: 'destructive' }); }
    finally { setResendLoading(false); }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return t('auth_login');
      case 'register': return t('auth_register');
      case 'forgot': return t('auth_forgot');
      case 'reset': return t('auth_reset');
      case 'verify-pending': return t('auth_verify');
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return t('auth_login_desc');
      case 'register': return t('auth_register_desc');
      case 'forgot': return t('auth_forgot_desc');
      case 'reset': return t('auth_reset_desc');
      case 'verify-pending': return `${t('auth_check_email_desc')} — ${email}`;
    }
  };

  const getIcon = () => {
    if (mode === 'forgot' || mode === 'reset') return <KeyRound className="w-8 h-8 text-primary" />;
    if (mode === 'verify-pending') return <Mail className="w-8 h-8 text-accent" />;
    return <Mail className="w-8 h-8 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-[hsl(225,45%,3%)] flex justify-center">
    <div className="relative w-full max-w-2xl min-h-screen bg-gradient-to-b from-[hsl(222,45%,7%)] via-[hsl(218,52%,8%)] to-[hsl(222,45%,7%)] shadow-2xl flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-primary">Coins</span>
            <span className="text-xl font-bold text-accent">$ignals</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <GlowCard className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">{getIcon()}</div>
            </div>
            <CardTitle className="text-2xl">{getTitle()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{getDescription()}</p>
            {referralCode && mode === 'register' && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-xs text-accent font-medium">
                <Gift className="w-3.5 h-3.5" />
                {t('auth_referred_by')} {referralCode}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {mode === 'verify-pending' ? (
              <div className="space-y-6 text-center">
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-foreground">{t('auth_verify_click')}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t('auth_no_email')}</p>
                  <Button type="button" variant="outline" className="w-full border-border" onClick={handleResendVerification} disabled={resendLoading}>
                    {resendLoading ? t('auth_resend_loading') : t('auth_resend')}
                  </Button>
                </div>
                <Separator className="bg-border" />
                <button type="button" onClick={() => setMode('login')} className="text-sm text-primary hover:underline">{t('auth_back_login')}</button>
              </div>
            ) : mode === 'forgot' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth_email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" disabled={loading} />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? t('auth_sending') : t('auth_send_recovery')}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setMode('login')} className="text-sm text-primary hover:underline flex items-center justify-center gap-1 w-full">
                    <ArrowLeft className="w-4 h-4" /> {t('auth_back_login')}
                  </button>
                </div>
              </form>
            ) : mode === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth_new_password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-secondary border-border" disabled={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth_confirm_password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 bg-secondary border-border" disabled={loading} />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? t('auth_updating') : t('auth_update_password')}
                </Button>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth_email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" disabled={loading} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth_password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-secondary border-border" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  {mode === 'login' && (
                    <div className="text-right">
                      <button type="button" onClick={() => setMode('forgot')} className="text-sm text-muted-foreground hover:text-primary">{t('auth_forgot_link')}</button>
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                    {loading ? t('auth_loading') : mode === 'login' ? t('auth_login_btn') : t('auth_register_btn')}
                  </Button>
                </form>
                <div className="relative my-6">
                  <Separator className="bg-border" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t('auth_or_continue')}</span>
                </div>
                <Button type="button" variant="outline" className="w-full border-border bg-secondary hover:bg-secondary/80" onClick={handleGoogleSignIn} disabled={loading}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('auth_continue_google')}
                </Button>
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-primary hover:underline">
                    {mode === 'login' ? t('auth_no_account') : t('auth_has_account')}
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t('auth_continue_without')}</Link>
                </div>
              </>
            )}
          </CardContent>
        </GlowCard>
      </div>
    </div>
    </div>
  );
}