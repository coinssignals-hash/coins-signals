import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Link2, Search, Shield, Eye, Send, CheckCircle } from 'lucide-react';

const popularBrokers = [
  { name: 'IG Group', deposit: '10$ Dolares', commission: '0.0 $', rating: 4.8 },
  { name: 'OANDA', deposit: '1$ Dolar', commission: '0.1 $', rating: 4.7 },
  { name: 'XM', deposit: '5$ Dolares', commission: '0.0 $', rating: 4.6 },
  { name: 'Pepperstone', deposit: '200$ Dolares', commission: '0.0 $', rating: 4.5 },
  { name: 'eToro', deposit: '50$ Dolares', commission: '0.0 $', rating: 4.4 },
];

export default function Broker() {
  const [connectionMethod, setConnectionMethod] = useState('api');
  const [permissions, setPermissions] = useState({
    readBalance: true,
    sendOrders: false,
    viewOperations: true,
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <div className="mb-6">
          <span className="text-xs text-muted-foreground">ID # 0572564</span>
          <h1 className="text-xl font-bold text-foreground">Vincular Broker</h1>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 mb-6">
          <CardContent className="p-6 text-center">
            <Link2 className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-lg font-bold text-foreground mb-2">
              Maneja hasta 5 cuentas Brokers a la vez
            </h2>
            <p className="text-sm text-muted-foreground">
              Invierte de manera segura, Rápido y con mejores resultados.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="connect" className="mb-6">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="connect" className="flex-1">Conectar</TabsTrigger>
            <TabsTrigger value="brokers" className="flex-1">Buscar Broker</TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4 mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm text-primary">Seleccionar Broker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar tu Broker" 
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Conecta tu cuenta, Opera de la mano de los Profesionales.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm text-primary">Método de Conexión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    variant={connectionMethod === 'api' ? 'default' : 'outline'}
                    onClick={() => setConnectionMethod('api')}
                    className="flex-1"
                  >
                    API Key
                  </Button>
                  <Button 
                    variant={connectionMethod === 'oauth' ? 'default' : 'outline'}
                    onClick={() => setConnectionMethod('oauth')}
                    className="flex-1"
                  >
                    OAuth
                  </Button>
                </div>

                {connectionMethod === 'api' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">ID o Correo</label>
                      <Input placeholder="Introduce tu correo o número ID" className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">API Key</label>
                      <Input placeholder="Introduce tu API Key" className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Secreto API Key</label>
                      <Input type="password" placeholder="Introduce tu Secreto API Key" className="bg-secondary border-border" />
                    </div>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Shield className="w-4 h-4 mr-2" />
                      Probar Conexión
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm text-primary">Permisos y Alcances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Leer Balance</span>
                  </div>
                  <Switch 
                    checked={permissions.readBalance}
                    onCheckedChange={(v) => setPermissions({...permissions, readBalance: v})}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Enviar Órdenes (Solo con Confirmación)</span>
                  </div>
                  <Switch 
                    checked={permissions.sendOrders}
                    onCheckedChange={(v) => setPermissions({...permissions, sendOrders: v})}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Ver Operaciones Abiertas</span>
                  </div>
                  <Switch 
                    checked={permissions.viewOperations}
                    onCheckedChange={(v) => setPermissions({...permissions, viewOperations: v})}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brokers" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm text-primary">
                  Los 5 Brokers Más Populares Para Principiantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 text-muted-foreground font-medium">Broker</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Depósito</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Comisión</th>
                        <th className="text-right py-3 text-muted-foreground font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularBrokers.map((broker, index) => (
                        <tr key={index} className="border-b border-border last:border-0">
                          <td className="py-3 font-medium text-foreground">{broker.name}</td>
                          <td className="py-3 text-muted-foreground">{broker.deposit}</td>
                          <td className="py-3 text-primary">{broker.commission}</td>
                          <td className="py-3 text-right text-accent">{broker.rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
