import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle,
  XCircle,
  Edit,
  ExternalLink,
  Building
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

export default function RecruiterInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Reschedule / Edit Modal
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    scheduled_date: '',
    scheduled_time: '',
    mode: 'online',
    meeting_link: '',
    location: '',
    interviewer_notes: '',
    status: 'scheduled'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/interviews/my?status=${statusFilter}` : '/interviews/my';
      const res = await api.get(url);
      if (res.success) {
        setInterviews(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const openEditModal = (interview) => {
    setSelectedInterview(interview);
    setEditForm({
      scheduled_date: interview.scheduled_date ? interview.scheduled_date.split('T')[0] : '',
      scheduled_time: interview.scheduled_time || '',
      mode: interview.mode || 'online',
      meeting_link: interview.meeting_link || '',
      location: interview.location || '',
      interviewer_notes: interview.interviewer_notes || '',
      status: interview.status || 'scheduled'
    });
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/interviews/${selectedInterview.id}`, editForm);
      if (res.success) {
        setEditModalOpen(false);
        await fetchInterviews();
      }
    } catch (err) {
      alert(err.message || 'Failed to update interview');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    try {
      await api.put(`/interviews/${id}`, { status: newStatus });
      await fetchInterviews();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scheduled Interviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track interview logistics, meeting credentials, and interviewer evaluation notes.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {['', 'scheduled', 'completed', 'rescheduled', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Fetching scheduled interview rounds..." />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No interviews found"
          description="Schedule interviews directly from the Candidate Applications tab."
          icon={Calendar}
        />
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{item.candidate_name}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Position: {item.job_title} ({item.candidate_email})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Modify / Reschedule
                  </button>

                  {item.status === 'scheduled' && (
                    <button
                      onClick={() => handleQuickStatus(item.id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}

                  {item.status === 'scheduled' && (
                    <button
                      onClick={() => handleQuickStatus(item.id, 'cancelled')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Info Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">DATE</span>
                  <span className="font-bold text-slate-800">{formatDate(item.scheduled_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">TIME</span>
                  <span className="font-bold text-slate-800">{item.scheduled_time}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">MODE</span>
                  <span className="font-bold text-slate-800 capitalize">{item.mode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">MEETING LINK / VENUE</span>
                  {item.meeting_link ? (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold truncate block"
                    >
                      {item.meeting_link}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-700 truncate block">
                      {item.location || 'Not specified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {item.interviewer_notes && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">Your Evaluation Notes:</span>
                  <p className="text-slate-600">{item.interviewer_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modify Interview Details"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={editForm.scheduled_date}
                onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={editForm.scheduled_time}
                onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
              <select
                value={editForm.mode}
                onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting URL</label>
            <input
              type="url"
              value={editForm.meeting_link}
              onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Interviewer Notes / Instructions
            </label>
            <textarea
              rows={3}
              value={editForm.interviewer_notes}
              onChange={(e) => setEditForm({ ...editForm, interviewer_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              {submitting ? 'Saving...' : 'Update Interview'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
