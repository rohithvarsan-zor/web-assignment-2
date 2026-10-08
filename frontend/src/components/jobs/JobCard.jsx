import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Bookmark, Building, ChevronRight } from 'lucide-react';
import { formatSalary, formatRelativeTime } from '../../utils/formatters';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function JobCard({ job, onSaveToggle }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(job.isSaved || false);
  const [saving, setSaving] = useState(false);

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.role !== 'candidate') {
      alert('Please log in as a candidate to save jobs.');
      return;
    }

    try {
      setSaving(true);
      if (isSaved) {
        await api.delete(`/jobs/${job.id}/save`);
        setIsSaved(false);
      } else {
        await api.post(`/jobs/${job.id}/save`);
        setIsSaved(true);
      }
      if (onSaveToggle) onSaveToggle(job.id, !isSaved);
    } catch (err) {
      console.error('Save job toggle error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0 overflow-hidden">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div>
              <Link
                to={`/jobs/${job.id}`}
                className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
              >
                {job.title}
              </Link>
              <p className="text-sm font-medium text-slate-600 mt-0.5">
                {job.company_name || 'Hiring Enterprise'}
              </p>
            </div>
          </div>

          {/* Bookmark Button */}
          {user?.role === 'candidate' && (
            <button
              onClick={handleSaveToggle}
              disabled={saving}
              className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Badges / Meta row */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 mr-1 text-slate-500" /> {job.employment_type}
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 -mr-1" />
            {formatSalary(job.salary_min, job.salary_max)}
          </span>
        </div>

        {/* Short description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Skills Tag Pills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {job.skills.slice(0, 4).map((s) => (
              <span
                key={s.id || s.name}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700"
              >
                {s.name}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-400">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / Apply Link */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Posted {formatRelativeTime(job.created_at)}</span>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
        >
          View Details <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
