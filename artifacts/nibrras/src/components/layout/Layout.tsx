import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpen, MessageSquare, Phone, Search, Settings2, WifiOff } from 'lucide-react';

const tabs = [
  { path: '/', label: 'المحادثة', icon: MessageSquare },
  { path: '/call', label: 'المكالمة', icon: Phone },
  { path: '/learning', label: 'التعلم', icon: BookOpen },
  { path: '/search', label: 'البحث', icon: Search },
  { path: '/control', label: 'التحكم', icon: Settings2 },
] as const;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const enable = () => setOnline(true);
    const disable = () => setOnline(false);
    window.addEventListener('online', enable);
    window.addEventListener('offline', disable);
    return () => {
      window.removeEventListener('online', enable);
      window.removeEventListener('offline', disable);
    };
  }, []);

  return (
    <div dir="rtl" className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      {!online && (
        <div role="status" className="flex min-h-9 items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-xs font-semibold text-black">
          <WifiOff className="h-4 w-4" />
          لا يوجد اتصال بالإنترنت؛ بعض المزايا ستتوقف مؤقتًا.
        </div>
      )}

      <main id="main-content" className="relative min-h-0 flex-1 overflow-hidden">{children}</main>

      <nav aria-label="التنقل الرئيسي" className="z-50 flex-shrink-0 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-3xl">
          {tabs.map(tab => {
            const active = location === tab.path || (tab.path !== '/' && location.startsWith(tab.path));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                href={tab.path}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.7 : 2} />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
