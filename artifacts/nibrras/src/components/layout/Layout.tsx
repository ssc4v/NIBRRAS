import { Link, useLocation } from 'wouter';
import { MessageSquare, BookOpen, Search, Settings2 } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const tabs = [
    { path: '/', label: 'المحادثة', icon: MessageSquare },
    { path: '/learning', label: 'التعلم', icon: BookOpen },
    { path: '/search', label: 'البحث', icon: Search },
    { path: '/control', label: 'التحكم', icon: Settings2 },
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      <nav className="h-16 border-t border-border bg-card flex-shrink-0 z-50">
        <div className="flex h-full max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = location === tab.path || (location.startsWith(tab.path) && tab.path !== '/');
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.path} 
                href={tab.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
