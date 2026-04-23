'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getProspect, updateProspect, createActivity, createDeal,
  ProspectDetail, Activity, Deal,
} from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import ActivityTimeline from '@/components/ActivityTimeline';
import VoiceDictate from '@/components/VoiceDictate';
import { useToast } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Mail, Phone, Globe, Calendar,
  DollarSign, Target, FileText, Send, Plus, Loader2, AlertCircle,
  X, Edit3, Save, Briefcase,
} from 'lucide-react';

const STATUS_OPTIONS = ['New Lead', 'Researched', 'Email Drafted', 'Sent', 'Replied', 'Meeting Set', 'Lost'];
const ACTION_TYPES = ['', 'Email', 'Call', 'LinkedIn', 'Meeting'];
const ACTIVITY_TYPES = ['Call', 'Email', 'LinkedIn', 'Meeting', 'Other'];

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { showToast } = useToast();

  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');

  // Activity form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity: '',
    type: 'Email',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    outcome: '',
  });

  // Deal form
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealForm, setDealForm] = useState({
    deal_name: '',
    stage: 'Discovery',
    estimated_value: 0,
    close_date: '',
    competitors: '',
    notes: '',
  });

  const loadProspect = async () => {
    try {
      const data = await getProspect(id);
      setProspect(data);
      setEmailDraft(data.draft_email || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load prospect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspect();
  }, [id]);

  const handleStatusChange = async (status: string) => {
    try {
      await updateProspect(id, { status });
      showToast('Status updated');
      loadProspect();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveEmail = async () => {
    try {
      await updateProspect(id, { draft_email: emailDraft });
      setEditingEmail(false);
      showToast('Draft email saved');
      loadProspect();
    } catch (err: any) {
      showToast(err.message || 'Failed to save email', 'error');
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createActivity({ ...activityForm, prospect_id: id });
      setActivityForm({ activity: '', type: 'Email', date: new Date().toISOString().split('T')[0], notes: '', outcome: '' });
      setShowActivityForm(false);
      showToast('Activity logged');
      loadProspect();
    } catch (err: any) {
      showToast(err.message || 'Failed to log activity', 'error');
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDeal({ ...dealForm, prospect_id: id });
      setDealForm({ deal_name: '', stage: 'Discovery', estimated_value: 0, close_date: '', competitors: '', notes: '' });
      setShowDealForm(false);
      showToast('Deal created');
      loadProspect();
    } catch (err: any) {
      showToast(err.message || 'Failed to create deal', 'error');
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    try {
      await updateProspect(id, { [field]: value });
      showToast('Saved');
      loadProspect();
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Prospect not found</h2>
        <p className="text-sm text-slate-400">{error || 'Could not load prospect details.'}</p>
        <Link href="/prospects" className="mt-4 text-teal-400 hover:text-teal-300 text-sm">
          Back to prospects
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
        <Link href="/prospects" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{prospect.company}</h1>
            <StatusBadge status={prospect.status} />
          </div>
          <p className="text-sm text-slate-400 mt-1">{prospect.contact_name} &middot; {prospect.contact_title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Info & Research */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm text-white">{prospect.contact_name || '—'}</p>
                  <p className="text-xs text-slate-500">{prospect.contact_title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-500" />
                <p className="text-sm text-white">{prospect.company}</p>
              </div>
              {prospect.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <a href={`mailto:${prospect.contact_email}`} className="text-sm text-teal-400 hover:text-teal-300">
                    {prospect.contact_email}
                  </a>
                </div>
              )}
              {prospect.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <a href={`tel:${prospect.contact_phone}`} className="text-sm text-teal-400 hover:text-teal-300">
                    {prospect.contact_phone}
                  </a>
                </div>
              )}
              {prospect.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-400 hover:text-teal-300">
                    {prospect.website}
                  </a>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Industry</span>
                <span className="text-slate-300">{prospect.industry || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Revenue</span>
                <span className="text-slate-300">{prospect.revenue || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Employees</span>
                <span className="text-slate-300">{prospect.employee_count || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-300">{prospect.source || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Deal Value</span>
                <span className="text-teal-400 font-medium">
                  {formatCurrency(prospect.deal_value)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Win Probability</span>
                <span className="text-slate-300">{prospect.win_probability || '—'}</span>
              </div>
            </div>

            {/* Status selector */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
              <select
                value={prospect.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={selectClass + " w-full"}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-slate-800">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Decision Makers */}
          {prospect.key_decision_makers && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Decision Makers</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{prospect.key_decision_makers}</p>
            </div>
          )}

          {/* Next Action */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Next Action</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={prospect.next_action ? prospect.next_action.split('T')[0] : ''}
                  onChange={(e) => handleUpdateField('next_action', e.target.value || null)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select
                  value={prospect.next_action_type || ''}
                  onChange={(e) => handleUpdateField('next_action_type', e.target.value)}
                  className={selectClass + " w-full"}
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-800">{t || 'None'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Research Notes, Draft Email */}
        <div className="space-y-6">
          {/* Research Notes */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Research Notes</h3>
            {prospect.research_notes ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {prospect.research_notes}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">No research notes yet.</p>
            )}
          </div>

          {/* Draft Email */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Draft Email</h3>
              {editingEmail ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingEmail(false)} className="text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button onClick={handleSaveEmail} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingEmail(true)} className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            {editingEmail ? (
              <textarea
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className={`${inputClass} h-64 resize-none`}
                placeholder="Write your email draft..."
              />
            ) : prospect.draft_email ? (
              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {prospect.draft_email}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No draft email yet.</p>
            )}
          </div>

          {/* Related Deals */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Related Deals</h3>
              <button
                onClick={() => setShowDealForm(!showDealForm)}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
              >
                <Plus className="w-3 h-3" /> Add Deal
              </button>
            </div>

            {showDealForm && (
              <form onSubmit={handleCreateDeal} className="mb-4 p-4 bg-slate-800/50 rounded-lg space-y-3">
                <input
                  required
                  type="text"
                  placeholder="Deal Name *"
                  value={dealForm.deal_name}
                  onChange={(e) => setDealForm({ ...dealForm, deal_name: e.target.value })}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={dealForm.stage}
                    onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                    className={selectClass + " w-full"}
                  >
                    <option value="Discovery" className="bg-slate-800">Discovery</option>
                    <option value="Qualification" className="bg-slate-800">Qualification</option>
                    <option value="Proposal" className="bg-slate-800">Proposal</option>
                    <option value="Negotiation" className="bg-slate-800">Negotiation</option>
                    <option value="Closed Won" className="bg-slate-800">Closed Won</option>
                    <option value="Closed Lost" className="bg-slate-800">Closed Lost</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Value"
                    value={dealForm.estimated_value || ''}
                    onChange={(e) => setDealForm({ ...dealForm, estimated_value: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <input
                  type="date"
                  value={dealForm.close_date}
                  onChange={(e) => setDealForm({ ...dealForm, close_date: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Competitors..."
                  value={dealForm.competitors}
                  onChange={(e) => setDealForm({ ...dealForm, competitors: e.target.value })}
                  className={inputClass}
                />
                <textarea
                  placeholder="Notes..."
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  className={`${inputClass} h-20 resize-none`}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowDealForm(false)} className="text-xs text-slate-400 hover:text-white px-2 py-1">
                    Cancel
                  </button>
                  <button type="submit" className="text-xs text-teal-400 hover:text-teal-300 px-2 py-1">
                    Create
                  </button>
                </div>
              </form>
            )}

            {prospect.deals && prospect.deals.length > 0 ? (
              <div className="space-y-2">
                {prospect.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href="/deals"
                    className="flex items-start gap-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm text-white">{deal.deal_name}</p>
                        {deal.estimated_value > 0 && (
                          <span className="text-sm text-teal-400 font-medium whitespace-nowrap">
                            {formatCurrency(deal.estimated_value)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{deal.stage}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : !showDealForm && (
              <p className="text-sm text-slate-500 italic">No deals linked yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Activity Timeline + Log Activity */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Activity Timeline</h3>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
              >
                <Plus className="w-3 h-3" /> Log Activity
              </button>
            </div>

            {showActivityForm && (
              <form onSubmit={handleLogActivity} className="mb-6 p-4 bg-slate-800/50 rounded-lg space-y-3">
                <input
                  required
                  type="text"
                  placeholder="Activity name *"
                  value={activityForm.activity}
                  onChange={(e) => setActivityForm({ ...activityForm, activity: e.target.value })}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    className={selectClass + " w-full"}
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-slate-800">{t}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={activityForm.date}
                    onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <VoiceDictate
                  value={activityForm.notes}
                  onChange={(val) => setActivityForm({ ...activityForm, notes: val })}
                  placeholder="Notes..."
                  className={`${inputClass} h-20 resize-none pb-10`}
                />
                <textarea
                  placeholder="Outcome..."
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                  className={`${inputClass} h-16 resize-none`}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowActivityForm(false)} className="text-xs text-slate-400 hover:text-white px-2 py-1">
                    Cancel
                  </button>
                  <button type="submit" className="text-xs text-teal-400 hover:text-teal-300 px-2 py-1">
                    Log
                  </button>
                </div>
              </form>
            )}

            <ActivityTimeline activities={prospect.activities || []} allowEdit onChange={loadProspect} />
          </div>
        </div>
      </div>
    </div>
  );
}
