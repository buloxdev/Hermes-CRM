'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface PipelineFunnelProps {
  data: Record<string, number>;
}

const STAGES_ORDER = [
  'Discovery',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

const COLORS: Record<string, string> = {
  'New Lead': '#64748b',
  'Researched': '#3b82f6',
  'Email Drafted': '#eab308',
  'Sent': '#f97316',
  'Replied': '#22c55e',
  'Meeting Set': '#a855f7',
};

export default function PipelineFunnel({ data }: PipelineFunnelProps) {
  const funnelData = STAGES_ORDER.map((stage) => ({
    name: stage,
    count: data[stage] || 0,
    fill: COLORS[stage] || '#64748b',
  }));

  const hasData = funnelData.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pipeline Funnel</h3>
        <p className="text-sm text-slate-500 text-center py-8">No pipeline data yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...funnelData.map((d) => d.count));

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Pipeline Funnel</h3>
      <div className="space-y-2">
        {funnelData.map((stage, index) => {
          if (stage.count === 0) return null;
          const widthPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          // Find previous stage that actually has count > 0
          let prevCount = stage.count;
          for (let i = index - 1; i >= 0; i--) {
            if (funnelData[i].count > 0) {
              prevCount = funnelData[i].count;
              break;
            }
          }
          const conversionRate = index > 0 && prevCount > 0
            ? Math.min(Math.round((stage.count / prevCount) * 100), 100)
            : 100;
          const isFirst = index === 0;

          let ConversionIcon = Minus;
          let conversionColor = 'text-slate-500';
          if (!isFirst) {
            if (conversionRate >= 80) {
              ConversionIcon = TrendingUp;
              conversionColor = 'text-green-400';
            } else if (conversionRate < 50) {
              ConversionIcon = TrendingDown;
              conversionColor = 'text-red-400';
            }
          }

          return (
            <div key={stage.name}>
              {!isFirst && (
                <div className="flex items-center justify-center py-1">
                  <div className="flex items-center gap-1 text-xs">
                    <ConversionIcon className={`w-3 h-3 ${conversionColor}`} />
                    <span className={conversionColor}>{conversionRate}%</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex justify-center">
                  <div
                    className="h-10 rounded-lg flex items-center justify-between px-4 transition-all duration-500"
                    style={{
                      width: `${Math.max(widthPct, 15)}%`,
                      backgroundColor: stage.fill,
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {stage.name}
                    </span>
                    <span className="text-xs font-bold text-white ml-2">{stage.count}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>{funnelData.reduce((sum, d) => sum + d.count, 0)} total prospects</span>
        <span>
          {funnelData.length > 1
            ? `${Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)}% overall conversion`
            : 'Start moving prospects through the pipeline'}
        </span>
      </div>
    </div>
  );
}
