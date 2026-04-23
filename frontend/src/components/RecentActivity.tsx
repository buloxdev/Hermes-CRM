'use client';

import Link from 'next/link';
import { Activity } from '@/lib/api';
import { Mail, Phone, Calendar, MessageSquare, Linkedin, FileText, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

interface RecentActivityProps {
  activities: Activity[];
}

const typeIcons: Record<string, React.ReactNode> = {
  Email: <Mail className="w-4 h-4" />,
  Call: <Phone className="w-4 h-4" />,
  Meeting: <Calendar className="w-4 h-4" />,
  LinkedIn: <Linkedin className="w-4 h-4" />,
  Note: <FileText className="w-4 h-4" />,
  Other: <MessageSquare className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  Email: 'text-blue-400 bg-blue-400/10',
  Call: 'text-amber-400 bg-amber-400/10',
  Meeting: 'text-purple-400 bg-purple-400/10',
  LinkedIn: 'text-sky-400 bg-sky-400/10',
  Note: 'text-slate-400 bg-slate-400/10',
  Other: 'text-slate-400 bg-slate-400/10',
};

// High-priority activity types that should bubble up
const HIGH_PRIORITY_TYPES = ['Meeting', 'Call'];
const HIGH_PRIORITY_OUTCOMES = ['positive', 'interested', 'scheduled', 'accepted', 'replied'];

function isHighPriority(activity: Activity): boolean {
  if (HIGH_PRIORITY_TYPES.includes(activity.type)) return true;
  if (activity.outcome && HIGH_PRIORITY_OUTCOMES.some((o) => activity.outcome.toLowerCase().includes(o))) return true;
  return false;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    return [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities]);

  const highlights = useMemo(() => sorted.filter(isHighPriority).slice(0, 3), [sorted]);
  const rest = useMemo(() => sorted.filter((a) => !isHighPriority(a)), [sorted]);
  const visibleRest = showAll ? rest : rest.slice(0, 4);

  if (activities.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Clock className="w-8 h-8 mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Highlights</span>
          </div>
          <div className="space-y-2">
            {highlights.map((activity) => (
              <ActivityRow key={`hl-${activity.id}`} activity={activity} highlighted />
            ))}
          </div>
        </div>
      )}

      {/* Divider if both sections exist */}
      {highlights.length > 0 && rest.length > 0 && (
        <div className="border-t border-slate-800 my-3" />
      )}

      {/* Rest of activity */}
      {rest.length > 0 && (
        <div>
          {highlights.length > 0 && (
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">All Activity</p>
          )}
          <div className="space-y-2">
            {visibleRest.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
          {rest.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-teal-400 transition-colors mx-auto"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Show {rest.length - 4} more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity, highlighted = false }: { activity: Activity; highlighted?: boolean }) {
  const colorClass = typeColors[activity.type] || typeColors.Other;

  return (
    <div
      className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
        highlighted ? 'bg-amber-500/5 border border-amber-500/10' : 'hover:bg-slate-800/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {typeIcons[activity.type] || typeIcons.Other}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{activity.activity}</p>
          {activity.outcome && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                activity.outcome.toLowerCase().includes('positive') ||
                activity.outcome.toLowerCase().includes('interested') ||
                activity.outcome.toLowerCase().includes('scheduled')
                  ? 'bg-green-500/10 text-green-400'
                  : activity.outcome.toLowerCase().includes('negative') ||
                    activity.outcome.toLowerCase().includes('rejected')
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {activity.outcome}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {activity.deal_name && (
            <Link
              href={`/deals/${activity.deal_id}`}
              className="text-xs text-teal-400 hover:text-teal-300 truncate"
            >
              {activity.deal_name}
            </Link>
          )}
          {activity.prospect_company && !activity.deal_name && (
            <Link
              href={`/prospects/${activity.prospect_id}`}
              className="text-xs text-teal-400 hover:text-teal-300 truncate"
            >
              {activity.prospect_company}
            </Link>
          )}
          <span className="text-xs text-slate-500 flex-shrink-0">{formatDate(activity.date)}</span>
        </div>
        {activity.notes && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{activity.notes}</p>
        )}
      </div>
    </div>
  );
}
