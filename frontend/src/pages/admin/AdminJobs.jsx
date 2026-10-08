import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search, Filter, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, formatSalary } from '../../utils/formatters';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null
  });
  const [dialogLoading, setDialogLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await api.get(`/admin/jobs?${params.toString()}`);
      if (res.success) {
        setJobs(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handlePublish = async (id) => {
    try {
      await api.post(`/jobs/${id}/publish`);
      await fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to publish');
    }
  };

  const handleClose = async (id) => {
    try {
      await api.post(`/jobs/${id}/close`);
      await fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to close');
    }
  };

  const handleDelete = (job) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Job Posting?',
      message: `Permanently delete "${job.title}" by ${job.company_name}? This will remove all associated applications.`,
      action: async () => {
        try {
          setDialogLoading(true);
          await api.delete(`/jobs/${job.id}`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await fetchJobs();
        } catch (err) {
          alert(err.message || 'Failed to delete');
        } finally {
          setDialogLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Job Requisitions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor and administer all postings across all registered enterprise recruiters.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by job title or recruiter company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-auto">
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

      {/* Jobs Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Loading platform job directory..." />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description="Try modifying search keywords or status filters."
          icon={Briefcase}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Title & Location</th>
                  <th className="py-3.5 px-4">Company & Recruiter</th>
                  <th className="py-3.5 px-4">Type & Salary</th>
                  <th className="py-3.5 px-4">Applicants</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 block text-sm"
                      >
                        {job.title}
                      </Link>
                      <span className="text-slate-500 text-[11px]">{job.location}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{job.company_name || '—'}</p>
                      <p className="text-[11px] text-slate-400">{job.recruiter_name}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-700">{job.employment_type}</p>
                      <p className="text-emerald-700 font-semibold text-[11px]">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        {job.applications_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={job.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {job.status !== 'published' && (
                          <button
                            onClick={() => handlePublish(job.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer"
                            title="Publish Job"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'published' && (
                          <button
                            onClick={() => handleClose(job.id)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg cursor-pointer"
                            title="Close Job"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={true}
        loading={dialogLoading}
      />
    </div>
  );
}
