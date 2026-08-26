import { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReasoningTrace } from '@/components/ReasoningTrace';
import { TypewriterText } from '@/components/TypewriterText';
import type { ReasoningStep } from '@/types';

interface Message {
  role: 'user' | 'ai';
  text: string;
  reasoning?: ReasoningStep[];
  reasoningSummary?: string;
}

interface Props {
  docId: string;
}

export function DocumentAskAI({ docId }: Props) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const token = localStorage.getItem('sadi_token');
      const res = await fetch(`/api/data/documents/${docId}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages((m) => [...m, { role: 'ai', text: data.answer, reasoning: data.reasoning, reasoningSummary: data.reasoningSummary }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'ai', text: err instanceof Error ? err.message : 'Something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary-600" />
          <CardTitle>Ask AI about this file</CardTitle>
        </div>
        <p className="text-xs text-neutral-500 mt-1">AI can see the actual content — PDFs, Office docs, images, everything.</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {messages.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <Bot className="h-3.5 w-3.5 text-primary-600" />
                  </div>
                )}
                <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'rounded-2xl rounded-br-sm bg-primary-600 px-4 py-2.5 text-sm text-white' : 'rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2.5 text-sm text-neutral-800'}`}>
                  {msg.role === 'ai' && msg.reasoning && msg.reasoning.length > 0 && (
                    <ReasoningTrace steps={msg.reasoning} summary={msg.reasoningSummary} />
                  )}
                  {msg.role === 'ai' ? <TypewriterText text={msg.text} speed={10} /> : msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                    <User className="h-3.5 w-3.5 text-neutral-500" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <Bot className="h-3.5 w-3.5 text-primary-600" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="Ask anything about this document..."
            className="flex-1 h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          <Button onClick={ask} disabled={!question.trim() || loading} icon={<Send className="h-4 w-4" />}>
            Ask
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
