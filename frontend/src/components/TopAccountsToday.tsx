'use client';

import Link from 'next/link';
import { ArrowRight, CalendarClock, Flame, Target, UserRound } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { TopAccount } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface TopAccountsTodayProps {
  accounts: TopAccount[];
}

function priorityClasses(priority: string) {
  if (priority === 'High') return 'bg-red-500/10 text-red-300 border-red-500/30';
  if (priority === 'Medium') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  return 'bg-slate-700/70 text-slate-300 border-slate-600';
}

function scoreBarClasses(priority: string) {
  if (priority === 'High') return 'bg-red-400';
  if (priority === 'Medium') return 'bg-amber-400';
  return 'bg-teal-400';
}

function formatActionDate(value: string | null) {
  if (!value) return 'No next action set';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TopAccountsToday({ accounts }: TopAccountsTodayProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 animate-slide-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-teal-400" />
            Top Accounts to Work Today
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Ranked by fit, urgency, sales readiness, and deal potential.
          </p>
        </div>
        <Link
          href="/prospects"
          className="text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
        >
          View all prospects
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          {accounts.map((account, index) => {
            const value = account.active_deal_value || account.deal_value || 0;
            return (
              <Link
                key={account.id}
                href={`/prospects/${account.id}`}
                className="group rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/70 hover:border-slate-700 transition-all p-4"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-teal-300 transition-colors">
                        {account.company}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {account.contact_title || account.contact_name || 'Contact needs verification'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full border ${priorityClasses(account.priority)}`}>
                    {account.priority}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Work score</span>
                    <span className="text-white font-semibold">{account.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreBarClasses(account.priority)}`}
                      style={{ width: `${Math.max(8, Math.min(account.score, 100))}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed min-h-[2.5rem]">
                  {account.reason}
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{account.next_action_type ? `${account.next_action_type}: ` : ''}{formatActionDate(account.next_action)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{account.contact_name || 'No contact name'}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  {account.status ? <StatusBadge status={account.status} /> : <span />}
                  <span className="text-xs font-medium text-slate-300">
                    {value ? formatCurrency(value, true) : 'No value'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
          <p className="text-sm text-slate-400">No accounts to prioritize yet.</p>
          <p className="text-xs text-slate-500 mt-1">Add research, next actions, or deal values to start ranking prospects.</p>
        </div>
      )}
    </div>
  );
}
