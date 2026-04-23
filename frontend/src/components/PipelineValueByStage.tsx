'use client';

import { formatCurrency } from '@/lib/utils';
import { DollarSign, Package } from 'lucide-react';

interface PipelineValueByStageProps {
  data: Record<string, number>;
  dealCounts?: Record<string, number>;
}

const STAGE_ORDER = [
  'Discovery',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

const STAGE_COLORS: Record<string, string> = {
  Discovery: '#64748b',
  Qualification: '#3b82f6',
  Proposal: '#eab308',
  Negotiation: '#f97316',
  'Closed Won': '#22c55e',
  'Closed Lost': '#ef4444',
};

const STAGE_ICONS: Record<string, string> = {
  Discovery: '🔍',
  Qualification: '✓',
  Proposal: '📋',
  Negotiation: '🤝',
  'Closed Won': '🏆',
  'Closed Lost': '✕',
};

export default function PipelineValueByStage({ data, dealCounts }: PipelineValueByStageProps) {
  const chartData = STAGE_ORDER.map((stage) => ({
    name: stage,
    value: data[stage] || 0,
    count: dealCounts?.[stage] || 0,
    fill: STAGE_COLORS[stage] || '#64748b',
    icon: STAGE_ICONS[stage] || '•',
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const activePipeline = chartData
    .filter((d) => !['Closed Won', 'Closed Lost'].includes(d.name))
    .reduce((sum, d) => sum + d.value, 0);
  const wonValue = data['Closed Won'] || 0;
  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);

  if (totalValue === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-400" />
          Pipeline Value by Stage
        </h3>
        <p className="text-sm text-slate-500 text-center py-8">No deal data available</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-teal-400" />
          Pipeline Value by Stage
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400">
            Active: <span className="text-white font-medium">{formatCurrency(activePipeline)}</span>
          </span>
          <span className="text-slate-400">
            Won: <span className="text-green-400 font-medium">{formatCurrency(wonValue)}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {chartData.map((stage) => {
          const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const isClosed = stage.name === 'Closed Won' || stage.name === 'Closed Lost';

          return (
            <div key={stage.name} className="group">
              <div className="flex items-center gap-3">
                {/* Stage icon + name */}
                <div className="w-28 shrink-0 flex items-center gap-2">
                  <span className="text-sm">{stage.icon}</span>
                  <span className={`text-xs font-medium ${isClosed ? 'text-slate-400' : 'text-slate-300'}`}>
                    {stage.name}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-9 bg-slate-800/50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg flex items-center justify-between px-3 transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(widthPct, stage.value > 0 ? 8 : 2)}%`,
                      backgroundColor: stage.fill,
                      opacity: stage.value > 0 ? 0.9 : 0.15,
                    }}
                  >
                    {stage.value > 0 && (
                      <>
                        <span className="text-xs font-bold text-white whitespace-nowrap">
                          {formatCurrency(stage.value)}
                        </span>
                      </>
                    )}
                  </div>
                  {stage.value === 0 && (
                    <span className="absolute inset-0 flex items-center px-3 text-xs text-slate-600">
                      —
                    </span>
                  )}
                </div>

                {/* Deal count badge */}
                <div className="w-14 shrink-0 flex justify-end">
                  {stage.count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      <Package className="w-3 h-3" />
                      {stage.count}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">0</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline flow indicator */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STAGE_ORDER.map((stage, i) => (
              <div key={stage} className="flex items-center">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: (data[stage] || 0) > 0 ? STAGE_COLORS[stage] : '#334155',
                  }}
                />
                {i < STAGE_ORDER.length - 1 && (
                  <div
                    className="w-6 h-0.5 mx-0.5"
                    style={{
                      backgroundColor:
                        (data[stage] || 0) > 0 && (data[STAGE_ORDER[i + 1]] || 0) > 0
                          ? STAGE_COLORS[stage]
                          : '#334155',
                      opacity: 0.5,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {Object.values(dealCounts || data).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)} deals · {formatCurrency(totalValue)} total
          </p>
        </div>
      </div>
    </div>
  );
}
