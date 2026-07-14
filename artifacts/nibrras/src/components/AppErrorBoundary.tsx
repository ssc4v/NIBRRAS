import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('NIBRRAS_UI_CRASH', { error, componentStack: info.componentStack });
  }

  private recover = () => {
    this.setState({ hasError: false, message: '' });
    window.location.assign(import.meta.env.BASE_URL || '/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main dir="rtl" className="flex min-h-[100dvh] items-center justify-center bg-background p-6 text-foreground">
        <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-2xl text-destructive">!</div>
          <h1 className="text-xl font-bold">تعذر عرض هذه الشاشة</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">تم إيقاف الشاشة بأمان بدل ترك التطبيق في حالة معطلة.</p>
          <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">{this.state.message}</p>
          <button type="button" onClick={this.recover} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">
            العودة إلى نبراس
          </button>
        </section>
      </main>
    );
  }
}
