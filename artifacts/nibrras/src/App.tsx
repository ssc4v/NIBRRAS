import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';

import Layout from './components/layout/Layout';
import ChatPage from './pages/chat';
import VoiceCallPage from './pages/voice-call';
import LearningPage from './pages/learning';
import SearchPage from './pages/search';
import ControlPage from './pages/control';
import ProjectStorePage from './pages/project-store';
import SystemPage from './pages/system';

const queryClient = new QueryClient();

function NotFound() {
  return <div className="flex h-full flex-col items-center justify-center p-4 text-center"><h1 className="text-2xl font-bold">404</h1><p className="mt-2 text-sm text-muted-foreground">الصفحة غير موجودة.</p></div>;
}

function Routes() {
  return <Layout><Switch>
    <Route path="/" component={ChatPage} />
    <Route path="/call" component={VoiceCallPage} />
    <Route path="/learning" component={LearningPage} />
    <Route path="/search" component={SearchPage} />
    <Route path="/control" component={ControlPage} />
    <Route path="/projects" component={ProjectStorePage} />
    <Route path="/system" component={SystemPage} />
    <Route component={NotFound} />
  </Switch></Layout>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}>
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Routes /></WouterRouter>
    <Toaster theme="dark" position="top-center" richColors />
  </QueryClientProvider>;
}
