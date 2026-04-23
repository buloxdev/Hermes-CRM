'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProspects, updateProspect, createProspect, Prospect } from '@/lib/api';
import ProspectTable from '@/components/ProspectTable';
import FilterBar from '@/components/FilterBar';
import { Plus, Loader2, AlertCircle, X } from 'lucide-react';

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [revenueFilter, setRevenueFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New prospect modal
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProspect, setNewProspect] = useState({
    company: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    industry: '',
    revenue: '',
    status: 'New Lead',
  });

  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProspects({
        status: statusFilter || undefined,
        industry: industryFilter || undefined,
        revenue: revenueFilter || undefined,
        search: searchQuery || undefined,
      });
      setProspects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, industryFilter, revenueFilter, searchQuery]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateProspect(id, { status });
      loadProspects();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProspect(newProspect);
      setShowNewForm(false);
      setNewProspect({
        company: '', contact_name: '', contact_title: '', contact_email: '',
        contact_phone: '', website: '', industry: '', revenue: '', status: 'New Lead',
      });
      loadProspects();
    } catch (err) {
      console.error('Failed to create prospect:', err);
    }
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500";
  const selectClass = "w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospects</h1>
          <p className="text-sm text-slate-400 mt-1">
            {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Prospect
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        statusFilter={statusFilter}
        industryFilter={industryFilter}
        revenueFilter={revenueFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onIndustryChange={setIndustryFilter}
        onRevenueChange={setRevenueFilter}
        onSearchChange={setSearchQuery}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      ) : (
        <ProspectTable prospects={prospects} onStatusChange={handleStatusChange} />
      )}

      {/* New Prospect Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Add New Prospect</h2>
              <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProspect} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Company *</label>
                  <input
                    required
                    type="text"
                    value={newProspect.company}
                    onChange={(e) => setNewProspect({ ...newProspect, company: e.target.value })}
                    className={inputClass}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={newProspect.contact_name}
                    onChange={(e) => setNewProspect({ ...newProspect, contact_name: e.target.value })}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contact Title</label>
                  <input
                    type="text"
                    value={newProspect.contact_title}
                    onChange={(e) => setNewProspect({ ...newProspect, contact_title: e.target.value })}
                    className={inputClass}
                    placeholder="VP of Sales"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newProspect.contact_email}
                    onChange={(e) => setNewProspect({ ...newProspect, contact_email: e.target.value })}
                    className={inputClass}
                    placeholder="john@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newProspect.contact_phone}
                    onChange={(e) => setNewProspect({ ...newProspect, contact_phone: e.target.value })}
                    className={inputClass}
                    placeholder="+1 555-0100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Website</label>
                  <input
                    type="url"
                    value={newProspect.website}
                    onChange={(e) => setNewProspect({ ...newProspect, website: e.target.value })}
                    className={inputClass}
                    placeholder="https://acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Industry</label>
                  <select
                    value={newProspect.industry}
                    onChange={(e) => setNewProspect({ ...newProspect, industry: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="Retail">Retail</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Consumer Goods">Consumer Goods</option>
                    <option value="Automotive">Automotive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Revenue</label>
                  <select
                    value={newProspect.revenue}
                    onChange={(e) => setNewProspect({ ...newProspect, revenue: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="$100M-200M">$100M-200M</option>
                    <option value="$200M-500M">$200M-500M</option>
                    <option value="$500M-1B">$500M-1B</option>
                    <option value="$1B-5B">$1B-5B</option>
                    <option value="$5B+">$5B+</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
