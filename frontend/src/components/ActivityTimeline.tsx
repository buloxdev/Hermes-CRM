'use client';

import { useState } from 'react';
import { Activity, updateActivity, deleteActivity } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import {
  Mail, Phone, Calendar, MessageSquare, Linkedin, FileText, Clock,
  Pencil, Trash2, X, Check, Loader2,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
  allowEdit?: boolean;
  onChange?: () => void;
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
  Email: 'text-blue-400 bg-blue-500/10',
  Call: 'text-green-400 bg-green-500/10',
  Meeting: 'text-purple-400 bg-purple-500/10',
  LinkedIn: 'text-sky-400 bg-sky-500/10',
  Note: 'text-yellow-400 bg-yellow-500/10',
  Other: 'text-slate-400 bg-slate-500/10',
};

const ACTIVITY_TYPES = ['Email', 'Call', 'LinkedIn', 'Meeting', 'Note', 'Other'];

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
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

export default function ActivityTimeline({ activities, allowEdit = false, onChange }: ActivityTimelineProps) {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Activity>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditForm({
      activity: activity.activity,
      type: activity.type,
      date: activity.date,
      notes: activity.notes,
      outcome: activity.outcome,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await updateActivity(id, editForm);
      showToast('Activity updated');
      setEditingId(null);
      onChange?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to update activity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteActivity(id);
      showToast('Activity deleted');
      onChange?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete activity', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No activities recorded yet</p>
      </div>
    );
  }

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500";
  const selectClass = "bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none";

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        const isEditing = editingId === activity.id;
        const isDeleting = deletingId === activity.id;
        const colorClass = typeColors[activity.type] || typeColors.Other;

        return (
          <div key={activity.id} className="flex gap-4 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                {typeIcons[activity.type] || typeIcons.Other}
              </div>
              {idx < activities.length - 1 && (
                <div className="w-px h-full bg-slate-800 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.activity || ''}
                    onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })}
                    className={inputClass}
                    placeholder="Activity name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editForm.type || ''}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className={selectClass + ' w-full'}
                    >
                      {ACTIVITY_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-slate-800">{t}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={editForm.date ? editForm.date.split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Notes"
                    className={`${inputClass} h-16 resize-none`}
                  />
                  <input
                    type="text"
                    value={editForm.outcome || ''}
                    onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })}
                    placeholder="Outcome"
                    className={inputClass}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(activity.id)}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1.5 transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">{activity.activity}</h4>
                    {allowEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(activity)}
                          className="p-1 text-slate-500 hover:text-teal-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          disabled={isDeleting}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{activity.type}</span>
                    <span className="text-xs text-slate-500">{formatDate(activity.date)}</span>
                  </div>
                  {activity.notes && (
                    <p className="text-sm text-slate-400 mt-1">{activity.notes}</p>
                  )}
                  {activity.outcome && (
                    <div className="mt-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-500 font-medium">Outcome:</span> {activity.outcome}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
