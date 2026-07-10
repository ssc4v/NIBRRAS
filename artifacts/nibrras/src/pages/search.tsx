import { useState } from 'react';
import { runDeepSearchMock, saveToMemoryMock } from '../services/deepSearchService';
import { SearchResult } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Save, FileText, Database, ShieldCheck, Link as LinkIcon } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'سريع' | 'متوسط' | 'عميق'>('متوسط');
  const [sources, setSources] = useState<string[]>(['Official Docs', 'Articles', 'Research Papers']);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  
  const allSources = ['Official Docs', 'GitHub', 'Reddit/Hacker News', 'YouTube', 'Articles', 'Research Papers'];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    const res = await runDeepSearchMock(query, { depth, sources });
    
    setResults(res.results);
    setAnswer(res.answer);
    setCitations(res.citations);
    setLoading(false);
  };

  const toggleSource = (src: string) => {
    if (sources.includes(src)) {
      setSources(sources.filter(s => s !== src));
    } else {
      setSources([...sources, src]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <header className="px-6 py-5 border-b border-border bg-card sticky top-0 z-10">
        <h1 className="font-bold text-2xl tracking-tight mb-4">البحث العميق</h1>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب استفسارك هنا للبحث المعمق..."
              className="pl-10 pr-4 h-12 bg-background border-border rounded-xl text-sm w-full"
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="absolute left-1 top-1.5 h-9 w-9 text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">العمق:</span>
              <div className="flex gap-1.5 p-1 bg-muted rounded-lg inline-flex">
                {['سريع', 'متوسط', 'عميق'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d as any)}
                    className={`text-[10px] px-3 py-1.5 rounded-md font-medium transition-all ${
                      depth === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">المصادر:</span>
              <div className="flex flex-wrap gap-2">
                {allSources.map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => toggleSource(src)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                      sources.includes(src) 
                        ? 'border-foreground bg-foreground text-background' 
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/50'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </header>

      <div className="p-6 space-y-6 pb-24">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-mono">Searching across {sources.length} sources...</span>
          </div>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <>
            {/* Final Answer */}
            <Card className="bg-foreground text-background border-none rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4" /> الخلاصة المجمعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-background/90">
                  {answer}
                </p>
                <div className="flex justify-end pt-2 border-t border-background/20 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => saveToMemoryMock('test-id')}
                    className="h-8 text-xs bg-transparent border-background/30 text-background hover:bg-background hover:text-foreground transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 ml-1.5" />
                    حفظ في الذاكرة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results List */}
            <div className="space-y-4 pt-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" /> المصادر المرجعية
              </h3>
              
              <div className="grid gap-4">
                {results.map(res => {
                  const isCited = citations.includes(res.id);
                  return (
                    <Card key={res.id} className={`bg-card transition-all ${isCited ? 'border-foreground/40 shadow-sm' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono rounded-sm">
                            {res.sourceType}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            {res.trustScore}%
                          </div>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 leading-snug">{res.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {res.summary}
                        </p>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          <span className="truncate">{res.url}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            لم يتم العثور على نتائج. جرب تغيير مصادر البحث أو الكلمات المفتاحية.
          </div>
        )}
      </div>
    </div>
  );
}
