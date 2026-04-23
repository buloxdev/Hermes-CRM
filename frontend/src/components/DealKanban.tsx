'use client';

import { useState } from 'react';
import { Deal } from '@/lib/api';
import { updateDeal } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Building2, Calendar, DollarSign, GripVertical, Users } from 'lucide-react';

interface DealKanbanProps {
  deals: Deal[];
  onDealUpdated?: () => void;
}

const STAGES = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const stageColors: Record<string, string> = {
  Discovery: 'border-blue-500/30',
  Qualification: 'border-cyan-500/30',
  Proposal: 'border-yellow-500/30',
  Negotiation: 'border-orange-500/30',
  'Closed Won': 'border-green-500/30',
  'Closed Lost': 'border-red-500/30',
};

const stageBadgeColors: Record<string, string> = {
  Discovery: 'bg-blue-500/20 text-blue-400',
  Qualification: 'bg-cyan-500/20 text-cyan-400',
  Proposal: 'bg-yellow-500/20 text-yellow-400',
  Negotiation: 'bg-orange-500/20 text-orange-400',
  'Closed Won': 'bg-green-500/20 text-green-400',
  'Closed Lost': 'bg-red-500/20 text-red-400',
};

export default function DealKanban({ deals, onDealUpdated }: DealKanbanProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const { showToast } = useToast();

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<string, Deal[]>);

  const totalByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = dealsByStage[stage].reduce((sum, d) => sum + (d.estimated_value || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const handleDragStart = (dealId: string) => {
    setDragging(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!dragging) return;
    try {
      await updateDeal(dragging, { stage });
      showToast(`Deal moved to ${stage}`);
      onDealUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to move deal', 'error');
    }
    setDragging(null);
  };

  const handleMoveDeal = async (dealId: string, newStage: string) => {
    try {
      await updateDeal(dealId, { stage: newStage });
      showToast(`Deal moved to ${newStage}`);
      onDealUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to move deal', 'error');
    }
  };

  if (deals.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No deals yet</h3>
        <p className="text-sm text-slate-400">Create a deal from a prospect detail page.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <div
          key={stage}
          className={`flex-shrink-0 w-72 bg-slate-900/50 rounded-xl border ${stageColors[stage]} p-4`}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(stage)}
        >
          {/* Column header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadgeColors[stage]}`}>
                {stage}
              </span>
              <span className="text-xs text-slate-500">{dealsByStage[stage].length}</span>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {formatCurrency(totalByStage[stage])}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3 min-h-[100px]">
            {dealsByStage[stage].map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                draggable
                onDragStart={() => handleDragStart(deal.id)}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-teal-500/30 transition-all cursor-grab active:cursor-grabbing group block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                    {deal.deal_name}
                  </h4>
                  <GripVertical className="w-4 h-4 text-slate-600" />
                </div>

                {deal.prospect_company && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                    <Building2 className="w-3 h-3" />
                    {deal.prospect_company}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  {deal.estimated_value > 0 && (
                    <div className="flex items-center gap-1 text-teal-400 font-medium">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(deal.estimated_value)}
                    </div>
                  )}
                  {deal.close_date && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(deal.close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Move buttons */}
                <div className="mt-3 pt-3 border-t border-slate-700 flex gap-1 flex-wrap">
                  {STAGES.filter(s => s !== stage).map((s) => (
                    <button
                      key={s}
                      onClick={(e) => { e.preventDefault(); handleMoveDeal(deal.id, s); }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                    >
                      {s.split(' ').map(w => w[0]).join('')}
                    </button>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
