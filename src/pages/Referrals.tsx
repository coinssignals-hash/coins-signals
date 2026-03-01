import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Users, DollarSign, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const referralHistory = [
  { name: 'Juan Pérez', date: '15/12/2024', bonus: '$15', status: 'Completado' },
  { name: 'María García', date: '10/12/2024', bonus: '$25', status: 'Completado' },
  { name: 'Carlos López', date: '05/12/2024', bonus: '$10', status: 'Pendiente' },
];

export default function Referrals() {
  const referralLink = 'https://coins-signals.com/ref/philip-express';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: 'Enlace copiado',
      description: 'El enlace de referido ha sido copiado al portapapeles',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <span className="text-xs text-muted-foreground">ID # 0572564</span>
          <h1 className="text-xl font-bold text-foreground">Recomendar un Amigo</h1>
        </div>

        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 mb-6">
          <CardContent className="p-6 text-center">
            <Gift className="w-16 h-16 mx-auto text-accent mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Gane Hasta <span className="text-accent">$25</span> en
            </h2>
            <p className="text-lg text-primary font-semibold">Invitar a un Amigo</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-primary">Así Funciona:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Comparte Tu Enlace</p>
                <p className="text-xs text-muted-foreground">
                  Ayuda y recomienda a cuantos amigos quieras ver aumentar sus ganancias y las tuyas.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sus amigos se unen a Coins Signals</p>
                <p className="text-xs text-muted-foreground">
                  Al registrarse con tu enlace y elegir cualquier plan de suscripción.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Recibe hasta $25 en efectivo</p>
                <p className="text-xs text-muted-foreground">
                  De inmediato. Recibe tu ganancia directamente a tu cuenta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-primary">Tu Enlace de Referido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="bg-secondary border-border text-xs"
              />
              <Button onClick={copyLink} variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              Enviar Invitación
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary">Historial De Referidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referralHistory.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div>
                  <p className="text-sm font-medium text-foreground">{referral.name}</p>
                  <p className="text-xs text-muted-foreground">{referral.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{referral.bonus}</p>
                  <p className="text-xs text-muted-foreground">{referral.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
