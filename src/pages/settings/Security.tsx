import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Lock, Mail, Fingerprint } from 'lucide-react';

export default function Security() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

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
            <h1 className="text-xl font-bold text-foreground">Seguridad</h1>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Cambiar Contraseña de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Aconsejamos cambiar con frecuencia tu contraseña. Utiliza Mayúsculas, 
                Minúsculas, Números y símbolos para tener una contraseña más segura.
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Contraseña Actual del Perfil</label>
                  <Input type="password" placeholder="••••••••" className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Nueva Contraseña del Perfil</label>
                  <Input type="password" placeholder="••••••••" className="bg-secondary border-border" />
                </div>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Enviar Documento
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Autenticación Correo Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Proteja su cuenta con la autenticación multifactor (MFA). Deberá introducir 
                su contraseña y un código que será enviado a su correo.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Aplicación de Autenticación</span>
                <Switch 
                  checked={mfaEnabled} 
                  onCheckedChange={setMfaEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                Inicio de Sesión Biométrico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Accede a tu cuenta al instante y de manera segura, usando Biometría.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Inicio de Sesión Biométrico</span>
                <Switch 
                  checked={biometricEnabled} 
                  onCheckedChange={setBiometricEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
