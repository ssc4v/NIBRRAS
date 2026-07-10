import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';

import Layout from './components/layout/Layout';
import ChatPage from './pages/chat';
import LearningPage from './pages/learning';
import SearchPage from './pages/search';
import ControlPage from './pages/control';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <h1 className="text-2xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">الصفحة غير موجودة.</p>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/learning" component={LearningPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/control" component={ControlPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}

export default App;
