'use client';

import { LucideIcon } from 'lucide-react';

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
    <div className={`rounded-xl bg-gradient-to-br ${accentClasses[accent] || accentClasses.teal} border p-6 hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
            <Icon className="w-6 h-6 text-slate-300" />
          </div>
        )}
      </div>
    </div>
  );
}
