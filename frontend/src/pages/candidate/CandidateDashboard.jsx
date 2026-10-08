import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Award,
  Calendar,
  Bookmark,
  ArrowRight,
  TrendingUp,
  Bell,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#6366f1', '#10b981', '#f43f5e', '#64748b'];

export default function CandidateDashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState({
    applications: [],
    interviews: [],
    savedJobsCount: 0,
    recentNotifications: [],
    recommendedJobs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [appsRes, interviewsRes, savedRes, notifsRes, jobsRes] = await Promise.all([
          api.get('/applications/my?limit=10'),
          api.get('/interviews/my'),
          api.get('/saved-jobs?limit=1'),
          api.get('/notifications?limit=5'),
          api.get('/jobs?limit=4&status=published&sortBy=newest')
        ]);

        setData({
          applications: appsRes.data || [],
          interviews: interviewsRes.data || [],
          savedJobsCount: savedRes.pagination?.total || 0,
          recentNotifications: notifsRes.data?.notifications || [],
          recommendedJobs: jobsRes.data || []
        });
      } catch (err) {
        console.error('Failed to load candidate dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading candidate workspace..." size="lg" />;
  }

  const totalApps = data.applications.length;
  const underReviewCount = data.applications.filter((a) => a.status === 'under_review').length;
  const shortlistedCount = data.applications.filter((a) => a.status === 'shortlisted').length;
  const upcomingInterviewsCount = data.interviews.filter((i) => i.status === 'scheduled').length;

  // Chart data: application statuses
  const statusCounts = {};
  data.applications.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const chartData = Object.keys(statusCounts).map((status) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: statusCounts[status]
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
            Candidate Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.name || 'Engineer'}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Track your job submissions, schedule updates, and discover new technical opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Find New Jobs
          </Link>
          <Link
            to="/candidate/profile"
            className="px-5 py-2.5 bg-blue-500/40 hover:bg-blue-500/60 text-white border border-blue-300/30 text-xs font-semibold rounded-xl transition-colors"
          >
            Update Profile
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalApps}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Submissions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Under Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{underReviewCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Recruiter screening</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Shortlisted</span>
            <Award className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{shortlistedCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Advanced stage</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Upcoming Interviews</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{upcomingInterviewsCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Scheduled sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Saved Jobs</span>
            <Bookmark className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{data.savedJobsCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Bookmarked roles</span>
        </div>
      </div>

      {/* Charts & Upcoming Interviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Chart Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Application Pipeline</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of submitted applications by stage</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-center text-xs text-slate-400">No applications to display</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming Interviews Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Interviews</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your confirmed interview sessions</p>
            </div>
            <Link
              to="/candidate/interviews"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.interviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No upcoming interviews scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.interviews.slice(0, 3).map((interview) => (
                <div
                  key={interview.id}
                  className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800">{interview.job_title}</span>
                    <p className="text-xs text-slate-500">{interview.company_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>Date: {formatDate(interview.scheduled_date)}</span>
                      <span>Time: {interview.scheduled_time}</span>
                      <span className="capitalize font-medium text-blue-600">({interview.mode})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {interview.meeting_link && (
                      <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Join Meeting
                      </a>
                    )}
                    <StatusBadge status={interview.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications & Recommended Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Applications</h3>
            <Link
              to="/candidate/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All submissions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.applications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              You haven't submitted any applications yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.applications.slice(0, 4).map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate">{app.job_title}</p>
                    <p className="text-[11px] text-slate-500">{app.company_name}</p>
                    <span className="text-[10px] text-slate-400">
                      Applied {formatDate(app.applied_at)}
                    </span>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Jobs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recommended Roles</h3>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Browse more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recommendedJobs.map((job) => (
              <div key={job.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-xs font-bold text-slate-800 hover:text-blue-600 truncate block"
                  >
                    {job.title}
                  </Link>
                  <p className="text-[11px] text-slate-500">{job.company_name} • {job.location}</p>
                </div>
                <Link
                  to={`/jobs/${job.id}`}
                  className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
