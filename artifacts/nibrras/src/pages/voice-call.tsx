import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Send,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSavedModel, sendMessage, type ChatModel } from '../services/chatService';

type CallState = 'idle' | 'ready' | 'listening' | 'thinking' | 'speaking' | 'error';
type Line = { role: 'user' | 'assistant' | 'system'; text: string };

const sleep = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

export default function VoiceCallPage() {
  const [state, setState] = useState<CallState>('idle');
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [model, setModel] = useState<ChatModel>(getSavedModel());
  const [lines, setLines] = useState<Line[]>([]);
  const [draftText, setDraftText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [audioReady, setAudioReady] = useState(false);

  const recognitionRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const pressedRef = useRef(false);
  const finalBufferRef = useRef('');
  const submittingRef = useRef(false);
  const speechResumeTimerRef = useRef<number | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    activeRef.current = active;
    mutedRef.current = muted;
  }, [active, muted]);

  useEffect(() => {
    return () => {
      stopRecognition();
      stopCamera();
      stopMicStream();
      stopSpeech();
    };
  }, []);

  function recognitionConstructor() {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }

  function chooseArabicVoice(): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(voice => voice.lang.toLowerCase() === 'ar-sa')
      ?? voices.find(voice => voice.lang.toLowerCase().startsWith('ar'))
      ?? voices.find(voice => /arabic|majed|maged|tarik|laila/i.test(voice.name))
      ?? voices[0]
      ?? null;
    selectedVoiceRef.current = preferred;
    return preferred;
  }

  async function unlockAudio(): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      setAudioReady(false);
      return false;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    chooseArabicVoice();

    // iOS requires speech playback to be unlocked from a direct user gesture.
    const unlock = new SpeechSynthesisUtterance('تم');
    unlock.lang = 'ar-SA';
    unlock.volume = 0.01;
    unlock.rate = 1;
    if (selectedVoiceRef.current) unlock.voice = selectedVoiceRef.current;

    const unlocked = await new Promise<boolean>(resolve => {
      const timeout = window.setTimeout(() => resolve(false), 1800);
      unlock.onstart = () => {
        window.clearTimeout(timeout);
        resolve(true);
      };
      unlock.onend = () => {
        window.clearTimeout(timeout);
        resolve(true);
      };
      unlock.onerror = () => {
        window.clearTimeout(timeout);
        resolve(false);
      };
      window.speechSynthesis.speak(unlock);
    });

    window.speechSynthesis.cancel();
    setAudioReady(unlocked);
    return unlocked;
  }

  function stopSpeech() {
    if (speechResumeTimerRef.current !== null) {
      window.clearInterval(speechResumeTimerRef.current);
      speechResumeTimerRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  async function speak(text: string): Promise<void> {
    if (!('speechSynthesis' in window)) {
      toast.error('هذا المتصفح لا يدعم إخراج الصوت');
      setAudioReady(false);
      return;
    }

    const cleanText = text.replace(/https?:\/\/\S+/g, '').replace(/[*#`_]/g, '').trim();
    if (!cleanText) return;

    stopRecognition();
    stopSpeech();
    window.speechSynthesis.resume();
    chooseArabicVoice();
    setState('speaking');

    await new Promise<void>(resolve => {
      let started = false;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = selectedVoiceRef.current?.lang || 'ar-SA';
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current;

      const watchdog = window.setTimeout(() => {
        if (!started) {
          stopSpeech();
          setAudioReady(false);
          toast.error('منع iPhone تشغيل الصوت. اضغط «اختبار الصوت» ثم أعد المحاولة.');
          resolve();
        }
      }, 2500);

      utterance.onstart = () => {
        started = true;
        setAudioReady(true);
        window.clearTimeout(watchdog);
      };
      utterance.onend = () => {
        window.clearTimeout(watchdog);
        stopSpeech();
        resolve();
      };
      utterance.onerror = event => {
        window.clearTimeout(watchdog);
        stopSpeech();
        setAudioReady(false);
        toast.error(`تعذر تشغيل الصوت: ${event.error || 'خطأ غير معروف'}`);
        resolve();
      };

      window.speechSynthesis.speak(utterance);

      // Safari occasionally pauses long utterances; keep it resumed while speaking.
      speechResumeTimerRef.current = window.setInterval(() => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 750);
    });

    if (activeRef.current) setState('ready');
  }

  async function testSpeaker() {
    const unlocked = audioReady || await unlockAudio();
    if (!unlocked) {
      toast.error('تعذر فتح سماعة iPhone. تأكد أن الجهاز ليس على الصامت وارفع مستوى الصوت.');
      return;
    }
    await speak('مرحباً فهد، صوت نبراس يعمل الآن.');
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
      toast.error(`تعذر التقاط الكلام: ${event.error || 'خطأ غير معروف'}`);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setInterimText('');
      if (pressedRef.current && activeRef.current && !mutedRef.current) {
        window.setTimeout(startListening, 180);
      } else if (activeRef.current && !submittingRef.current) {
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
    } catch {
      // Safari throws when start is called while the prior session is still closing.
    }
  }

  function stopRecognition() {
    pressedRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      try { recognitionRef.current?.abort(); } catch { /* no-op */ }
    }
    recognitionRef.current = null;
  }

  function beginPressToTalk() {
    if (!active || muted || submittingRef.current) return;
    stopSpeech();
    pressedRef.current = true;
    finalBufferRef.current = '';
    setDraftText('');
    setInterimText('');
    startListening();
  }

  async function endPressToTalk() {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* no-op */ }
    await sleep(380);
    const text = `${finalBufferRef.current} ${interimText}`.trim();
    if (!text) {
      setState('ready');
      toast.error('لم ألتقط كلاماً واضحاً. قرب الهاتف وتحدث بعد ظهور «أستمع الآن».');
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
      if (activeRef.current && state !== 'error') setState('ready');
    }
  }

  async function startCall() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('المتصفح لا يدعم الوصول إلى الميكروفون');
      return;
    }
    if (!recognitionConstructor()) {
      toast.error('التعرف الصوتي غير متاح هنا. افتح النسخة المنشورة في Safari.');
      return;
    }

    try {
      // Both permissions and audio playback are unlocked by this direct tap.
      const [stream, unlocked] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        }),
        unlockAudio(),
      ]);

      micStreamRef.current = stream;
      activeRef.current = true;
      mutedRef.current = false;
      setActive(true);
      setMuted(false);
      setState('ready');
      setLines(previous => [
        ...previous,
        {
          role: 'system',
          text: unlocked
            ? 'بدأت المكالمة والصوت جاهز. اضغط مطولاً على زر التحدث.'
            : 'بدأت المكالمة، لكن iPhone لم يؤكد فتح السماعة. استخدم زر اختبار الصوت.',
        },
      ]);
    } catch (error: any) {
      setState('error');
      toast.error(error?.message || 'لم يتم منح إذن الميكروفون');
    }
  }

  function stopMicStream() {
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
  }

  function endCall() {
    activeRef.current = false;
    pressedRef.current = false;
    setActive(false);
    setMuted(false);
    stopRecognition();
    stopMicStream();
    stopSpeech();
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
    if (next) {
      stopRecognition();
      setState('ready');
    }
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
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تشغيل الكاميرا');
    }
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
    idle: 'جاهز',
    ready: audioReady ? 'الصوت جاهز — اضغط وتحدث' : 'اضغط اختبار الصوت',
    listening: 'أستمع الآن…',
    thinking: 'نبراس يفكر…',
    speaking: 'نبراس يتحدث…',
    error: 'تعذر الاتصال',
  };

  return (
    <div dir="rtl" className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">مكالمة نبراس</h1>
            <p className="text-sm text-muted-foreground">{labels[state]}</p>
          </div>
          <select
            value={model}
            onChange={event => setModel(event.target.value as ChatModel)}
            disabled={active}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="relative mb-4 aspect-video overflow-hidden rounded-3xl border border-border bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
              <CameraOff className="h-10 w-10" />
              <span className="text-sm">الكاميرا متوقفة</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {active ? labels[state] : 'لم تبدأ المكالمة'}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          <button onClick={cameraOn ? stopCamera : () => startCamera()} className="rounded-2xl border border-border bg-card p-3 text-sm">
            {cameraOn ? <CameraOff className="mx-auto mb-1 h-5 w-5" /> : <Camera className="mx-auto mb-1 h-5 w-5" />}
            {cameraOn ? 'إيقاف' : 'كاميرا'}
          </button>
          <button onClick={switchCamera} disabled={!cameraOn} className="rounded-2xl border border-border bg-card p-3 text-sm disabled:opacity-40">
            <RefreshCw className="mx-auto mb-1 h-5 w-5" />تبديل
          </button>
          <button onClick={toggleMute} disabled={!active} className="rounded-2xl border border-border bg-card p-3 text-sm disabled:opacity-40">
            {muted ? <MicOff className="mx-auto mb-1 h-5 w-5" /> : <Mic className="mx-auto mb-1 h-5 w-5" />}
            {muted ? 'تشغيل' : 'كتم'}
          </button>
          <button onClick={testSpeaker} className="rounded-2xl border border-border bg-card p-3 text-sm">
            <Volume2 className="mx-auto mb-1 h-5 w-5" />اختبار الصوت
          </button>
        </div>

        {active && (
          <section className="mb-4 rounded-3xl border border-border bg-card p-4">
            <button
              onPointerDown={beginPressToTalk}
              onPointerUp={endPressToTalk}
              onPointerCancel={endPressToTalk}
              onContextMenu={event => event.preventDefault()}
              disabled={muted || state === 'thinking' || state === 'speaking'}
              className="flex w-full touch-none select-none items-center justify-center gap-2 rounded-2xl bg-primary py-5 font-bold text-primary-foreground disabled:opacity-50"
            >
              <Mic className="h-6 w-6" />
              {state === 'listening' ? 'اترك الزر لإرسال كلامك' : 'اضغط مطولاً وتحدث'}
            </button>

            {(draftText || interimText) && (
              <div className="mt-3 rounded-2xl bg-muted p-3 text-sm">
                <div>{draftText}</div>
                {interimText && <div className="text-muted-foreground">{interimText}…</div>}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <input
                value={draftText}
                onChange={event => setDraftText(event.target.value)}
                placeholder="أو اكتب الجملة يدوياً"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <button onClick={() => submitText(draftText)} disabled={!draftText.trim()} className="rounded-xl bg-primary px-4 disabled:opacity-40">
                <Send className="h-5 w-5 text-primary-foreground" />
              </button>
            </div>
          </section>
        )}

        <section className="space-y-2 rounded-3xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 font-semibold"><Volume2 className="h-4 w-4" /> سجل المكالمة</div>
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ابدأ المكالمة ثم اختبر الصوت قبل التحدث.</p>
          ) : lines.map((line, index) => (
            <div
              key={index}
              className={`rounded-2xl px-3 py-2 text-sm ${line.role === 'user' ? 'mr-8 bg-primary text-primary-foreground' : line.role === 'assistant' ? 'ml-8 bg-muted' : 'bg-background text-center text-muted-foreground'}`}
            >
              {line.text}
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border p-4">
        {!active ? (
          <button onClick={startCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 font-bold text-white">
            <Phone className="h-6 w-6" /> بدء المكالمة
          </button>
        ) : (
          <button onClick={endCall} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-bold text-white">
            <PhoneOff className="h-6 w-6" /> إنهاء المكالمة
          </button>
        )}
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          ابدأ المكالمة بلمسة مباشرة لفتح سماعة iPhone، ثم استخدم «اختبار الصوت» للتأكد قبل التحدث.
        </p>
      </footer>
    </div>
  );
}
