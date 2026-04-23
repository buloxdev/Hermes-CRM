'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, User, RefreshCw, UserPlus, Mail, Building2, MapPin, Users } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot' | 'prospect-card';
  text?: string;
  prospect?: {
    name: string;
    title: string;
    company: string;
    detail: string;
    connection: string;
  };
}

interface CrmProspect {
  id: number;
  name: string;
  company: string;
  title: string;
  status: string;
  visible: boolean;
}

const chatSequence: Message[] = [
  { id: 1, type: 'user', text: "Hey, find me supply chain VPs at food & beverage companies in Memphis" },
  { id: 2, type: 'bot', text: "On it. Searching for VP-level supply chain roles at F&B companies in the Memphis metro area." },
  { id: 3, type: 'bot', text: "Found 3 prospects. Here's what I got:" },
  {
    id: 4, type: 'prospect-card',
    prospect: {
      name: 'Sarah Chen',
      title: 'VP Supply Chain',
      company: 'Mondelez International',
      detail: '$2.8B revenue · Memphis',
      connection: '2nd degree connection',
    },
  },
  {
    id: 5, type: 'prospect-card',
    prospect: {
      name: 'James Rodriguez',
      title: 'SVP Operations',
      company: "Kellogg's",
      detail: 'Southeast region distribution',
      connection: 'Memphis plant',
    },
  },
  {
    id: 6, type: 'prospect-card',
    prospect: {
      name: 'Maria Santos',
      title: 'Director of Supply Chain',
      company: 'Tyson Foods',
      detail: 'Cold chain logistics',
      connection: 'Memphis facility',
    },
  },
  { id: 7, type: 'bot', text: "Research done. Draft emails ready. All saved to your CRM. Want me to send?" },
  { id: 8, type: 'user', text: "Not yet, I'll review first." },
  { id: 9, type: 'bot', text: "Got it. They're in your pipeline under 'New Lead'. Draft emails are attached." },
];

const sequenceDelays = [800, 2000, 2500, 1500, 1500, 1500, 2000, 1500, 1500];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-teal-400" />
      </div>
      <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function ProspectCard({ prospect }: { prospect: NonNullable<Message['prospect']> }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-teal-400" />
      </div>
      <div className="bg-slate-800 rounded-2xl rounded-bl-sm p-4 max-w-sm border border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{prospect.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{prospect.name}</p>
            <p className="text-xs text-teal-400">{prospect.title}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 className="w-3 h-3" />
            <span>{prospect.company}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="w-3 h-3" />
            <span>{prospect.detail}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-teal-400/80">
            <Users className="w-3 h-3" />
            <span>{prospect.connection}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BotDemo() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [crmProspects, setCrmProspects] = useState<CrmProspect[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const runSequence = () => {
    setVisibleMessages([]);
    setCrmProspects([]);
    setTyping(false);
    setRunning(true);
    setDone(false);

    let currentDelay = 0;
    chatSequence.forEach((msg, index) => {
      const delay = sequenceDelays[index];

      // Show typing indicator for bot messages (except prospect cards which get their own)
      if (msg.type === 'bot' && index > 0) {
        currentDelay += 600;
        const typingDelay = currentDelay;
        setTimeout(() => setTyping(true), typingDelay);
        currentDelay += delay;
        const hideTypingDelay = currentDelay;
        setTimeout(() => setTyping(false), hideTypingDelay);
      } else {
        currentDelay += delay;
      }

      const msgDelay = currentDelay;
      setTimeout(() => {
        setVisibleMessages(prev => [...prev, msg]);
        // Add to CRM when prospect card appears
        if (msg.type === 'prospect-card' && msg.prospect) {
          const crmProspect: CrmProspect = {
            id: msg.id,
            name: msg.prospect.name,
            company: msg.prospect.company,
            title: msg.prospect.title,
            status: msg.id <= 6 ? 'New Lead' : 'Email Drafted',
            visible: true,
          };
          setCrmProspects(prev => [...prev, crmProspect]);
        }
      }, msgDelay);
    });

    // After all messages, update CRM statuses
    setTimeout(() => {
      setCrmProspects(prev => prev.map(p => ({ ...p, status: 'Email Drafted' })));
      setDone(true);
      setRunning(false);
    }, currentDelay + 1500);
  };

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(runSequence, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, typing]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* Chat Interface */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sales AI Bot</p>
            <p className="text-xs text-teal-400">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto py-4 space-y-1">
          {visibleMessages.map((msg) => {
            if (msg.type === 'user') {
              return (
                <div key={msg.id} className="flex items-start gap-3 px-4 py-2 justify-end">
                  <div className="bg-teal-600 rounded-2xl rounded-br-sm px-4 py-3 max-w-xs">
                    <p className="text-sm text-white">{msg.text}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            }
            if (msg.type === 'prospect-card' && msg.prospect) {
              return <ProspectCard key={msg.id} prospect={msg.prospect} />;
            }
            return (
              <div key={msg.id} className="flex items-start gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-teal-400" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-slate-200">{msg.text}</p>
                </div>
              </div>
            );
          })}
          {typing && <TypingIndicator />}
        </div>

        {/* Replay button */}
        {done && (
          <div className="px-4 py-3 border-t border-slate-800">
            <button
              onClick={runSequence}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* CRM Preview */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[520px]">
        {/* CRM Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-semibold text-white">Prospects</span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
            {crmProspects.length} found
          </span>
        </div>

        {/* CRM Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {crmProspects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <UserPlus className="w-10 h-10 mb-3" />
              <p className="text-sm">Prospects will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Name</span>
                <span>Company</span>
                <span>Title</span>
                <span>Status</span>
              </div>
              {/* Prospect Rows */}
              {crmProspects.map((prospect, idx) => (
                <div
                  key={prospect.id}
                  className="grid grid-cols-4 gap-2 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 items-center animate-fadeIn"
                  style={{
                    animation: 'fadeInUp 0.5s ease-out forwards',
                    animationDelay: `${idx * 100}ms`,
                    opacity: 0,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-teal-600/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-teal-400">
                        {prospect.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-sm text-white truncate">{prospect.name}</span>
                  </div>
                  <span className="text-sm text-slate-400 truncate">{prospect.company}</span>
                  <span className="text-sm text-slate-400 truncate">{prospect.title}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${
                    prospect.status === 'Email Drafted'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  }`}>
                    {prospect.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draft email preview */}
        {done && (
          <div className="px-4 py-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-teal-400" />
              <span>3 draft emails ready for review</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
