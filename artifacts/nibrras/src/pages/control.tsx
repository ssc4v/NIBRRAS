import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Activity, AlertCircle, ArrowRight, Play, RefreshCw } from 'lucide-react';
import {
  getAuditEvents,
  getModels,
  getSystems,
  runNibrrasService,
  type AuditEvent,
  type ModelOption,
  type SystemStatus,
} from '../services/n8nService';
import { Button } from '@/components/ui/button';

export default function ControlPage() {
  const [, setLocation] = useLocation();
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [systemData, modelData, auditData] = await Promise.all([
        getSystems(),
        getModels(),
        getAuditEvents(20),
      ]);
      setSystems(systemData.systems);
      setModels(modelData.available);
      setEvents(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل مركز التحكم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const testSystem = async (system: SystemStatus) => {
    if (running) return;
    setRunning(system.id);
    setError('');
    setNotice('');
    try {
      const input = system.id === 'control' ? { action: 'models' }
        : system.id === 'learning' ? { action: 'getGraph' }
        : system.id === 'questionBank' ? { action: 'list' }
        : system.id === 'errorAudit' ? { action: 'stats' }
        : null;

      if (!input) {
        throw new Error('اختبار هذه الخدمة يحتاج مدخلًا صريحًا من صفحتها المتخصصة.');
      }

      await runNibrrasService(system.id === 'errorAudit' ? 'audit' : system.id, input);
      setNotice(`نجح الاختبار الفعلي لخدمة ${system.name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل اختبار الخدمة.');
    } finally {
      setRunning('');
    }
  };

  return (
    <div className="min-h-full bg-background p-4">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">مركز التحكم</h1>
          <p className="text-sm text-muted-foreground">حالة الخدمات والنماذج والسجل الفعلي</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="ml-1 h-4 w-4" /> تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
            <ArrowRight className="ml-1 h-4 w-4" /> المحادثة
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && <div className="mb-4 rounded-xl border border-border bg-card p-3 text-sm">{notice}</div>}

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2"><Activity className="h-5 w-5" /><h2 className="font-semibold">الخدمات</h2></div>
        {loading ? <p className="text-sm text-muted-foreground">جاري التحميل…</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {systems.map((system) => (
              <div key={system.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{system.name}</p>
                  <p className="text-xs text-muted-foreground">{system.status} · {system.healthChecked ? 'تم فحص الصحة' : 'لم يُفحص تلقائيًا'}</p>
                </div>
                <Button size="sm" variant="outline" disabled={Boolean(running)} onClick={() => void testSystem(system)}>
                  <Play className="ml-1 h-4 w-4" />
                  {running === system.id ? 'جاري الاختبار…' : 'اختبار'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">النماذج المتصلة</h2>
        <div className="flex flex-wrap gap-2">
          {models.map((model) => (
            <span key={model.id} className="rounded-full border border-border px-3 py-1 text-sm">
              {model.label}: {model.connected ? 'متصل' : 'غير متصل'}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">آخر أحداث التدقيق</h2>
        <div className="space-y-2">
          {events.length === 0 && <p className="text-sm text-muted-foreground">لا توجد أحداث مسجلة بعد.</p>}
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{event.service}</span>
                <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('ar-SA')}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{event.level}: {event.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
