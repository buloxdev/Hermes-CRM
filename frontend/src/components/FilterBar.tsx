'use client';

interface FilterBarProps {
  statusFilter: string;
  industryFilter: string;
  revenueFilter: string;
  searchQuery: string;
  onStatusChange: (v: string) => void;
  onIndustryChange: (v: string) => void;
  onRevenueChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

const STATUSES = ['', 'New Lead', 'Researched', 'Email Drafted', 'Sent', 'Replied', 'Meeting Set', 'Lost'];
const INDUSTRIES = ['', 'Retail', 'Food & Beverage', 'Manufacturing', 'Consumer Goods', 'Automotive'];
const REVENUES = ['', '$100M-200M', '$200M-500M', '$500M-1B', '$1B-5B', '$5B+'];

export default function FilterBar({
  statusFilter, industryFilter, revenueFilter, searchQuery,
  onStatusChange, onIndustryChange, onRevenueChange, onSearchChange,
}: FilterBarProps) {
  const selectClass = "bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer";
  const inputClass = "bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="Search company or contact..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`${inputClass} w-64`}
      />
      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
        <option value="">All Statuses</option>
        {STATUSES.filter(Boolean).map((s) => (
          <option key={s} value={s} className="bg-slate-800">{s}</option>
        ))}
      </select>
      <select value={industryFilter} onChange={(e) => onIndustryChange(e.target.value)} className={selectClass}>
        <option value="">All Industries</option>
        {INDUSTRIES.filter(Boolean).map((i) => (
          <option key={i} value={i} className="bg-slate-800">{i}</option>
        ))}
      </select>
      <select value={revenueFilter} onChange={(e) => onRevenueChange(e.target.value)} className={selectClass}>
        <option value="">All Revenue</option>
        {REVENUES.filter(Boolean).map((r) => (
          <option key={r} value={r} className="bg-slate-800">{r}</option>
        ))}
      </select>
    </div>
  );
}
