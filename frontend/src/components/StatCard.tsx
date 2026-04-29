'use client';

import { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, accent = 'teal' }: StatCardProps) {
  const accentClasses: Record<string, string> = {
    teal: 'from-teal-500/20 to-teal-600/10 border-teal-500/20 text-teal-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400',
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${accentClasses[accent] || accentClasses.teal} border p-4 min-h-[132px] transition-colors duration-200 animate-fade-in`}>
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
            {title}
          </p>
          {Icon && (
            <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-950/35 border border-white/10 flex items-center justify-center">
              <Icon className="w-[18px] h-[18px] text-slate-200" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[1.65rem] 2xl:text-3xl leading-none font-bold text-white tracking-tight tabular-nums whitespace-nowrap">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          <p className="text-xs text-slate-400 mt-2 h-4 truncate">
            {subtitle || ''}
          </p>
        </div>
      </div>
    </div>
  );
}
