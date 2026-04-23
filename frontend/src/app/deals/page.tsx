'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDeals, getProspects, createDeal, Deal, Prospect } from '@/lib/api';
import DealKanban from '@/components/DealKanban';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(false);
  const [newDeal, setNewDeal] = useState({
    deal_name: '',
    stage: 'Discovery',
    estimated_value: 0,
    close_date: '',
    competitors: '',
    notes: '',
    prospect_id: '',
  });

  const { showToast } = useToast();

  const loadDeals = useCallback(async () => {
    try {
      const data = await getDeals();
      setDeals(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const loadProspects = async () => {
    setProspectsLoading(true);
    try {
      const data = await getProspects();
      setProspects(data);
    } catch (err) {
      console.error('Failed to load prospects:', err);
    } finally {
      setProspectsLoading(false);
    }
  };

  const openNewDealForm = () => {
    setShowNewForm(true);
    loadProspects();
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDeal(newDeal);
      setShowNewForm(false);
      setNewDeal({
        deal_name: '',
        stage: 'Discovery',
        estimated_value: 0,
        close_date: '',
        competitors: '',
        notes: '',
        prospect_id: '',
      });
      showToast('Deal created');
      loadDeals();
    } catch (err: any) {
      showToast(err.message || 'Failed to create deal', 'error');
    }
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500";
  const selectClass = "w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none";

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
        <h2 className="text-xl font-semibold text-white mb-2">Failed to load deals</h2>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          <p className="text-sm text-slate-400 mt-1">
            {deals.length} deal{deals.length !== 1 ? 's' : ''} in pipeline
          </p>
        </div>
        <button
          onClick={openNewDealForm}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Deal
        </button>
      </div>

      {/* Kanban Board */}
      <DealKanban deals={deals} onDealUpdated={loadDeals} />

      {/* New Deal Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Add New Deal</h2>
              <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDeal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Deal Name *</label>
                <input
                  required
                  type="text"
                  value={newDeal.deal_name}
                  onChange={(e) => setNewDeal({ ...newDeal, deal_name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Southeast Lanes Contract"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Stage</label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                    className={selectClass}
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Qualification">Qualification</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Estimated Value</label>
                  <input
                    type="number"
                    value={newDeal.estimated_value || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, estimated_value: Number(e.target.value) })}
                    className={inputClass}
                    placeholder="500000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Close Date</label>
                <input
                  type="date"
                  value={newDeal.close_date}
                  onChange={(e) => setNewDeal({ ...newDeal, close_date: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Linked Prospect *</label>
                <select
                  required
                  value={newDeal.prospect_id}
                  onChange={(e) => setNewDeal({ ...newDeal, prospect_id: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Select a prospect...</option>
                  {prospectsLoading ? (
                    <option value="" disabled>Loading prospects...</option>
                  ) : (
                    prospects.map((p) => (
                      <option key={p.id} value={p.id}>{p.company}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Competitors</label>
                <input
                  type="text"
                  value={newDeal.competitors}
                  onChange={(e) => setNewDeal({ ...newDeal, competitors: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. JB Hunt, Werner"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  className={`${inputClass} h-20 resize-none`}
                  placeholder="Internal notes..."
                />
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
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
