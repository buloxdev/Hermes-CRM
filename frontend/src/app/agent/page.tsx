'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatMessage } from '@/lib/api';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: string;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey, I'm Mike. I can help you find prospects, answer questions about your pipeline, or give sales advice. Try asking me to find leads in a specific city!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatMessages: ChatMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content },
      ];

      const data = await sendChatMessage(chatMessages);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          action: data.action,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'Something went wrong. Try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[800px]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Agent</h1>
            <p className="text-sm text-slate-400">Ask me to find prospects or help with your pipeline</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-md'
                  : 'bg-slate-800 text-slate-200 rounded-bl-md'
              }`}
            >
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
              {msg.action === 'prospecting' && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-teal-400 font-medium">Prospecting complete</span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-teal-400" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try: find logistics VPs in Dallas..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Quick prompts */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {[
          'Find supply chain directors in Chicago',
          'How many deals are in negotiation?',
          'What is my pipeline value?',
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => setInput(prompt)}
            className="text-xs text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
