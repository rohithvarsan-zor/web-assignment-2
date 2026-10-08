import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Building,
  MapPin,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, formatSalary } from '../../utils/formatters';

export default function CandidateApplications() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/applications/my?${params.toString()}`);
      if (res.success) {
        setApplications(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdrawConfirm = async () => {
    if (!selectedApp) return;
    try {
      setWithdrawing(true);
      await api.delete(`/applications/${selectedApp.id}`);
      setWithdrawModalOpen(false);
      setSelectedApp(null);
      await fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  const statuses = [
    { label: 'All', value: '' },
    { label: 'Applied', value: 'applied' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Interview Scheduled', value: 'interview_scheduled' },
    { label: 'Selected', value: 'selected' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Withdrawn', value: 'withdrawn' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Applications
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review the status, screening stage, and interview details of your job submissions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {statuses.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Fetching your submitted applications..." />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          description={
            statusFilter
              ? `You don't have any applications marked as '${statusFilter.replace('_', ' ')}'.`
              : "You haven't applied to any open jobs yet."
          }
          actionText="Explore Jobs"
          onAction={() => (window.location.href = '/jobs')}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/jobs/${app.job_id}`}
                    className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {app.job_title}
                  </Link>
                  <StatusBadge status={app.status} />
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {app.company_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {app.job_location}
                  </span>
                  <span>{formatSalary(app.salary_min, app.salary_max)}</span>
                  <span>Applied on {formatDate(app.applied_at)}</span>
                </div>

                {/* Interview Highlight if scheduled */}
                {app.latest_interview && app.latest_interview.status === 'scheduled' && (
                  <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl inline-flex items-center gap-2 text-xs text-indigo-900">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>
                      Interview Scheduled on {formatDate(app.latest_interview.scheduled_date)} at{' '}
                      {app.latest_interview.scheduled_time} ({app.latest_interview.mode})
                    </span>
                    {app.latest_interview.meeting_link && (
                      <a
                        href={app.latest_interview.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-indigo-700 ml-1"
                      >
                        Join Link
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                  to={`/jobs/${app.job_id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Role
                </Link>

                {!['selected', 'rejected', 'withdrawn'].includes(app.status) && (
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setWithdrawModalOpen(true);
                    }}
                    className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Withdraw
                  </button>
                )}
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

      {/* Confirmation Dialog for Withdrawing */}
      <ConfirmDialog
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onConfirm={handleWithdrawConfirm}
        title="Withdraw Job Application?"
        message={`Are you sure you want to withdraw your application for "${selectedApp?.job_title}"? You will not be considered further for this opening.`}
        confirmText="Withdraw Application"
        isDestructive={true}
        loading={withdrawing}
      />
    </div>
  );
}
