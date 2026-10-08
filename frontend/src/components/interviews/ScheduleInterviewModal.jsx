import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../api/client';

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  application,
  onSuccess
}) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [mode, setMode] = useState('online');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!scheduledDate) {
      setError('Please select an interview date');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/interviews', {
        application_id: application.id,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        mode,
        meeting_link: meetingLink || undefined,
        location: location || undefined,
        interviewer_notes: interviewerNotes || undefined
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Interview: ${application.candidate_name || 'Candidate'}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-slate-800">Job: {application.job_title}</p>
          <p className="text-slate-500">Applicant: {application.candidate_name} ({application.candidate_email})</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Interview Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Time *
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Interview Mode *
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="online">Online (Video Call)</option>
            <option value="offline">In-Person (Office)</option>
            <option value="phone">Phone Screening</option>
          </select>
        </div>

        {mode === 'online' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meeting URL (Google Meet / Zoom / Teams)
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/xyz-abc"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Interview Location / Contact Info
            </label>
            <input
              type="text"
              placeholder="e.g. Conference Room 3B, Apex HQ"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Interviewer Notes / Instructions
          </label>
          <textarea
            rows={3}
            placeholder="Focus on systems design and previous distributed systems experience..."
            value={interviewerNotes}
            onChange={(e) => setInterviewerNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            {submitting ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
