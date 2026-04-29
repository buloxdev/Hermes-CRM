'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardList,
  Globe2,
  LayoutGrid,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import BotDemo from '@/components/BotDemo';

const orbitDots = [
  { left: '8%', top: '18%', size: 2, delay: 0, duration: 13, opacity: 0.22 },
  { left: '18%', top: '72%', size: 3, delay: 1.2, duration: 16, opacity: 0.16 },
  { left: '28%', top: '34%', size: 2, delay: 2.1, duration: 14, opacity: 0.18 },
  { left: '42%', top: '12%', size: 2, delay: 0.6, duration: 17, opacity: 0.18 },
  { left: '54%', top: '82%', size: 3, delay: 1.8, duration: 15, opacity: 0.14 },
  { left: '68%', top: '24%', size: 2, delay: 2.5, duration: 16, opacity: 0.2 },
  { left: '76%', top: '66%', size: 3, delay: 0.9, duration: 18, opacity: 0.16 },
  { left: '90%', top: '38%', size: 2, delay: 1.4, duration: 15, opacity: 0.2 },
];

function FloatingDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbitDots.map((dot, idx) => (
        <div
          key={idx}
          className="absolute rounded-full bg-teal-300"
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
          25% { transform: translateY(-18px) translateX(10px); }
          50% { transform: translateY(-8px) translateX(-12px); }
          75% { transform: translateY(-24px) translateX(6px); }
        }
      `}</style>
    </div>
  );
}

const stats = [
  { label: 'Pipeline view', value: 'Live CRM' },
  { label: 'Briefs', value: 'Daily' },
  { label: 'Source of truth', value: 'Notion' },
];

const steps = [
  {
    icon: MessageSquare,
    title: 'Prospect from the road',
    description: 'Send one plain-language request from chat. No desktop research session required.',
  },
  {
    icon: Brain,
    title: 'Research becomes pipeline',
    description: 'The agent qualifies accounts, captures notes, drafts outreach, and writes records to the CRM.',
  },
  {
    icon: BarChart3,
    title: 'Manage from the desk',
    description: 'Daily briefs, top accounts, deals, and activity history keep the next move obvious.',
  },
];

const features = [
  {
    icon: Search,
    title: 'Targeted prospect research',
    description: 'Find accounts that match retail, food and beverage, manufacturing, CPG, and automotive criteria.',
  },
  {
    icon: Mail,
    title: 'Review-ready outreach',
    description: 'Draft emails stay inside the CRM for manual review. Nothing gets sent automatically.',
  },
  {
    icon: ClipboardList,
    title: 'Daily Sales Brief',
    description: 'Overdue follow-ups, stale deals, closing dates, and draft reviews are surfaced first.',
  },
  {
    icon: LayoutGrid,
    title: 'Pipeline workspace',
    description: 'Prospects, deals, activities, and account priorities live in one focused sales cockpit.',
  },
];

const proofPoints = [
  'No fake contacts',
  'Manual send only',
  'Duplicate-aware CRM',
  'Notion-backed records',
];

function ProductVisual() {
  return (
    <div className="relative mt-14 lg:mt-0">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-teal-500/20 via-blue-500/10 to-violet-500/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400">
            sales-crm.local/dashboard
          </div>
        </div>
        <div className="bg-slate-950 p-2">
          <img
            src="/remotion-assets/dashboard.png"
            alt="Sales CRM dashboard preview showing daily brief, top accounts, and pipeline metrics"
            className="w-full rounded-[1.25rem] border border-white/10 object-cover"
          />
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-teal-400/20 bg-slate-950/90 p-4 shadow-xl shadow-black/30">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-teal-300">
            <Sparkles className="h-4 w-4" />
            Daily brief
          </div>
          <p className="text-2xl font-semibold text-white">7</p>
          <p className="text-xs text-slate-500">follow-ups due</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-xl shadow-black/30">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-300">
            <BarChart3 className="h-4 w-4" />
            Pipeline
          </div>
          <p className="text-2xl font-semibold text-white">$4.02M</p>
          <p className="text-xs text-slate-500">active value</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-xl shadow-black/30">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-300">
            <Truck className="h-4 w-4" />
            Road ready
          </div>
          <p className="text-2xl font-semibold text-white">Mobile</p>
          <p className="text-xs text-slate-500">ask now, review later</p>
        </div>
      </div>
    </div>
  );
}

function AgentWorkPreview() {
  return (
    <div className="aspect-video overflow-hidden rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.16),transparent_32%),#020617] p-4">
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/30">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10">
              <MessageSquare className="h-4 w-4 text-teal-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Agent</p>
              <p className="text-[11px] text-slate-500">Request</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">Ready</span>
        </div>
        <div className="space-y-3">
          <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-teal-400 px-3 py-2 text-xs font-medium leading-5 text-slate-950">
            Find Dallas accounts.
          </div>
          <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-5 text-slate-300">
            Researching. Drafting. Saving to CRM.
          </div>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
          {['Find', 'Draft', 'Save'].map((item, idx) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 h-1.5 rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-teal-300" style={{ width: `${95 - idx * 18}%` }} />
              </div>
              <p className="text-[11px] font-medium text-white">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RouteVisual() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Road to revenue</p>
          <p className="text-xs text-slate-500">One workflow, two surfaces</p>
        </div>
        <Navigation className="h-5 w-5 text-teal-300" />
      </div>
      <div className="relative grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <MapPin className="mb-4 h-5 w-5 text-teal-300" />
          <p className="text-sm font-medium text-white">Chat request</p>
          <p className="mt-1 text-xs text-slate-500">Dallas supply chain targets</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Brain className="mb-4 h-5 w-5 text-violet-300" />
          <p className="text-sm font-medium text-white">Agent research</p>
          <p className="mt-1 text-xs text-slate-500">Notes, KDMs, drafts</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Users className="mb-4 h-5 w-5 text-emerald-300" />
          <p className="text-sm font-medium text-white">CRM action</p>
          <p className="mt-1 text-xs text-slate-500">Briefs and next steps</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#08090a] text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 shadow-lg shadow-teal-500/10">
              <Zap className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-white">Sales CRM</span>
              <span className="block text-[11px] text-slate-500">AI prospecting command center</span>
            </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#workflow" className="hover:text-white">Workflow</a>
            <a href="#demo" className="hover:text-white">Demo</a>
            <a href="#screens" className="hover:text-white">Screens</a>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <section className="relative px-6 pb-24 pt-32 lg:pb-32 lg:pt-40">
        <FloatingDots />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(45,212,191,0.15),transparent_30%),radial-gradient(circle_at_80%_8%,rgba(129,140,248,0.16),transparent_28%),linear-gradient(to_bottom,#08090a,#08090a_62%,#0f172a)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div
            className={`transition-all duration-1000 ${
              visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              Built for reps who prospect between meetings
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#f7f8f8] sm:text-6xl lg:text-7xl">
              Prospect on the road. Manage at the desk.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
              Tell the agent what accounts to find, review the research, and work the pipeline from a CRM that tells you what to do next.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-500/20 transition-colors hover:bg-teal-300"
              >
                See the workflow
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
              >
                Open live CRM
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductVisual />
        </div>
      </section>

      <section id="workflow" className="relative border-y border-white/[0.06] bg-[#0b0c0e] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-medium text-teal-300">Built around the real sales day</p>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">A clean path from voice note to pipeline action.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-400">
              The product story is simple: capture intent anywhere, turn it into structured sales work, then prioritize the follow-up inside the CRM.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">0{idx + 1}</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10">
                      <Icon className="h-5 w-5 text-teal-300" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <RouteVisual />
          </div>
        </div>
      </section>

      <section id="demo" className="relative px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.12),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-sm text-teal-300">
              <MessageSquare className="h-4 w-4" />
              Live chat demo
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">One message turns into CRM-ready sales work.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              The demo shows the mobile-first motion: ask for prospects, let the agent build context, then review everything in the web app.
            </p>
          </div>
          <BotDemo />
        </div>
      </section>

      <section id="screens" className="border-y border-white/[0.06] bg-[#0b0c0e] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-3 text-sm font-medium text-teal-300">Product screens</p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">Real screens, cleanly presented.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                Each card uses an actual app screen with consistent scale, spacing, and captions so the product feels real.
              </p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-teal-300 hover:text-teal-200">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-xl shadow-black/20">
              <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950">
                <img
                  src="/remotion-assets/dashboard.png"
                  alt="Dashboard with Daily Sales Brief and Top Accounts"
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-white">Dashboard</p>
                <p className="mt-1 text-sm text-slate-500">Daily brief, top accounts, and pipeline metrics in one view.</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-xl shadow-black/20">
              <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950">
                <img
                  src="/remotion-assets/activities.png"
                  alt="Activities page showing sales activity log"
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-white">Activity history</p>
                <p className="mt-1 text-sm text-slate-500">Every call, email, note, and outcome stays searchable.</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-xl shadow-black/20">
              <AgentWorkPreview />
              <div className="p-4">
                <p className="text-sm font-semibold text-white">AI agent</p>
                <p className="mt-1 text-sm text-slate-500">Chat to CRM.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium text-teal-300">Why it matters</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">Less CRM theater. More action.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              The app does not just store records. It turns messy prospecting work into the next best move.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-teal-300" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 text-center shadow-2xl shadow-black/30 sm:p-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10">
            <ShieldCheck className="h-7 w-7 text-teal-300" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">Built for a credible sales demo.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Human-reviewed outreach, real CRM records, and clear guardrails so the demo feels useful instead of gimmicky.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {proofPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {point}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/agent"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
            >
              Try AI Agent
              <Globe2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <p>Sales CRM, built with Hermes AI</p>
          <p>Prospect on the road, manage at the desk</p>
        </div>
      </footer>
    </div>
  );
}
