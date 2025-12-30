import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { BarChart2 } from 'lucide-react';

export default function Analysis() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <BarChart2 className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Análisis</h1>
          <p className="text-muted-foreground">
            Próximamente...
          </p>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}