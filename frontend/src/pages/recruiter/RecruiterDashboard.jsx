import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../../api/client';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#6366f1', '#10b981', '#f43f5e'];

export default function RecruiterDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/recruiter/statistics');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching recruiter stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading hiring analytics and pipeline..." size="lg" />;
  }

  const overview = stats?.overview || {};
  const charts = stats?.charts || {};
  const recentApps = stats?.recentApplications || [];

  // Pie chart data for applications by status
  const pieData = (charts.applicationsByStatus || []).map((s) => ({
    name: s.status.replace('_', ' ').toUpperCase(),
    value: s.count
  }));

  // Bar chart data for applications per job
  const barData = (charts.applicationsPerJob || []).map((j) => ({
    name: j.title.length > 20 ? j.title.substring(0, 18) + '...' : j.title,
    applications: j.count
  }));

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Recruiter Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hiring Dashboard</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Monitor applicant volumes, stage throughput, and upcoming interviews in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/jobs/create"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
          <Link
            to="/recruiter/applications"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Manage Pipeline
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid (Section 15) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Jobs</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.total_jobs || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Requisitions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Jobs</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.active_jobs || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Published openings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Applications</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.total_applications || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total candidates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Shortlisted</span>
            <Award className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.shortlisted_count || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Advanced stage</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Interviews</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.upcoming_interviews || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Upcoming</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Selected</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{overview.selected_count || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Offers extended</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Applications by Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across recruitment stages</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-slate-400">No application data yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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

        {/* Applications per Job Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Applications per Job Requisition</h3>
            <p className="text-xs text-slate-500 mt-0.5">Top performing job postings</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {barData.length === 0 ? (
              <span className="text-xs text-slate-400">No jobs to display</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Candidate Applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest submissions awaiting recruiter review</p>
          </div>
          <Link
            to="/recruiter/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all applications →
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            No applications received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Applied Job</th>
                  <th className="py-3 px-3">Experience</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{app.candidate_name}</p>
                      <p className="text-[11px] text-slate-500">{app.candidate_email}</p>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{app.job_title}</td>
                    <td className="py-3.5 px-3 text-slate-600">{app.experience_years || 0} yrs</td>
                    <td className="py-3.5 px-3 text-slate-500">{formatDate(app.applied_at)}</td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/recruiter/applications?search=${encodeURIComponent(app.candidate_name)}`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-xs inline-block"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
