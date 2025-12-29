import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, User, FileText, Shield, Bell, Palette, Globe } from 'lucide-react';

const settingsSections = [
  {
    title: 'Perfil',
    items: [
      { icon: User, label: 'Información Personal', href: '/settings/personal', description: 'Nombre, fecha de nacimiento, dirección' },
      { icon: FileText, label: 'Documentos', href: '/settings/documents', description: 'Prueba de identidad y residencia' },
    ]
  },
  {
    title: 'Seguridad',
    items: [
      { icon: Shield, label: 'Seguridad', href: '/settings/security', description: 'Contraseña, autenticación, biométrico' },
    ]
  },
  {
    title: 'Preferencias',
    items: [
      { icon: Bell, label: 'Notificaciones', href: '/settings/notifications', description: 'Alertas, señales, actualizaciones' },
      { icon: Palette, label: 'Aspecto', href: '/settings/appearance', description: 'Tema, tamaño de letra' },
      { icon: Globe, label: 'Idioma y Zona Horaria', href: '/settings/language', description: 'Idioma, zona horaria' },
    ]
  }
];

export default function Settings() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground">ID # 0572564</span>
          <span className="text-xl font-bold text-foreground">Ajustes</span>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-primary mb-3">{section.title}</h2>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {section.items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center justify-between p-4 hover:bg-secondary transition-colors ${
                          index !== section.items.length - 1 ? 'border-b border-border' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
