'use client';

import { useEffect, useState } from 'react';
import { getDashboard, DashboardData, Prospect, UpcomingClose } from '@/lib/api';
import StatCard from '@/components/StatCard';
import PipelineFunnel from '@/components/PipelineFunnel';
import PipelineValueByStage from '@/components/PipelineValueByStage';
import RecentActivity from '@/components/RecentActivity';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  CalendarCheck,
  Mail,
  DollarSign,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const d = await getDashboard();
        setData(d);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
        <p className="text-sm text-slate-400">{error || 'Could not connect to the API.'}</p>
        <p className="text-xs text-slate-500 mt-2">Make sure the backend is running at http://localhost:8000</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Your sales pipeline at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Prospects"
          value={data.total_prospects}
          icon={Users}
          accent="teal"
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(data.total_pipeline_value || 0)}
          accent="blue"
        />
        <StatCard
          title="Meetings Set"
          value={data.meetings_set}
          icon={CalendarCheck}
          accent="purple"
        />
        <StatCard
          title="Emails Sent"
          value={data.emails_sent}
          icon={Mail}
          accent="green"
        />
      </div>

      {/* Main Content: Funnel + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnel data={data.prospects_by_status} />
        <RecentActivity activities={data.recent_activities} />
      </div>

      {/* Pipeline Value by Stage */}
      <PipelineValueByStage
        data={data.total_deal_value_by_stage || {}}
        dealCounts={data.deal_counts_by_stage}
      />

      {/* Upcoming Actions + Upcoming Closes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Actions */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              Upcoming Actions
            </h3>
          </div>
          {data.upcoming_actions && data.upcoming_actions.length > 0 ? (
            <div className="space-y-3">
              {data.upcoming_actions.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Users className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                        {prospect.company}
                      </p>
                      <p className="text-xs text-slate-400">{prospect.contact_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {prospect.next_action_type && (
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                        {prospect.next_action_type}
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-white">
                        {new Date(prospect.next_action!).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No upcoming actions scheduled</p>
          )}
        </div>

        {/* Upcoming Closes */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              Upcoming Closes
            </h3>
          </div>
          {data.upcoming_closes && data.upcoming_closes.length > 0 ? (
            <div className="space-y-3">
              {data.upcoming_closes.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                        {deal.deal_name}
                      </p>
                      <p className="text-xs text-slate-400">{deal.prospect_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {deal.stage && (
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                        {deal.stage}
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-sm text-white">
                        {new Date(deal.close_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {deal.estimated_value ? formatCurrency(deal.estimated_value) : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No upcoming closes</p>
          )}
        </div>
      </div>
    </div>
  );
}
