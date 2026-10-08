import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Clock
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ScheduleInterviewModal from '../../components/interviews/ScheduleInterviewModal';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

export default function RecruiterApplications() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [jobId, setJobId] = useState(searchParams.get('job_id') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Modal States
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState(null);

  const [candidateDetailModalOpen, setCandidateDetailModalOpen] = useState(false);
  const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);

  // Fetch recruiter's jobs for the filter dropdown
  useEffect(() => {
    const fetchJobsList = async () => {
      try {
        const res = await api.get('/recruiter/jobs?limit=50');
        if (res.success && res.data) {
          setJobs(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchJobsList();
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (jobId) params.append('job_id', jobId);
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const res = await api.get(`/recruiter/applications?${params.toString()}`);
      if (res.success) {
        setApplications(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, jobId, status, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      if (selectedCandidateApp && selectedCandidateApp.id === appId) {
        setSelectedCandidateApp((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update application status');
    }
  };

  const openInterviewModal = (app) => {
    setSelectedAppForInterview(app);
    setInterviewModalOpen(true);
  };

  const openCandidateDetail = (app) => {
    setSelectedCandidateApp(app);
    setCandidateDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Applicant Tracking System
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review candidates, progress hiring statuses, inspect resumes, and coordinate interviews.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Job Filter */}
          <select
            value={jobId}
            onChange={(e) => {
              setJobId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Job Roles</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Stages</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Applications Table (Section 17) */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Loading candidate applications..." />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          description={
            search || jobId || status
              ? 'No applicants match the current filter parameters.'
              : 'Candidates will appear here as soon as they submit applications to your jobs.'
          }
          icon={Users}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Job Opening</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Resume</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Candidate */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {app.candidate_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <button
                            onClick={() => openCandidateDetail(app)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                          >
                            {app.candidate_name}
                          </button>
                          <p className="text-[11px] text-slate-400">{app.candidate_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Job */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {app.job_title}
                    </td>

                    {/* Applied Date */}
                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(app.applied_at)}
                    </td>

                    {/* Status Badge + Change Dropdown */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={app.status} />
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="under_review">Under Review</option>
                          <option value="shortlisted">Shortlist</option>
                          <option value="interview_scheduled">Interview</option>
                          <option value="selected">Select</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                    </td>

                    {/* Resume */}
                    <td className="py-4 px-4">
                      {app.resume_url ? (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openCandidateDetail(app)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openInterviewModal(app)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Schedule Interview"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Interview
                        </button>

                        {app.status !== 'shortlisted' && app.status !== 'selected' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'shortlisted')}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                            title="Shortlist Candidate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
            className="p-4 border-t border-slate-100"
          />
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        application={selectedAppForInterview}
        onSuccess={() => {
          fetchApplications();
        }}
      />

      {/* Candidate Profile Details Modal */}
      <Modal
        isOpen={candidateDetailModalOpen}
        onClose={() => setCandidateDetailModalOpen(false)}
        title="Candidate Profile & Application"
        maxWidth="max-w-2xl"
      >
        {selectedCandidateApp && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCandidateApp.candidate_name}
                </h3>
                <p className="text-xs text-slate-500">{selectedCandidateApp.candidate_email}</p>
                <p className="text-xs text-slate-500">
                  Phone: {selectedCandidateApp.candidate_phone || 'N/A'} • Location: {selectedCandidateApp.candidate_location || 'N/A'}
                </p>
              </div>
              <StatusBadge status={selectedCandidateApp.status} />
            </div>

            {/* Application Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">APPLIED FOR</span>
                <span className="font-bold text-slate-800">{selectedCandidateApp.job_title}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">SUBMISSION DATE</span>
                <span className="font-bold text-slate-800">
                  {formatDate(selectedCandidateApp.applied_at)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">EXPERIENCE</span>
                <span className="font-bold text-slate-800">
                  {selectedCandidateApp.candidate_experience || 0} years
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">QUALIFICATION</span>
                <span className="font-bold text-slate-800 truncate block">
                  {selectedCandidateApp.candidate_qualification || 'Degree not specified'}
                </span>
              </div>
            </div>

            {/* Cover Letter */}
            {selectedCandidateApp.cover_letter && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Cover Letter:</span>
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line border border-slate-100">
                  {selectedCandidateApp.cover_letter}
                </div>
              </div>
            )}

            {/* Resume Button */}
            {selectedCandidateApp.resume_url && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Candidate Resume Document</span>
                </div>
                <a
                  href={selectedCandidateApp.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </a>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCandidateDetailModalOpen(false);
                  openInterviewModal(selectedCandidateApp);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule Interview
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedCandidateApp.id, 'shortlisted')}
                  className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Shortlist
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedCandidateApp.id, 'rejected')}
                  className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
