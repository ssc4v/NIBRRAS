import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Send, Mic, Camera, Paperclip } from 'lucide-react';
import { getInitialMessages, sendMessageMock } from '../services/chatService';
import { Message } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    getInitialMessages().then(setMessages);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    sendMessageMock(newMsg.content).then((reply) => {
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="h-14 border-b border-border flex items-center px-4 justify-between bg-card flex-shrink-0 z-10">
        <h1 className="font-bold text-lg tracking-tight">NIBRRAS <span className="font-normal text-muted-foreground ml-1">/ نِبراس</span></h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-sm' 
                : 'bg-muted text-foreground border border-border rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-muted text-foreground border border-border rounded-bl-sm flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse delay-150"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse delay-300"></span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border space-y-3 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 bg-background" onClick={() => setLocation('/learning')}>
            علّمني
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 bg-background" onClick={() => setLocation('/search')}>
            ابحث بعمق
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs shrink-0 bg-background" onClick={() => setLocation('/control')}>
            شغّل Workflow
          </Button>
        </div>

        <form onSubmit={handleSend} className="flex gap-2 items-center bg-muted/50 p-1.5 rounded-full border border-border focus-within:ring-1 focus-within:ring-ring transition-all">
          <Button type="button" variant="ghost" size="icon" className="rounded-full shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-full shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
            <Camera className="w-4 h-4" />
          </Button>
          
          <input
            type="text"
            placeholder="رسالة..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 placeholder:text-muted-foreground"
          />
          
          {input.trim() ? (
             <Button type="submit" size="icon" className="rounded-full shrink-0 h-9 w-9 bg-primary text-primary-foreground">
               <Send className="w-4 h-4 rtl:-scale-x-100" />
             </Button>
          ) : (
            <Button type="button" variant="ghost" size="icon" className="rounded-full shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
              <Mic className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
