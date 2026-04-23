'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDeal, updateDeal, createActivity, DealDetail } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import ActivityTimeline from '@/components/ActivityTimeline';
import Link from 'next/link';
import {
  ArrowLeft, DollarSign, Calendar, Building2,
  Edit3, Save, Loader2, AlertCircle,
  Plus, X, Send,
} from 'lucide-react';

const STAGE_OPTIONS = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const STAGE_COLORS: Record<string, string> = {
  Discovery: 'bg-blue-500/20 text-blue-400',
  Qualification: 'bg-cyan-500/20 text-cyan-400',
  Proposal: 'bg-yellow-500/20 text-yellow-400',
  Negotiation: 'bg-orange-500/20 text-orange-400',
  'Closed Won': 'bg-green-500/20 text-green-400',
  'Closed Lost': 'bg-red-500/20 text-red-400',
};

const ACTIVITY_TYPES = ['Email', 'Call', 'LinkedIn', 'Meeting', 'Note'];
const OUTCOME_OPTIONS = ['', 'Positive', 'Neutral', 'No Response', 'Declined', 'Replied', 'Connected', 'Confirmed'];

export default function DealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();

  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [editingCompetitors, setEditingCompetitors] = useState(false);
  const [competitorsDraft, setCompetitorsDraft] = useState('');

  // Log activity form
  const [showLogForm, setShowLogForm] = useState(false);
  const [logActivity, setLogActivity] = useState('');
  const [logType, setLogType] = useState('Email');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');
  const [logOutcome, setLogOutcome] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  const loadDeal = async () => {
    try {
      const data = await getDeal(id);
      setDeal(data);
      setNotesDraft(data.notes || '');
      setCompetitorsDraft(data.competitors || '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeal();
  }, [id]);

  const handleStageChange = async (stage: string) => {
    try {
      await updateDeal(id, { stage });
      showToast('Stage updated');
      loadDeal();
    } catch (err: any) {
      showToast(err.message || 'Failed to update stage', 'error');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateDeal(id, { notes: notesDraft });
      setEditingNotes(false);
      showToast('Notes saved');
      loadDeal();
    } catch (err: any) {
      showToast(err.message || 'Failed to save notes', 'error');
    }
  };

  const handleSaveCompetitors = async () => {
    try {
      await updateDeal(id, { competitors: competitorsDraft });
      setEditingCompetitors(false);
      showToast('Competitors saved');
      loadDeal();
    } catch (err: any) {
      showToast(err.message || 'Failed to save competitors', 'error');
    }
  };

  const handleUpdateValue = async (value: number) => {
    try {
      await updateDeal(id, { estimated_value: value });
      showToast('Value updated');
      loadDeal();
    } catch (err: any) {
      showToast(err.message || 'Failed to update value', 'error');
    }
  };

  const handleUpdateCloseDate = async (date: string) => {
    try {
      await updateDeal(id, { close_date: date || null });
      showToast('Close date updated');
      loadDeal();
    } catch (err: any) {
      showToast(err.message || 'Failed to update close date', 'error');
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logActivity.trim()) {
      showToast('Activity name is required', 'error');
      return;
    }
    setLogSubmitting(true);
    try {
      await createActivity({
        activity: logActivity.trim(),
        type: logType,
        date: logDate || null,
        notes: logNotes.trim() || null,
        outcome: logOutcome || null,
        deal_id: id,
        prospect_id: deal?.prospect?.id || null,
      });
      showToast('Activity logged');
      setShowLogForm(false);
      setLogActivity('');
      setLogType('Email');
      setLogDate(new Date().toISOString().split('T')[0]);
      setLogNotes('');
      setLogOutcome('');
      loadDeal();
    } catch (err: any) {
      showToast(err.message || 'Failed to log activity', 'error');
    } finally {
      setLogSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Deal not found</h2>
        <p className="text-sm text-slate-400">{error || 'Could not load deal details.'}</p>
        <Link href="/deals" className="mt-4 text-teal-400 hover:text-teal-300 text-sm">
          Back to deals
        </Link>
      </div>
    );
  }

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500";
  const selectClass = "bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/deals" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{deal.deal_name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage] || 'bg-slate-700 text-slate-400'}`}>
              {deal.stage}
            </span>
          </div>
          {deal.prospect_name && (
            <p className="text-sm text-slate-400 mt-1">
              {deal.prospect_name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deal Info */}
        <div className="space-y-6">
          {/* Deal Details Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Deal Details</h3>

            <div className="space-y-4">
              {/* Stage */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Stage</label>
                <select
                  value={deal.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className={selectClass + " w-full"}
                >
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-slate-800">{s}</option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Estimated Value</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    defaultValue={deal.estimated_value || 0}
                    onBlur={(e) => handleUpdateValue(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Close Date */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Close Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={deal.close_date ? deal.close_date.split('T')[0] : ''}
                    onChange={(e) => handleUpdateCloseDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Competitors */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Competitors</h3>
              {editingCompetitors ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingCompetitors(false)} className="text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button onClick={handleSaveCompetitors} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingCompetitors(true)} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            {editingCompetitors ? (
              <textarea
                value={competitorsDraft}
                onChange={(e) => setCompetitorsDraft(e.target.value)}
                className={`${inputClass} h-24 resize-none`}
                placeholder="Who are you competing against?"
              />
            ) : deal.competitors ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{deal.competitors}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">No competitors listed.</p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Notes</h3>
              {editingNotes ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingNotes(false)} className="text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button onClick={handleSaveNotes} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className={`${inputClass} h-32 resize-none`}
                placeholder="Add notes about this deal..."
              />
            ) : deal.notes ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{deal.notes}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">No notes yet.</p>
            )}
          </div>

          {/* Linked Prospect */}
          {deal.prospect && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Linked Prospect</h3>
              <Link
                href={`/prospects/${deal.prospect.id}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                    {deal.prospect.company}
                  </p>
                  <p className="text-xs text-slate-400">{deal.prospect.contact_name} &middot; {deal.prospect.contact_title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    {deal.prospect.industry && <span>{deal.prospect.industry}</span>}
                    {deal.prospect.revenue && <span>{deal.prospect.revenue}</span>}
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-600 rotate-180 group-hover:text-teal-400 transition-colors flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Activity Timeline</h3>
              {!showLogForm && (
                <button
                  onClick={() => setShowLogForm(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Activity
                </button>
              )}
            </div>

            {showLogForm && (
              <form onSubmit={handleLogActivity} className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Log New Activity</h4>
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Activity</label>
                    <input
                      type="text"
                      value={logActivity}
                      onChange={(e) => setLogActivity(e.target.value)}
                      placeholder="e.g. Follow-up call with buyer"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Type</label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      className={selectClass + " w-full"}
                    >
                      {ACTIVITY_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-slate-800">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Outcome</label>
                    <select
                      value={logOutcome}
                      onChange={(e) => setLogOutcome(e.target.value)}
                      className={selectClass + " w-full"}
                    >
                      {OUTCOME_OPTIONS.map((o) => (
                        <option key={o} value={o} className="bg-slate-800">{o || 'None'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Notes</label>
                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="What happened?"
                    className={`${inputClass} h-20 resize-none`}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={logSubmitting}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                  >
                    {logSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Save Activity
                  </button>
                </div>
              </form>
            )}

            <ActivityTimeline activities={deal.activities || []} allowEdit onChange={loadDeal} />
          </div>
        </div>
      </div>
    </div>
  );
}
