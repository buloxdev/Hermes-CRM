'use client';

import Link from 'next/link';
import { Prospect } from '@/lib/api';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { Building2, ArrowRight } from 'lucide-react';

interface ProspectCardProps {
  prospect: Prospect;
}

export default function ProspectCard({ prospect }: ProspectCardProps) {
  return (
    <Link href={`/prospects/${prospect.id}`} className="block">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-teal-500/30 hover:bg-slate-800/60 transition-all duration-200 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
                {prospect.company}
              </h3>
              <p className="text-xs text-slate-400">{prospect.contact_name}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors mt-1" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={prospect.status} />
          {prospect.industry && (
            <span className="text-xs text-slate-500">{prospect.industry}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {prospect.revenue || 'No revenue set'}
          </span>
          {prospect.deal_value > 0 && (
            <span className="text-teal-400 font-medium">
              {formatCurrency(prospect.deal_value)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
