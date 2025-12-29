import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PersonalInfo() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <span className="text-xs text-muted-foreground">ID # 0572564</span>
            <h1 className="text-xl font-bold text-foreground">Detalles personales</h1>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Nombre Completo</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">Philip J. Fry</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fecha de Nacimiento</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">31-12-1999</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Dirección</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">West 57th Street</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">País</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">New, New York</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">Información de Contactos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Correo Electrónico</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">Planet-express@look.com</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Número de Teléfono</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">+57 320 57845865</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">Información de Suscripción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tipo de Suscripción</label>
                <div className="p-3 rounded-lg bg-secondary text-accent font-semibold">Premium Oro</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fecha de Inicio</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">21- Marzo - 2024</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Modo de Operación</label>
                <div className="p-3 rounded-lg bg-secondary text-foreground">Operación con Broker</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
