import { Link, useLocation } from 'wouter';
import { BookOpen, MessageSquare, Phone, Search, Settings2 } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const tabs = [
    { path: '/', label: 'المحادثة', icon: MessageSquare },
    { path: '/call', label: 'المكالمة', icon: Phone },
    { path: '/learning', label: 'التعلم', icon: BookOpen },
    { path: '/search', label: 'البحث', icon: Search },
    { path: '/control', label: 'التحكم', icon: Settings2 },
  ];
  return <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
    <main className="relative flex-1 overflow-hidden">{children}</main>
    <nav className="z-50 h-[72px] flex-shrink-0 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex h-full max-w-3xl">{tabs.map(tab => {
        const active = location === tab.path || (tab.path !== '/' && location.startsWith(tab.path));
        const Icon = tab.icon;
        return <Link key={tab.path} href={tab.path} className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}><Icon className="h-5 w-5" strokeWidth={active ? 2.7 : 2}/><span className="text-[10px] font-medium">{tab.label}</span></Link>;
      })}</div>
    </nav>
  </div>;
}
