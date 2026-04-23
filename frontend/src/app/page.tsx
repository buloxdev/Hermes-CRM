'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Zap,
  ArrowRight,
  MessageSquare,
  Brain,
  BarChart3,
  Search,
  Mail,
  LayoutGrid,
  Globe,
  ChevronDown,
} from 'lucide-react';
import BotDemo from '@/components/BotDemo';

// Floating dots background animation
function FloatingDots() {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
    opacity: Math.random() * 0.3 + 0.05,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="absolute rounded-full bg-teal-400"
          style={{
            left: dot.left,
            top: dot.top,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.opacity,
            animation: `float ${dot.duration}s ease-in-out infinite`,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-25px) translateX(5px); }
        }
      `}</style>
    </div>
  );
}

const steps = [
  {
    icon: MessageSquare,
    title: 'Tell your bot',
    description: '"Find me VPs of Supply Chain in Dallas" — just type what you need.',
  },
  {
    icon: Brain,
    title: 'AI does the work',
    description: 'Researches companies, finds contacts, and drafts personalized outreach.',
  },
  {
    icon: BarChart3,
    title: 'Manage your pipeline',
    description: 'Everything lands in your CRM, ready to act on. You close the deals.',
  },
];

const features = [
  {
    icon: Search,
    title: 'Smart Research',
    description: 'AI scans web sources, news, and directories to find qualified prospects that match your ICP.',
  },
  {
    icon: Mail,
    title: 'Personalized Outreach',
    description: 'Draft emails reference specific company details, recent news, and relevant pain points.',
  },
  {
    icon: LayoutGrid,
    title: 'Pipeline Management',
    description: 'Track prospects from first touch to closed deal with a visual kanban pipeline.',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Prospect from your phone, manage from your desk. Your pipeline is always in sync.',
  },
];

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Minimal nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Sales CRM</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-colors"
          >
            Open Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <FloatingDots />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/50" />
        <div
          className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-sm text-teal-400 font-medium">AI-Powered Sales Agent</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Your AI Sales{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-300">
              Agent
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tell your bot who to find. It researches, drafts, and builds your pipeline. You close.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#demo"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-base transition-colors shadow-lg shadow-teal-500/20"
            >
              See it in action
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base transition-colors border border-slate-700"
            >
              Open Dashboard
            </Link>
          </div>
          <div className="mt-16">
            <a
              href="#how-it-works"
              className="inline-flex flex-col items-center text-slate-600 hover:text-teal-400 transition-colors"
            >
              <span className="text-xs mb-2">Scroll to explore</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Three steps to a full pipeline. No manual research. No copy-paste emails.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
                  )}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 hover:border-teal-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
                        0{idx + 1}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bot Demo Section */}
      <section id="demo" className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              See the Bot in Action
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Watch how the AI agent finds prospects, researches them, and builds your pipeline — all from a single message.
            </p>
          </div>
          <BotDemo />
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              From prospecting to closing, your AI agent handles the busy work.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-teal-500/30 hover:bg-slate-900/80 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                    <Icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to build your pipeline?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Let your AI agent do the prospecting. You focus on closing.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-lg transition-colors shadow-lg shadow-teal-500/20"
          >
            Open Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center">
          <p className="text-sm text-slate-600">
            Powered by <span className="text-teal-400 font-medium">Hermes AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
