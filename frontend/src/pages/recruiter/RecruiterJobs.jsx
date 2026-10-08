import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Search,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, formatSalary } from '../../utils/formatters';

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    isDestructive: false
  });
  const [dialogLoading, setDialogLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const res = await api.get(`/recruiter/jobs?${params.toString()}`);
      if (res.success) {
        setJobs(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handlePublish = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/publish`);
      await fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to publish job');
    }
  };

  const handleClose = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/close`);
      await fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to close job');
    }
  };

  const handleDelete = (job) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Draft Job?',
      message: `Are you sure you want to delete "${job.title}"? This cannot be undone.`,
      isDestructive: true,
      action: async () => {
        try {
          setDialogLoading(true);
          await api.delete(`/jobs/${job.id}`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await fetchJobs();
        } catch (err) {
          alert(err.message || 'Failed to delete job');
        } finally {
          setDialogLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Postings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your company's open requisitions, review candidate volumes, and modify postings.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/create"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Create New Job
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search job titles or locations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Loading job listings..." />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No job postings found"
          description={search || status ? 'No jobs match your search filters.' : "You haven't posted any jobs yet."}
          actionText="Create First Job"
          onAction={() => (window.location.href = '/recruiter/jobs/create')}
          icon={Briefcase}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.employment_type}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                    <span>•</span>
                    <span>Posted {formatDate(job.created_at)}</span>
                  </div>
                </div>

                {/* Candidate Pipeline Counter Badge */}
                <Link
                  to={`/recruiter/applications?job_id=${job.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors shrink-0"
                >
                  <Users className="w-4 h-4" />
                  <span>{job.total_applications || 0} Candidates</span>
                </Link>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span>
                    Deadline: <strong className="text-slate-700">{job.application_deadline ? formatDate(job.application_deadline) : 'Rolling'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Shortlisted: <strong className="text-purple-600">{job.shortlisted_count || 0}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Selected: <strong className="text-emerald-600">{job.selected_count || 0}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/recruiter/jobs/${job.id}/edit`}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>

                  {job.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(job.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}

                  {job.status === 'published' && (
                    <button
                      onClick={() => handleClose(job.id)}
                      className="px-3 py-1.5 border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Close Role
                    </button>
                  )}

                  {job.status === 'draft' && (
                    <button
                      onClick={() => handleDelete(job)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
            className="bg-white p-3 rounded-2xl border border-slate-200"
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        loading={dialogLoading}
      />
    </div>
  );
}
