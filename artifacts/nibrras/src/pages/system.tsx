import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { approveAction, inspectHuggingFace, planAction, rejectAction, rollbackAction, runEvals } from '../services/systemService';

export default function SystemPage() {
  const [online, setOnline] = useState(navigator.onLine);
  const [cameraOn, setCameraOn] = useState(false);
  const [modelId, setModelId] = useState('Qwen/Qwen2.5-0.5B-Instruct');
  const [report, setReport] = useState<any>(null);
  const [actionId, setActionId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  async function toggleCamera() {
    try {
      if (cameraOn) {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraOn(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (error: any) { toast.error(error?.message || 'تعذر تشغيل الكاميرا'); }
  }

  async function enableNotifications(): Promise<void> {
    if (!('Notification' in window)) { toast.error('الإشعارات غير مدعومة'); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('نبراس', { body: 'تم تفعيل إشعارات الجهاز المحلية.' });
      toast.success('تم تفعيل الإشعارات المحلية');
    } else toast.error('لم يتم منح إذن الإشعارات');
  }

  async function checkModel() {
    try { const data = await inspectHuggingFace(modelId); setReport(data); toast.success('اكتمل فحص النموذج'); }
    catch (error: any) { toast.error(error?.message || 'فشل الفحص'); }
  }

  async function createPlan() {
    try {
      const data = await planAction({ type: 'system_test', description: 'اختبار إجراء من تطبيق نبراس', risk: 'medium' });
      setActionId(data.actionId || data.plan?.actionId || ''); setReport(data); toast.success('تم إنشاء الخطة، ولم يُنفذ إجراء بعد');
    } catch (error: any) { toast.error(error?.message || 'فشل إنشاء الخطة'); }
  }

  async function decide(kind: 'approve'|'reject'|'rollback'): Promise<void> {
    if (!actionId) { toast.error('لا يوجد Action ID'); return; }
    try {
      const data = kind === 'approve' ? await approveAction(actionId) : kind === 'reject' ? await rejectAction(actionId) : await rollbackAction(actionId);
      setReport(data); toast.success('تم تحديث حالة الإجراء فعليًا');
    } catch (error: any) { toast.error(error?.message || 'فشل تحديث الإجراء'); }
  }

  async function evals() {
    try {
      const tests = [
        { id: 'online', name: 'اتصال الشبكة', passed: navigator.onLine, critical: true },
        { id: 'sw', name: 'Service Worker', passed: 'serviceWorker' in navigator, critical: true },
        { id: 'camera', name: 'دعم الكاميرا', passed: !!navigator.mediaDevices?.getUserMedia, critical: false },
        { id: 'notifications', name: 'دعم الإشعارات', passed: 'Notification' in window, critical: false },
      ];
      const data = await runEvals(tests); setReport(data);
      data.readyToPublish ? toast.success(`جاهزية ${data.score}%`) : toast.error(`غير جاهز: ${data.criticalFailures} أخطاء حرجة`);
    } catch (error: any) { toast.error(error?.message || 'فشل الاختبار'); }
  }

  const card = 'rounded-xl border border-border bg-card p-4 space-y-3';
  const button = 'rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50';

  return <div dir="rtl" className="mx-auto max-w-4xl space-y-4 p-4 pb-24">
    <h1 className="text-2xl font-bold">نظام نبراس</h1>
    <div className={card}><b>الحالة</b><p>{online ? 'متصل بالإنترنت' : 'غير متصل — الواجهة تعمل من الكاش، والطلبات السحابية متوقفة'}</p><button className={button} onClick={evals}>تشغيل فحص الجاهزية</button></div>

    <div className={card}><b>الموافقات والتراجع</b><p>لا يُعتبر إنشاء الخطة تنفيذًا.</p><div className="flex flex-wrap gap-2"><button className={button} onClick={createPlan}>إنشاء خطة اختبار</button><button className={button} onClick={() => decide('approve')}>موافقة</button><button className={button} onClick={() => decide('reject')}>رفض</button><button className={button} onClick={() => decide('rollback')}>تراجع</button></div><p className="text-xs">Action ID: {actionId || 'لا يوجد'}</p></div>

    <div className={card}><b>الكاميرا المباشرة</b><video ref={videoRef} autoPlay playsInline muted className="min-h-48 w-full rounded-lg bg-black object-cover"/><button className={button} onClick={toggleCamera}>{cameraOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}</button><p className="text-xs">المعاينة محلية ولا تُرسل صورًا تلقائيًا. تحليل Vision المتواصل غير مفعّل دون مزود متصل.</p></div>

    <div className={card}><b>الصوت المباشر</b><p>صلاحية الميكروفون متاحة في المتصفح، لكن مكالمة AI ثنائية الاتجاه تحتاج Realtime session آمنة. لم يتم الادعاء بأنها مفعلة.</p><button className={button} onClick={async () => { try { const s = await navigator.mediaDevices.getUserMedia({audio:true}); s.getTracks().forEach(t=>t.stop()); toast.success('الميكروفون يعمل'); } catch(e:any){ toast.error(e?.message || 'فشل الميكروفون'); } }}>اختبار الميكروفون</button></div>

    <div className={card}><b>النماذج المحلية</b><input className="w-full rounded-lg border bg-background p-2" value={modelId} onChange={e => setModelId(e.target.value)}/><button className={button} onClick={checkModel}>فحص توافق الآيفون</button><p className="text-xs">التشغيل المحلي الحقيقي يتطلب تطبيق iOS أصليًا بـMLX/Core ML/llama.cpp؛ الـPWA تعرض الفحص والإدارة فقط.</p></div>

    <div className={card}><b>الإشعارات</b><button className={button} onClick={enableNotifications}>تفعيل إشعارات الجهاز</button><p className="text-xs">هذه إشعارات محلية. Push من الخادم يحتاج VAPID واشتراك Push منفصل.</p></div>

    {report && <pre className="overflow-auto rounded-xl border bg-black p-3 text-xs text-white">{JSON.stringify(report, null, 2)}</pre>}
  </div>;
}
