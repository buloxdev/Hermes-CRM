'use client';

export default function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    'New Lead': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    'Researched': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Email Drafted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Sent': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Replied': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Meeting Set': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Lost': 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const dotColor: Record<string, string> = {
    'New Lead': 'bg-slate-400',
    'Researched': 'bg-blue-400',
    'Email Drafted': 'bg-yellow-400',
    'Sent': 'bg-orange-400',
    'Replied': 'bg-green-400',
    'Meeting Set': 'bg-purple-400',
    'Lost': 'bg-red-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}
