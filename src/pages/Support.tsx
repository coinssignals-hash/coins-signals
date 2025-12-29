import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Upload, MapPin, Phone } from 'lucide-react';

const helpTopics = [
  'Departamento de verificación',
  'Correo o ID',
  'Problemas con pagos',
  'Señales de trading',
  'Cuenta y suscripción',
];

export default function Support() {
  const [selectedTopic, setSelectedTopic] = useState('');

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <div className="mb-6">
          <span className="text-xs text-muted-foreground">ID # 0572564</span>
          <h1 className="text-xl font-bold text-foreground">Contacto y Soporte</h1>
        </div>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-primary">
              Bienvenido, ¿Cómo te Podemos Ayudar?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Encuentra la mejor manera para resolver tus dudas.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <MessageCircle className="w-6 h-6 text-primary" />
                <span className="text-xs">Chat En Vivo</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Send className="w-6 h-6 text-primary" />
                <span className="text-xs">Whatsapp</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-primary">Envíanos una Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envíanos un mensaje con todas tus dudas y te responderemos en el menor tiempo posible.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Buscar Ayuda</label>
                <Input 
                  placeholder="Escribe tu consulta..." 
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Asunto</label>
                <div className="flex flex-wrap gap-2">
                  {helpTopics.map((topic) => (
                    <Button
                      key={topic}
                      variant={selectedTopic === topic ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTopic(topic)}
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Mensaje</label>
                <Textarea 
                  placeholder="Describe tu problema o consulta..." 
                  className="bg-secondary border-border min-h-[100px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Archivos Adjuntos (opcional)</label>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Archivo
                </Button>
              </div>

              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-primary">Ubicación y Teléfonos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Oficinas Internacionales</p>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Malta</p>
                  <p className="text-xs text-muted-foreground">Marija Immakulata, Gzira 1326</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Netherlands</p>
                  <p className="text-xs text-muted-foreground">Boomgaardstraat 12, Fijnaart 2544</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
