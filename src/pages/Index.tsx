import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { DateTabs } from '@/components/news/DateTabs';
import { NewsCard } from '@/components/news/NewsCard';
import { mockNewsList } from '@/data/mockNews';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };
  
  const featuredNews = mockNewsList[0];
  const otherNews = mockNewsList.slice(1);
  
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-4 space-y-6">
        {/* Date Tabs */}
        <DateTabs
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Principales Noticias</h1>
          <span className="text-xs text-muted-foreground">
            Última actualización: hace 5 min
          </span>
        </div>
        
        {/* Featured News */}
        <NewsCard news={featuredNews} variant="featured" />
        
        {/* News Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {otherNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
