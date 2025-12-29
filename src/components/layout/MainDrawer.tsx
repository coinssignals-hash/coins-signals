import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import {
  User as UserIcon,
  FileText,
  Gift,
  Link2,
  Shield,
  BookOpen,
  TrendingUp,
  BarChart3,
  MessageCircle,
  Info,
  LogOut,
  LogIn,
  Bell,
  Palette,
  Globe,
  Cloud,
  Download
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface MainDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { icon: UserIcon, label: 'Ajuste De Perfil', href: '/settings' },
  { icon: FileText, label: 'Suscripciones', href: '/subscriptions' },
  { icon: Gift, label: 'Bonos Por Referidos', href: '/referrals' },
  { icon: Link2, label: 'Vincular Broker', href: '/broker' },
  { icon: Shield, label: 'Seguridad', href: '/settings/security' },
  { icon: BookOpen, label: 'Cursos y Tutoriales', href: '/courses' },
  { icon: TrendingUp, label: 'Rendimientos Y Ganancias', href: '/performance' },
  { icon: BarChart3, label: 'Puntuación De Broker', href: '/broker-rating' },
  { icon: MessageCircle, label: 'Contacto y Soporte', href: '/support' },
  { icon: Info, label: 'Sobre Nosotros', href: '/about' },
];

const settingsItems = [
  { icon: Bell, label: 'Notificaciones', href: '/settings/notifications' },
  { icon: Palette, label: 'Aspecto', href: '/settings/appearance' },
  { icon: Globe, label: 'Idioma y Zona Horaria', href: '/settings/language' },
  { icon: Download, label: 'Instalar App', href: '/install' },
];

export function MainDrawer({ open, onOpenChange }: MainDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente',
    });
    onOpenChange(false);
    navigate('/');
  };

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 bg-background border-border">
        <SheetHeader className="p-6 pb-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src="/placeholder.svg" alt="Usuario" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <h2 className="text-lg font-bold text-foreground">Bienvenido</h2>
                  <p className="text-sm font-medium text-primary truncate max-w-[150px]">
                    {user.email}
                  </p>
                  <Badge variant="outline" className="mt-1 border-primary text-primary flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    Sincronizado
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">Bienvenido</h2>
                <p className="text-sm text-muted-foreground">Inicia sesión para sincronizar</p>
              </div>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate('/auth');
                }}
                className="w-full bg-primary"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </div>
          )}
        </SheetHeader>

        <Separator className="bg-border" />

        <nav className="flex flex-col p-4 gap-1 max-h-[calc(100vh-260px)] overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-foreground hover:bg-secondary'
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          <Separator className="my-3 bg-border" />

          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Preferencias
          </p>

          {settingsItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          {user ? (
            <button
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          ) : (
            <button
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              onClick={() => {
                onOpenChange(false);
                navigate('/auth');
              }}
            >
              <LogIn className="w-5 h-5" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
