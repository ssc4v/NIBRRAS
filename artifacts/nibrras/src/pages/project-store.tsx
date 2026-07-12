import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  inspectGithubProject,
  listSkills,
  registerSkill,
  sandboxGithubProject,
  scanGithubProject,
} from '../services/projectStoreService';

type StepState = 'idle' | 'running' | 'success' | 'error';

type ProjectReport = {
  name?: string;
  fullName?: string;
  license?: string;
  language?: string;
  compatibilityScore?: number;
  riskLevel?: string;
  runtime?: string;
  adapterType?: string;
  executionId?: string;
  [key: string]: unknown;
};

export default function ProjectStorePage() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Record<string, StepState>>({
    inspect: 'idle', security: 'idle', sandbox: 'idle', register: 'idle',
  });

  const setStep = (name: string, state: StepState) =>
    setSteps((current) => ({ ...current, [name]: state }));

  const refreshSkills = async () => {
    try {
      const data = await listSkills();
      setSkills(Array.isArray(data.skills) ? data.skills : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تحميل المهارات');
    }
  };

  useEffect(() => { void refreshSkills(); }, []);

  const runPipeline = async () => {
    const cleanUrl = url.trim();
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(cleanUrl)) {
      toast.error('أدخل رابط مستودع GitHub صحيحًا');
      return;
    }

    setBusy(true);
    setReport(null);
    setSteps({ inspect: 'running', security: 'idle', sandbox: 'idle', register: 'idle' });

    try {
      const inspected = await inspectGithubProject(cleanUrl);
      setReport(inspected);
      setStep('inspect', 'success');

      setStep('security', 'running');
      const security = await scanGithubProject(cleanUrl);
      if (security?.decision === 'blocked' || security?.riskLevel === 'high') {
        setStep('security', 'error');
        throw new Error(security?.message || 'أوقف الفحص الأمني الاستيراد');
      }
      setReport((current) => ({ ...current, security }));
      setStep('security', 'success');

      setStep('sandbox', 'running');
      const sandbox = await sandboxGithubProject(cleanUrl);
      if (sandbox?.status && !['passed', 'success'].includes(String(sandbox.status))) {
        setStep('sandbox', 'error');
        throw new Error(sandbox?.message || 'فشل اختبار Sandbox');
      }
      setReport((current) => ({ ...current, sandbox }));
      setStep('sandbox', 'success');

      setStep('register', 'running');
      const name = String(inspected?.name || inspected?.repository || cleanUrl.split('/').pop() || 'Imported Project');
      const created = await registerSkill({
        name,
        description: `Imported from ${cleanUrl}`,
        type: inspected?.adapterType || 'project',
        source: cleanUrl,
        version: inspected?.version || '1.0.0',
        permissions: inspected?.permissions || [],
        status: 'disabled',
        testScore: Number(security?.score || sandbox?.score || 0),
      });
      setReport((current) => ({ ...current, registeredSkill: created?.skill }));
      setStep('register', 'success');
      await refreshSkills();
      toast.success('تم الفحص والتسجيل. التفعيل ما زال يحتاج موافقة.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشلت عملية الاستيراد');
    } finally {
      setBusy(false);
    }
  };

  const stepLabel = (state: StepState) => {
    if (state === 'running') return 'قيد التنفيذ';
    if (state === 'success') return 'نجح';
    if (state === 'error') return 'فشل';
    return 'لم يبدأ';
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">متجر المشاريع</h1>
          <p className="mt-1 text-sm text-muted-foreground">افحص مشروع GitHub وسجله كمهارة بدون تشغيله مباشرة أو منحه صلاحيات.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="text-sm font-medium">رابط المشروع</label>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/owner/repository"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button type="button" onClick={runPipeline} disabled={busy} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">
            {busy ? 'جاري الفحص…' : 'افحص وسجّل المشروع'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['inspect', 'تحليل المشروع'], ['security', 'الفحص الأمني'], ['sandbox', 'اختبار Sandbox'], ['register', 'تسجيل المهارة'],
          ].map(([key, title]) => (
            <div key={key} className="rounded-2xl border border-border bg-card p-3">
              <div className="text-sm font-medium">{title}</div>
              <div className="mt-2 text-xs text-muted-foreground">{stepLabel(steps[key])}</div>
            </div>
          ))}
        </div>

        {report && <pre className="max-h-80 overflow-auto rounded-2xl border border-border bg-card p-4 text-xs whitespace-pre-wrap">{JSON.stringify(report, null, 2)}</pre>}

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">المهارات المسجلة</h2>
            <button type="button" className="text-sm text-primary" onClick={refreshSkills}>تحديث</button>
          </div>
          <div className="mt-3 space-y-2">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مهارات مسجلة.</p>
            ) : skills.map((skill) => (
              <div key={skill.skillId} className="rounded-xl border border-border p-3">
                <div className="font-medium">{skill.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{skill.type} · {skill.version} · {skill.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
