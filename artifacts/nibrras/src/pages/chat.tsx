import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle, Send } from 'lucide-react';
import {
  getInitialMessages,
  getSavedModel,
  saveModel,
  sendMessage,
  type ChatModel,
} from '../services/chatService';
import type { Message } from '../types';
import { Button } from '@/components/ui/button';

const MODEL_LABELS: Record<ChatModel, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
};

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<ChatModel>(getSavedModel());
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getInitialMessages().then(setMessages).catch(() => setMessages([]));
  }, []);

  const changeModel = (value: ChatModel) => {
    setModel(value);
    saveModel(value);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setIsTyping(true);

    try {
      const reply = await sendMessage(content, model);
      setMessages((current) => [...current, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الاتصال بخدمة المحادثة.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
        <div>
          <h1 className="font-bold text-lg">NIBRRAS <span className="font-normal text-muted-foreground">/ نبراس</span></h1>
          <p className="text-xs text-muted-foreground">النموذج الفعلي: {MODEL_LABELS[model]}</p>
        </div>
        <select
          value={model}
          onChange={(event) => changeModel(event.target.value as ChatModel)}
          disabled={isTyping}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          aria-label="اختيار نموذج الذكاء الاصطناعي"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            اكتب رسالتك. سيتم إرسالها إلى {MODEL_LABELS[model]} عبر NIRBAS Chat في n8n.
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted'}`}>
              {message.content}
            </div>
          </div>
        ))}

        {isTyping && <div className="text-sm text-muted-foreground">جاري انتظار الرد الحقيقي من {MODEL_LABELS[model]}…</div>}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </main>

      <footer className="shrink-0 space-y-3 border-t border-border bg-background p-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button variant="outline" size="sm" onClick={() => setLocation('/learning')}>علّمني</Button>
          <Button variant="outline" size="sm" onClick={() => setLocation('/search')}>ابحث بعمق</Button>
          <Button variant="outline" size="sm" onClick={() => setLocation('/control')}>مركز التحكم</Button>
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 rounded-full border border-border bg-muted/50 p-1.5">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب رسالتك…"
            className="flex-1 bg-transparent px-3 text-sm outline-none"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">المرفقات والكاميرا والصوت معطلة حتى يتم ربط Backend حقيقي لها.</p>
      </footer>
    </div>
  );
}
