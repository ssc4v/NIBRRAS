import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';

import AppErrorBoundary from './components/AppErrorBoundary';
import Layout from './components/layout/Layout';
import ChatPage from './pages/chat';
import VoiceCallPage from './pages/voice-call';
import LearningPage from './pages/learning';
import SearchPage from './pages/search';
import ControlPage from './pages/control';
import ProjectStorePage from './pages/project-store';
import SystemPage from './pages/system';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message : '';
        if (/401|403|404|غير منشورة|غير صحيح/.test(message)) return false;
        return failureCount < 2;
      },
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
});

function NotFound() {
  return (
    <div dir="rtl" className="flex h-full flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">الصفحة غير موجودة.</p>
      <a href={import.meta.env.BASE_URL || '/'} className="mt-5 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">العودة للرئيسية</a>
    </div>
  );
}

function Routes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/call" component={VoiceCallPage} />
        <Route path="/learning" component={LearningPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/control" component={ControlPage} />
        <Route path="/projects" component={ProjectStorePage} />
        <Route path="/system" component={SystemPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={base}><Routes /></WouterRouter>
        <Toaster theme="system" position="top-center" richColors closeButton />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
