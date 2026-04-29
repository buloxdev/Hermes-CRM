'use client';

import { useEffect, useMemo, useState } from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { Activity, getActivities } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  Activity as ActivityIcon,
  AlertCircle,
  CalendarCheck,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  Sparkles,
} from 'lucide-react';

const ACTIVITY_TYPES = ['All', 'Email', 'Call', 'LinkedIn', 'Meeting', 'Note', 'Other'];

function isThisWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return date >= weekAgo && date <= now;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');

  async function loadActivities() {
    try {
      setError(null);
      const data = await getActivities();
      setActivities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    const term = query.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesType = type === 'All' || activity.type === type;
      const haystack = [
        activity.activity,
        activity.type,
        activity.notes,
        activity.outcome,
        activity.prospect_name,
        activity.prospect_company,
        activity.deal_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      return matchesType && matchesQuery;
    });
  }, [activities, query, type]);

  const stats = useMemo(() => {
    const meetings = activities.filter((a) => a.type === 'Meeting').length;
    const calls = activities.filter((a) => a.type === 'Call').length;
    const emails = activities.filter((a) => a.type === 'Email').length;
    const thisWeek = activities.filter((a) => isThisWeek(a.date)).length;
    return { meetings, calls, emails, thisWeek };
  }, [activities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load activities</h2>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activities</h1>
          <p className="text-sm text-slate-400 mt-1">Every call, email, note, and meeting across the pipeline</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-sm text-teal-300">
          <Sparkles className="w-4 h-4" />
          <span>{formatNumber(filteredActivities.length)} shown</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="This Week" value={stats.thisWeek} icon={<ActivityIcon className="w-5 h-5" />} />
        <MetricCard label="Emails" value={stats.emails} icon={<Mail className="w-5 h-5" />} />
        <MetricCard label="Calls" value={stats.calls} icon={<Phone className="w-5 h-5" />} />
        <MetricCard label="Meetings" value={stats.meetings} icon={<CalendarCheck className="w-5 h-5" />} />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activities, notes, outcomes, prospects, or deals"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </label>
          <label className="relative block">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              {ACTIVITY_TYPES.map((activityType) => (
                <option key={activityType} value={activityType} className="bg-slate-800">
                  {activityType === 'All' ? 'All activity types' : activityType}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <ActivityTimeline activities={filteredActivities} allowEdit onChange={loadActivities} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatNumber(value)}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300">
          {icon}
        </div>
      </div>
    </div>
  );
}
