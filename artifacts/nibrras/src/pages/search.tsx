import { useState } from 'react';
import { AlertCircle, Loader2, Save, Search } from 'lucide-react';
import { runDeepSearch, saveToMemory } from '../services/deepSearchService';
import type { SearchResult } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [searchId, setSearchId] = useState('');

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value || loading) return;

    setLoading(true);
    setError('');
    setAnswer('');
    setResults([]);
    setCitations([]);
    setSearchId('');

    try {
      const response = await runDeepSearch(value, {
        depth: 'متوسط',
        sources: ['Official Docs', 'Articles', 'Research Papers'],
      });
      setAnswer(response.answer);
      setResults(response.results);
      setCitations(response.citations);
      setSearchId(response.searchId || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل البحث العميق.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!searchId || saving) {
      setError('لا توجد نتيجة بحث حقيقية قابلة للحفظ.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveToMemory(searchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ نتيجة البحث.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-6 py-5">
        <h1 className="mb-4 text-2xl font-bold">البحث العميق</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="اكتب استفسارك هنا…" disabled={loading} />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
      </header>

      <main className="space-y-5 p-6 pb-24">
        {loading && <p className="text-sm text-muted-foreground">جارٍ انتظار نتيجة حقيقية من n8n…</p>}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {answer && (
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-bold">الخلاصة المجمعة</h2>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || !searchId}>
                {saving ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Save className="ml-1 h-4 w-4" />}
                حفظ
              </Button>
            </div>
            <p className="text-sm leading-7">{answer}</p>
          </section>
        )}

        {results.map((result) => (
          <article key={result.id} className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">{result.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{result.summary}</p>
            <p className="mt-2 truncate text-xs text-muted-foreground">{result.url}</p>
          </article>
        ))}

        {citations.length > 0 && (
          <section className="rounded-xl border border-border p-4">
            <h3 className="mb-2 font-semibold">المراجع</h3>
            {citations.map((citation) => <p key={citation} className="text-xs text-muted-foreground">{citation}</p>)}
          </section>
        )}
      </main>
    </div>
  );
}
