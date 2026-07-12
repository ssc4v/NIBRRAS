import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle, Camera, Mic, Paperclip, Send } from 'lucide-react';
import { getInitialMessages, sendMessage } from '../services/chatService';
import type { Message } from '../types';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getInitialMessages().then(setMessages).catch(() => setMessages([]));
  }, []);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setIsTyping(true);

    try {
      const reply = await sendMessage(content);
      setMessages((current) => [...current, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الاتصال بخدمة المحادثة.');
    } finally {
      setIsTyping(false);
    }
  };

  const notAvailable = (feature: string) => setError(`${feature} غير متاحة بعد، ولم يتم تنفيذ أي عملية.`);

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
        <h1 className="font-bold text-lg">NIBRRAS <span className="font-normal text-muted-foreground">/ نِبراس</span></h1>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted'}`}>
              {message.content}
            </div>
          </div>
        ))}

        {isTyping && <div className="text-sm text-muted-foreground">جارٍ انتظار رد حقيقي من n8n…</div>}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-border bg-background p-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setLocation('/learning')}>علّمني</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setLocation('/search')}>ابحث بعمق</Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setLocation('/control')}>شغّل Workflow</Button>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 rounded-full border border-border bg-muted/50 p-1.5">
          <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => notAvailable('رفع الملفات')}><Paperclip className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => notAvailable('الكاميرا')}><Camera className="h-4 w-4" /></Button>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="رسالة…" className="flex-1 bg-transparent px-2 text-sm outline-none" />
          {input.trim() ? (
            <Button type="submit" size="icon" className="rounded-full" disabled={isTyping}><Send className="h-4 w-4" /></Button>
          ) : (
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => notAvailable('التسجيل الصوتي')}><Mic className="h-4 w-4" /></Button>
          )}
        </form>
      </div>
    </div>
  );
}
