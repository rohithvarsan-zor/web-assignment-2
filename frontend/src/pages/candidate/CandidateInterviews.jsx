import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Building,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

export default function CandidateInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notes Modal State
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews/my');
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
  }, []);

  const openNotesModal = (interview) => {
    setSelectedInterview(interview);
    setCandidateNotes(interview.candidate_notes || '');
    setModalOpen(true);
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    try {
      setSavingNotes(true);
      const res = await api.put(`/interviews/${selectedInterview.id}`, {
        candidate_notes: candidateNotes
      });
      if (res.success) {
        setInterviews(
          interviews.map((i) =>
            i.id === selectedInterview.id ? { ...i, candidate_notes: candidateNotes } : i
          )
        );
        setModalOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Scheduled Interviews
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review interview dates, access video meeting links, and manage your preparation notes.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Fetching your scheduled interviews..." />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No interviews scheduled"
          description="When recruiters schedule interviews for your applications, they will appear here."
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
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{item.job_title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {item.company_name} • Recruiter: {item.recruiter_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openNotesModal(item)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Prep Notes
                  </button>
                  {item.meeting_link && (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" /> Enter Meeting
                    </a>
                  )}
                </div>
              </div>

              {/* Details Row */}
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
                  <span className="text-slate-400 block font-medium">LOCATION / LINK</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {item.mode === 'online' ? item.meeting_link || 'Online Video' : item.location || 'In-Person'}
                  </span>
                </div>
              </div>

              {/* Interviewer Notes (if provided by recruiter) */}
              {item.interviewer_notes && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">
                    Recruiter Instructions:
                  </span>
                  <p className="text-slate-600">{item.interviewer_notes}</p>
                </div>
              )}

              {/* Candidate Notes (Personal Preparation) */}
              {item.candidate_notes && (
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs">
                  <span className="font-semibold text-blue-900 block mb-0.5">
                    Your Preparation Notes:
                  </span>
                  <p className="text-blue-800">{item.candidate_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Candidate Notes Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Candidate Preparation Notes"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveNotes} className="space-y-4">
          <p className="text-xs text-slate-500">
            Write private thoughts, questions you want to ask the interviewer, or key talking points.
          </p>

          <textarea
            rows={5}
            placeholder="e.g. Ask about system architecture, deployment frequency, team size..."
            value={candidateNotes}
            onChange={(e) => setCandidateNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingNotes}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
