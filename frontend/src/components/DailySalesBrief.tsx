'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MailCheck,
  Sparkles,
} from 'lucide-react';
import { createActivity, DailyBriefItem, updateProspect } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

interface DailySalesBriefProps {
  items: DailyBriefItem[];
  onActionComplete?: () => void;
}

function priorityClasses(priority: string) {
  if (priority === 'High') return 'bg-red-500/10 text-red-300 border-red-500/30';
  if (priority === 'Medium') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  return 'bg-slate-700/70 text-slate-300 border-slate-600';
}

function itemIcon(type: string) {
  if (type === 'deal') return Briefcase;
  if (type === 'outreach') return MailCheck;
  if (type === 'hygiene') return ClipboardList;
  return CalendarClock;
}

function itemIconClasses(priority: string) {
  if (priority === 'High') return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (priority === 'Medium') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
}

function getRecordTarget(href: string) {
  const match = href.match(/^\/(prospects|deals)\/([^/?#]+)/);
  if (!match) return null;
  return { kind: match[1] as 'prospects' | 'deals', id: match[2] };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function quickActionLabel(item: DailyBriefItem) {
  if (item.title.toLowerCase().includes('draft')) return 'Mark reviewed';
  if (item.title.toLowerCase().includes('next action')) return 'Snooze 1 day';
  if (item.type === 'deal') return 'Log review';
  if (item.type === 'outreach') return 'Mark reviewed';
  return 'Log touch';
}

function quickActivityType(item: DailyBriefItem) {
  if (item.type === 'outreach') return 'Email';
  return 'Note';
}

export default function DailySalesBrief({ items, onActionComplete }: DailySalesBriefProps) {
  const { showToast } = useToast();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const highCount = items.filter((item) => item.priority === 'High').length;
  const headline = items.length
    ? `${items.length} focus areas${highCount ? `, ${highCount} high priority` : ''}`
    : 'Pipeline is clean for today';

  const handleQuickAction = async (item: DailyBriefItem) => {
    const target = getRecordTarget(item.href);
    if (!target) {
      showToast('Open the record to work this item', 'info');
      return;
    }

    setWorkingId(item.id);
    try {
      if (quickActionLabel(item) === 'Snooze 1 day' && target.kind === 'prospects') {
        await updateProspect(target.id, { next_action: tomorrowIso() });
        showToast('Next action moved to tomorrow');
      } else {
        await createActivity({
          activity: `${quickActionLabel(item)} from daily brief`,
          type: quickActivityType(item),
          date: todayIso(),
          notes: `${item.title}: ${item.subtitle}`,
          outcome: 'Reviewed from dashboard brief',
          prospect_id: target.kind === 'prospects' ? target.id : undefined,
          deal_id: target.kind === 'deals' ? target.id : undefined,
        });
        showToast(`${quickActionLabel(item)} logged`);
      }
      onActionComplete?.();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 animate-slide-up">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Today&apos;s Brief
          </div>
          <h3 className="text-xl font-semibold text-white">{headline}</h3>
          <p className="text-sm text-slate-400 mt-1">
            Prioritized from next actions, close dates, stale activity, and outreach readiness.
          </p>
        </div>
        <Link
          href="/activities"
          className="text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
        >
          View activity log
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {items.map((item, index) => {
            const Icon = itemIcon(item.type);
            const actionLabel = quickActionLabel(item);
            const isWorking = workingId === item.id;

            return (
              <div
                key={item.id}
                className="group rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/70 hover:border-slate-700 transition-all p-4 animate-slide-up flex flex-col"
                style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${itemIconClasses(item.priority)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full border ${priorityClasses(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold leading-none text-white tabular-nums">{item.count}</span>
                  <h4 className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors leading-tight">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[2.5rem]">
                  {item.subtitle}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAction(item)}
                    disabled={isWorking}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2 text-xs font-medium text-teal-300 hover:bg-teal-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {actionLabel}
                  </button>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Open record
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-green-500/20 bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">No urgent work flagged.</p>
            <p className="text-xs text-slate-400 mt-1">Keep prospecting or review the top accounts below.</p>
          </div>
        </div>
      )}
    </div>
  );
}
