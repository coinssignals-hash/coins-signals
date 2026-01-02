import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Construction } from 'lucide-react';

const News = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Construction className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Noticias</h1>
          <p className="text-muted-foreground max-w-md">
            Esta sección está en construcción. Pronto tendrás acceso a las últimas noticias del mercado.
          </p>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default News;
