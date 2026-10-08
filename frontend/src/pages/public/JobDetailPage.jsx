import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Building,
  Bookmark,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ArrowLeft
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatSalary, formatDate, formatRelativeTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState(null);

  // Apply Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/jobs/${id}`);
        if (res.success && res.data) {
          setJob(res.data);
          setIsSaved(res.data.isSaved);
          setHasApplied(res.data.hasApplied);
          setApplication(res.data.application);
        }
      } catch (err) {
        setError(err.message || 'Job not found');
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetail();
  }, [id]);

  const handleSaveToggle = async () => {
    if (!user || user.role !== 'candidate') {
      alert('Please log in as a candidate to save jobs.');
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/jobs/${id}/save`);
        setIsSaved(false);
      } else {
        await api.post(`/jobs/${id}/save`);
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');

    // Check if candidate has a resume
    if (!profile?.resume_url) {
      setApplyError('You must upload a resume to your profile before applying.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/applications', {
        job_id: parseInt(id, 10),
        cover_letter: coverLetter
      });

      if (res.success) {
        setApplySuccess(true);
        setHasApplied(true);
        setApplication(res.data);
        setTimeout(() => {
          setApplyModalOpen(false);
          setApplySuccess(false);
        }, 1500);
      }
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingSpinner text="Loading position details..." />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Job Opening Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'This job could not be found.'}</p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Job Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Jobs
        </Link>
      </div>

      {/* Main Job Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0 overflow-hidden shadow-xs">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-base font-semibold text-slate-600 mt-1">
                {job.company_name || 'Hiring Enterprise'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user?.role === 'candidate' && (
              <button
                onClick={handleSaveToggle}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
                title={isSaved ? 'Saved' : 'Save Job'}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}

            {!user ? (
              <Link
                to="/login"
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs text-center transition-colors"
              >
                Sign In to Apply
              </Link>
            ) : user.role === 'candidate' ? (
              hasApplied ? (
                <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" /> Applied ({application?.status})
                </div>
              ) : (
                <button
                  onClick={() => setApplyModalOpen(true)}
                  disabled={job.status !== 'published'}
                  className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Apply Now
                </button>
              )
            ) : (
              <div className="text-xs text-slate-400 italic">
                Logged in as {user.role} (Candidate action only)
              </div>
            )}
          </div>
        </div>

        {/* Quick Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">LOCATION</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> {job.location}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">SALARY</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              {formatSalary(job.salary_min, job.salary_max)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">TYPE</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> {job.employment_type}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">EXPERIENCE</span>
            <div className="text-xs font-bold text-slate-800">
              {job.experience_required || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Applied Status Notice Banner */}
      {hasApplied && application && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                You applied for this position on {formatDate(application.applied_at)}
              </p>
              <p className="text-xs text-slate-600">
                Current status:{' '}
                <span className="font-bold text-blue-700 uppercase">{application.status}</span>
              </p>
            </div>
          </div>
          <Link
            to="/candidate/applications"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
          >
            Track Application →
          </Link>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Description & Skills */}
        <div className="lg:col-span-2 space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">About the Role</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Required Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span
                    key={s.id || s.name}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Company Info & Deadline */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Company Overview
            </h3>

            <div>
              <p className="text-base font-bold text-slate-800">{job.company_name}</p>
              {job.company_description && (
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {job.company_description}
                </p>
              )}
            </div>

            {job.company_website && (
              <a
                href={job.company_website}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Visit Company Website ↗
              </a>
            )}

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between">
                <span>Application Deadline:</span>
                <span className="font-semibold text-slate-700">
                  {job.application_deadline ? formatDate(job.application_deadline) : 'Rolling'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Applications:</span>
                <span className="font-semibold text-slate-700">{job.applications_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply for ${job.title}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {applySuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Application submitted successfully! Redirecting...
            </div>
          )}

          {/* Profile Resume Check Notice */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-slate-700">Attached Resume:</span>
            {profile?.resume_url ? (
              <p className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profile Resume Ready ({profile.resume_url.split('/').pop()})
              </p>
            ) : (
              <p className="text-rose-600 font-medium">
                No resume detected in your profile! Please upload one in your Profile tab before applying.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover Letter / Introduction Note
            </label>
            <textarea
              rows={4}
              placeholder="Briefly state why your skills and experience make you a standout candidate for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !profile?.resume_url}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? 'Submitting...' : 'Confirm Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
