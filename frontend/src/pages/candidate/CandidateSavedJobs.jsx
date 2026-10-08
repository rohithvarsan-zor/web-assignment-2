import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Building, MapPin, DollarSign, Trash2, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatSalary, formatDate } from '../../utils/formatters';

export default function CandidateSavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/saved-jobs?page=${page}&limit=10`);
      if (res.success) {
        setJobs(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [page]);

  const handleUnsave = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}/save`);
      setJobs(jobs.filter((j) => j.id !== jobId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Saved Job Bookmarks
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Positions you have bookmarked for review and future application.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12">
          <LoadingSpinner text="Loading saved bookmarks..." />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No saved jobs"
          description="Bookmark jobs while browsing to save them for easy reference."
          actionText="Search Open Roles"
          onAction={() => (window.location.href = '/jobs')}
          icon={Bookmark}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {job.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {job.company_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    {formatSalary(job.salary_min, job.salary_max)}
                  </span>
                  <span>Saved on {formatDate(job.saved_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUnsave(job.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link
                  to={`/jobs/${job.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  View & Apply <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
    </div>
  );
}
