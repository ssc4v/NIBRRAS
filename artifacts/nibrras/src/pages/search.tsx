import { useState } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle, ArrowRight, Search } from 'lucide-react';
import { deepSearch, type DeepSearchResult } from '../services/deepSearchService';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DeepSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await deepSearch(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل البحث العميق.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-background p-4">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">البحث العميق</h1>
          <p className="text-sm text-muted-foreground">بحث فعلي عبر NIRBAS Deep Search في n8n</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
          <ArrowRight className="ml-1 h-4 w-4" /> المحادثة
        </Button>
      </header>

      <form onSubmit={submit} className="mb-4 flex gap-2 rounded-xl border border-border bg-card p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ما الموضوع الذي تريد بحثه؟"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          disabled={loading}
        />
        <Button type="submit" disabled={!query.trim() || loading}>
          <Search className="ml-2 h-4 w-4" />
          {loading ? 'جاري البحث…' : 'ابحث'}
        </Button>
      </form>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <article className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <h2 className="font-semibold">{result.query}</h2>
            <span className="text-xs text-muted-foreground">Execution: {result.executionId}</span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7">{result.result}</div>
        </article>
      )}

      {!result && !error && !loading && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          لن تظهر نتيجة نجاح إلا بعد اكتمال بحث حقيقي وإرجاع معرّف تنفيذ من n8n.
        </div>
      )}
    </div>
  );
}
