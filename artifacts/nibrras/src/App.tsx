import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';

import AppErrorBoundary from './components/AppErrorBoundary';
import Layout from './components/layout/Layout';

const ChatPage = lazy(() => import('./pages/chat'));
const VoiceCallPage = lazy(() => import('./pages/voice-call'));
const LearningPage = lazy(() => import('./pages/learning'));
const SearchPage = lazy(() => import('./pages/search'));
const ControlPage = lazy(() => import('./pages/control'));
const ProjectStorePage = lazy(() => import('./pages/project-store'));
const SystemPage = lazy(() => import('./pages/system'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message : '';
        if (/401|403|404|غير منشورة|غير صحيح/.test(message)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: { retry: 0, networkMode: 'online' },
  },
});

function PageLoader() {
  return (
    <div dir="rtl" role="status" aria-live="polite" className="flex h-full min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">
      جاري تحميل الصفحة…
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
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
