'use client';

import Link from 'next/link';
import { Prospect } from '@/lib/api';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { Building2, Mail, Phone, Globe, DollarSign, Users } from 'lucide-react';

interface ProspectTableProps {
  prospects: Prospect[];
  onStatusChange?: (id: string, status: string) => void;
}

const STATUS_OPTIONS = [
  'New Lead', 'Researched', 'Email Drafted', 'Sent', 'Replied', 'Meeting Set', 'Lost',
];

export default function ProspectTable({ prospects, onStatusChange }: ProspectTableProps) {
  if (prospects.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No prospects found</h3>
        <p className="text-sm text-slate-400">Try adjusting your filters or add a new prospect.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Industry</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deal Value</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Next Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {prospects.map((prospect) => (
              <tr
                key={prospect.id}
                className="hover:bg-slate-800/40 transition-colors duration-150 group"
              >
                <td className="px-6 py-4">
                  <Link href={`/prospects/${prospect.id}`} className="block">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                          {prospect.company}
                        </p>
                        {prospect.website && (
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{prospect.website}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/prospects/${prospect.id}`} className="block">
                    <p className="text-sm text-white">{prospect.contact_name || '—'}</p>
                    <p className="text-xs text-slate-500">{prospect.contact_title || ''}</p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {onStatusChange ? (
                    <select
                      value={prospect.status}
                      onChange={(e) => onStatusChange(prospect.id, e.target.value)}
                      className="bg-transparent text-xs cursor-pointer focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={prospect.status} />
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">{prospect.industry || '—'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">{prospect.revenue || '—'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(prospect.deal_value)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {prospect.next_action ? (
                    <div>
                      <p className="text-sm text-white">
                        {new Date(prospect.next_action).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {prospect.next_action_type && (
                        <p className="text-xs text-slate-500">{prospect.next_action_type}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
