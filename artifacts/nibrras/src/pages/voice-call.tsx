import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, RefreshCw, Send, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSavedModel, sendMessage, type ChatModel } from '../services/chatService';

type CallState = 'idle' | 'ready' | 'listening' | 'thinking' | 'speaking' | 'error';
type Line = { role: 'user' | 'assistant' | 'system'; text: string };

export default function VoiceCallPage() {
  const [state, setState] = useState<CallState>('idle');
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [model, setModel] = useState<ChatModel>(getSavedModel());
  const [lines, setLines] = useState<Line[]>([]);
  const [interimText, setInterimText] = useState('');
  const [draftText, setDraftText] = useState('');

  const recognitionRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const pressedRef = useRef(false);
  const finalBufferRef = useRef('');
  const submittingRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
    mutedRef.current = muted;
  }, [active, muted]);

  useEffect(() => () => {
    stopRecognition();
    stopCamera();
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    window.speechSynthesis?.cancel();
  }, []);

  function recognitionConstructor() {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }

  function createRecognition() {
    const SpeechRecognition = recognitionConstructor();
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState('listening');
      setInterimText('');
      finalBufferRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let finalText = finalBufferRef.current;
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const alternatives = Array.from(result as any) as any[];
        const best = alternatives.sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))[0];
        const transcript = String(best?.transcript || '').trim();
        if (!transcript) continue;

        if (result.isFinal) finalText = `${finalText} ${transcript}`.trim();
        else interim = `${interim} ${transcript}`.trim();
      }

      finalBufferRef.current = finalText;
      setDraftText(finalText);
      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      if (['aborted', 'no-speech'].includes(event.error)) return;
      setState('error');
      toast.error(`تعذر التقاط الصوت: ${event.error || 'خطأ غير معروف'}`);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setInterimText('');
      if (pressedRef.current && activeRef.current && !mutedRef.current) {
        window.setTimeout(startListening, 180);
      } else if (activeRef.current) {
        setState('ready');
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }

  function startListening() {
    if (!activeRef.current || mutedRef.current || submittingRef.current) return;
    try {
      const recognition = recognitionRef.current || createRecognition();
      recognition?.start();
    } catch {}
  }

  function stopRecognition() {
    pressedRef.current = false;
    try { recognitionRef.current?.stop(); } catch {
      try { recognitionRef.current?.abort(); } catch {}
    }
    recognitionRef.current = null;
  }

  function beginPressToTalk() {
    if (!active || muted || submittingRef.current) return;
    pressedRef.current = true;
    finalBufferRef.current = '';
    setDraftText('');
    setInterimText('');
    window.speechSynthesis?.cancel();
    startListening();
  }

  async function endPressToTalk() {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}

    await new Promise(resolve => window.setTimeout(resolve, 320));
    const text = `${finalBufferRef.current} ${interimText}`.trim();
    if (!text) {
      setState('ready');
      toast.error('لم ألتقط كلامًا واضحًا. قرّب الهاتف وتحدث بعد ظهور كلمة «أستمع».');
      return;
    }
    await submitText(text);
  }

  async function submitText(raw: string) {
    const text = raw.trim();
    if (!text || submittingRef.current) return;

    submittingRef.current = true;
    stopRecognition();
    setDraftText('');
    setInterimText('');
    setLines(previous => [...previous, { role: 'user', text }]);
    setState('thinking');

    try {
      const reply = await sendMessage(text, model);
      setLines(previous => [...previous, { role: 'assistant', text: reply.content }]);
      await speak(reply.content);
    } catch (error: any) {
      setState('error');
      toast.error(error?.message || 'فشل الاتصال بنبراس');
    } finally {
      submittingRef.current = false;
      if (activeRef.current) setState('ready');
    }
  }

  async function speak(text: string) {
    if (!('speechSynthesis' in window)) {
      toast.error('النطق الصوتي غير مدعوم في هذا المتصفح');
      return;
    }

    setState('speaking');
    window.speechSynthesis.cancel();

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.92;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(voice => voice.lang.toLowerCase().startsWith('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.onend = () => resolve();
      utterance.onerror = () => { toast.error('تعذر تشغيل صوت الرد'); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  async function startCall() {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error('المتصفح لا يدعم الوصول إلى الميكروفون');
    if (!recognitionConstructor()) return toast.error('التعرف الصوتي غير متاح هنا. افتح النسخة المنشورة في Safari.');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      micStreamRef.current = stream;
      activeRef.current = true;
      mutedRef.current = false;
      setActive(true);
      setMuted(false);
      setState('ready');
      setLines(previous => [...previous, { role: 'system', text: 'بدأت المكالمة. اضغط مطولًا على زر «اضغط وتحدث»، ثم اتركه عند انتهاء الجملة.' }]);
    } catch (error: any) {
      setState('error');
      toast.error(error?.message || 'لم يتم منح إذن الميكروفون');
    }
  }

  function endCall() {
    activeRef.current = false;
    pressedRef.current = false;
    setActive(false);
    setMuted(false);
    stopRecognition();
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
    window.speechSynthesis?.cancel();
    setState('idle');
    setDraftText('');
    setInterimText('');
    setLines(previous => [...previous, { role: 'system', text: 'انتهت المكالمة.' }]);
  }

  function toggleMute() {
    const next = !muted;
    mutedRef.current = next;
    setMuted(next);
    micStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = !next; });
    if (next) { stopRecognition(); setState('ready'); }
  }

  async function startCamera(mode: 'user' | 'environment' = facing) {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (error: any) { toast.error(error?.message || 'تعذر تشغيل الكاميرا'); }
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function switchCamera() {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    if (cameraOn) await startCamera(next);
  }

  const labels: Record<CallState, string> = {
    idle: 'جاهز', ready: 'اضغط مطولًا وتحدث', listening: 'أستمع الآن…',
    thinking: 'نبراس يفكر…', speaking: 'نبراس يتحدث…', error: 'تعذر الاتصال',
  };

  return (
    <div dir="rtl" className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div><h1 className="text-xl font-bold">مكالمة نبراس</h1><p className="text-sm text-muted-foreground">{labels[state]}</p></div>
          <select value={model} onChange={event => setModel(event.target.value as ChatModel)} disabled={active} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="openai">OpenAI</option><option value="gemini">Gemini</option><option value="deepseek">DeepSeek</option>
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="relative mb-4 aspect-video overflow-hidden rounded-3xl border border-border bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {!cameraOn && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70"><CameraOff className="h-10 w-10" /><span className="text-sm">الكاميرا متوقفة</span></div>}
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{active ? labels[state] : 'لم تبدأ المكالمة'}</div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <button onClick={cameraOn ? stopCamera : () => startCamera()} className="rounded-2xl border border-border bg-card p-3 text-sm">{cameraOn ? <CameraOff className="mx-auto mb-1 h-5 w-5" /> : <Camera className="mx-auto mb-1 h-5 w-5" />}{cameraOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}</button>
          <button onClick={switchCamera} disabled={!cameraOn} className="rounded-2xl border border-border bg-card p-3 text-sm disabled:opacity-40"><RefreshCw className="mx-auto mb-1 h-5 w-5" /> تبديل</button>
          <button onClick={toggleMute} disabled={!active} className="rounded-2xl border border-border bg-card p-3 text-sm disabled:opacity-40">{muted ? <MicOff className="mx-auto mb-1 h-5 w-5" /> : <Mic className="mx-auto mb-1 h-5 w-5" />}{muted ? 'تشغيل الصوت' : 'كتم'}</button>
        </div>

        {active && <section className="mb-4 rounded-3xl border border-border bg-card p-4">
          <button onPointerDown={beginPressToTalk} onPointerUp={endPressToTalk} onPointerCancel={endPressToTalk} onContextMenu={event => event.preventDefault()} disabled={muted || state === 'thinking' || state === 'speaking'} className="flex w-full touch-none select-none items-center justify-center gap-2 rounded-2xl bg-primary py-5 font-bold text-primary-foreground disabled:opacity-50">
            <Mic className="h-6 w-6" />{state === 'listening' ? 'اترك الزر لإرسال كلامك' : 'اضغط مطولًا وتحدث'}
          </button>
          {(draftText || interimText) && <div className="mt-3 rounded-2xl bg-muted p-3 text-sm"><div>{draftText}</div>{interimText && <div className="text-muted-foreground">{interimText}…</div>}</div>}
          <div className="mt-3 flex gap-2"><input value={draftText} onChange={event => setDraftText(event.target.value)} placeholder="أو اكتب الجملة يدويًا" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" /><button onClick={() => submitText(draftText)} disabled={!draftText.trim()} className="rounded-xl bg-primary px-4 disabled:opacity-40"><Send className="h-5 w-5 text-primary-foreground" /></button></div>
        </section>}

        <section className="space-y-2 rounded-3xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 font-semibold"><Volume2 className="h-4 w-4" /> سجل المكالمة</div>
          {lines.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">ابدأ المكالمة ثم اضغط مطولًا على زر التحدث.</p> : lines.map((line, index) => <div key={index} className={`rounded-2xl px-3 py-2 text-sm ${line.role === 'user' ? 'mr-8 bg-primary text-primary-foreground' : line.role === 'assistant' ? 'ml-8 bg-muted' : 'bg-background text-center text-muted-foreground'}`}>{line.text}</div>)}
        </section>
      </main>

      <footer className="border-t border-border p-4">
        {!active ? <button onClick={startCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 font-bold text-white"><Phone className="h-6 w-6" /> بدء المكالمة</button> : <button onClick={endCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-bold text-white"><PhoneOff className="h-6 w-6" /> إنهاء المكالمة</button>}
        <p className="mt-2 text-center text-[11px] text-muted-foreground">استخدم «اضغط وتحدث» لتجنب تقطيع الكلمات في Safari. تحليل الكاميرا غير مفعّل حتى يتصل نموذج Vision فعلي.</p>
      </footer>
    </div>
  );
}
