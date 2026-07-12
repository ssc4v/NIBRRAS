import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, RefreshCw, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSavedModel, sendMessage, type ChatModel } from '../services/chatService';

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
type Line = { role: 'user' | 'assistant' | 'system'; text: string };

export default function VoiceCallPage() {
  const [state, setState] = useState<CallState>('idle');
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [model, setModel] = useState<ChatModel>(getSavedModel());
  const [lines, setLines] = useState<Line[]>([]);
  const recognitionRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => { activeRef.current = active; mutedRef.current = muted; }, [active, muted]);
  useEffect(() => () => { stopRecognition(); stopCamera(); window.speechSynthesis?.cancel(); }, []);

  function recognitionConstructor() { return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; }

  function createRecognition() {
    const SpeechRecognition = recognitionConstructor();
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onstart = () => setState('listening');
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') { if (activeRef.current && !mutedRef.current) setTimeout(startListening, 400); return; }
      setState('error'); toast.error(`تعذر الاستماع: ${event.error || 'خطأ غير معروف'}`);
    };
    recognition.onend = () => {};
    recognition.onresult = async (event: any) => {
      const text = String(event.results?.[0]?.[0]?.transcript || '').trim();
      if (!text) return;
      setLines(prev => [...prev, { role: 'user', text }]); setState('thinking');
      try {
        const reply = await sendMessage(text, model);
        setLines(prev => [...prev, { role: 'assistant', text: reply.content }]);
        await speak(reply.content);
      } catch (error: any) {
        setState('error'); toast.error(error?.message || 'فشل الاتصال بنبراس');
        if (activeRef.current && !mutedRef.current) setTimeout(startListening, 700);
      }
    };
    recognitionRef.current = recognition; return recognition;
  }

  function startListening() { if (!activeRef.current || mutedRef.current) return; try { const recognition = recognitionRef.current || createRecognition(); recognition?.start(); } catch {} }
  function stopRecognition() { try { recognitionRef.current?.abort(); } catch {} recognitionRef.current = null; }

  async function speak(text: string) {
    if (!('speechSynthesis' in window)) { setState('listening'); if (activeRef.current && !mutedRef.current) startListening(); return; }
    setState('speaking'); window.speechSynthesis.cancel();
    await new Promise<void>((resolve) => { const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ar-SA'; utterance.rate = 1; utterance.onend = () => resolve(); utterance.onerror = () => resolve(); window.speechSynthesis.speak(utterance); });
    if (activeRef.current && !mutedRef.current) startListening(); else setState('idle');
  }

  async function startCall() {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error('المتصفح لا يدعم الوصول إلى الميكروفون');
    if (!recognitionConstructor()) return toast.error('التعرّف الصوتي غير متاح هنا. افتح النسخة المنشورة في Safari.');
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop()); activeRef.current = true; setActive(true); setMuted(false); setLines(prev => [...prev, { role: 'system', text: 'بدأت المكالمة. تكلم الآن.' }]); startListening(); }
    catch (error: any) { setState('error'); toast.error(error?.message || 'لم يتم منح إذن الميكروفون'); }
  }
  function endCall() { activeRef.current = false; setActive(false); setMuted(false); stopRecognition(); window.speechSynthesis?.cancel(); setState('idle'); setLines(prev => [...prev, { role: 'system', text: 'انتهت المكالمة.' }]); }
  function toggleMute() { const next = !muted; mutedRef.current = next; setMuted(next); if (next) { stopRecognition(); setState('idle'); } else if (active) startListening(); }

  async function startCamera(mode: 'user' | 'environment' = facing) {
    try { stopCamera(); const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } }, audio: false }); cameraStreamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; setCameraOn(true); }
    catch (error: any) { toast.error(error?.message || 'تعذر تشغيل الكاميرا'); }
  }
  function stopCamera() { cameraStreamRef.current?.getTracks().forEach(track => track.stop()); cameraStreamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; setCameraOn(false); }
  async function switchCamera() { const next = facing === 'user' ? 'environment' : 'user'; setFacing(next); if (cameraOn) await startCamera(next); }

  const labels: Record<CallState, string> = { idle: active ? 'متوقف مؤقتًا' : 'جاهز', listening: 'أستمع إليك…', thinking: 'نبراس يفكر…', speaking: 'نبراس يتحدث…', error: 'تعذر الاتصال' };

  return <div dir="rtl" className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden bg-background">
    <header className="border-b border-border px-4 py-4"><div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold">مكالمة نبراس</h1><p className="text-sm text-muted-foreground">{labels[state]}</p></div><select value={model} onChange={e => setModel(e.target.value as ChatModel)} disabled={active} className="rounded-xl border border-border bg-card px-3 py-2 text-sm"><option value="openai">OpenAI</option><option value="gemini">Gemini</option><option value="deepseek">DeepSeek</option></select></div></header>
    <main className="flex-1 overflow-y-auto p-4">
      <div className="relative mb-4 aspect-video overflow-hidden rounded-3xl border border-border bg-black"><video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />{!cameraOn && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70"><CameraOff className="h-10 w-10"/><span className="text-sm">الكاميرا متوقفة</span></div>}<div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{active ? labels[state] : 'لم تبدأ المكالمة'}</div></div>
      <div className="mb-4 grid grid-cols-3 gap-2"><button onClick={cameraOn ? stopCamera : () => startCamera()} className="rounded-2xl border border-border bg-card p-3 text-sm">{cameraOn ? <CameraOff className="mx-auto mb-1 h-5 w-5"/> : <Camera className="mx-auto mb-1 h-5 w-5"/>}{cameraOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}</button><button onClick={switchCamera} disabled={!cameraOn} className="rounded-2xl border border-border bg-card p-3 text-sm disabled:opacity-40"><RefreshCw className="mx-auto mb-1 h-5 w-5"/>تبديل</button><button onClick={toggleMute} disabled={!active} className="rounded-2xl border border-border bg-card p-3 text-sm disabled:opacity-40">{muted ? <MicOff className="mx-auto mb-1 h-5 w-5"/> : <Mic className="mx-auto mb-1 h-5 w-5"/>}{muted ? 'إلغاء الكتم' : 'كتم'}</button></div>
      <section className="space-y-2 rounded-3xl border border-border bg-card p-3"><div className="flex items-center gap-2 font-semibold"><Volume2 className="h-4 w-4"/>سجل المكالمة</div>{lines.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">ابدأ المكالمة ثم تكلم بصورة طبيعية.</p> : lines.map((line,index)=><div key={index} className={`rounded-2xl px-3 py-2 text-sm ${line.role==='user'?'mr-8 bg-primary text-primary-foreground':line.role==='assistant'?'ml-8 bg-muted':'bg-background text-center text-muted-foreground'}`}>{line.text}</div>)}</section>
    </main>
    <footer className="border-t border-border p-4">{!active ? <button onClick={startCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 font-bold text-white"><Phone className="h-6 w-6"/>بدء المكالمة</button> : <button onClick={endCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-bold text-white"><PhoneOff className="h-6 w-6"/>إنهاء المكالمة</button>}<p className="mt-2 text-center text-[11px] text-muted-foreground">مكالمة صوتية متتابعة عبر التعرف الصوتي والمتحدث في الجهاز؛ ليست WebRTC منخفضة التأخير.</p></footer>
  </div>;
}
