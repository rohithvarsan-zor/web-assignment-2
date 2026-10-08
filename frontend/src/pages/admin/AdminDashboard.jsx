import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
  Shield,
  Activity,
  UserCheck,
  Building,
  ArrowRight
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
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

const ROLE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/statistics');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading system administration telemetry..." size="lg" />;
  }

  const users = stats?.users || {};
  const jobs = stats?.jobs || {};
  const applications = stats?.applications || {};
  const interviews = stats?.interviews || {};
  const recentLogs = stats?.recentAuditLogs || [];
  const monthlyData = (stats?.monthlyUserRegistrations || []).map((m) => ({
    name: m.month,
    registrations: m.count
  }));

  const userDistribution = [
    { name: 'Candidates', value: users.total_candidates || 0 },
    { name: 'Recruiters', value: users.total_recruiters || 0 },
    { name: 'Admins', value: users.total_admins || 0 }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> System Master Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Platform Operations</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time platform activity metrics, user accounts, and security audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Inspect Audit Logs
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{users.total_users || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {users.active_users || 0} active
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Candidates</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{users.total_candidates || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Job seekers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Recruiters</span>
            <Building className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{users.total_recruiters || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Enterprises</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Jobs Posted</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{jobs.total_jobs || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {jobs.published_jobs || 0} live
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Applications</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{applications.total_applications || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Submissions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Interviews</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{interviews.total_interviews || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Rounds</span>
        </div>
      </div>

      {/* Visual Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">User Demographics</h3>
            <p className="text-xs text-slate-500 mt-0.5">Role composition across registered accounts</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Registration Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Registration Volume</h3>
            <p className="text-xs text-slate-500 mt-0.5">Monthly platform onboarding velocity</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {monthlyData.length === 0 ? (
              <span className="text-xs text-slate-400">No monthly metrics recorded</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="registrations" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Live Audit Log Preview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Platform Security & Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Immutable record of high-impact user actions</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {log.user_name || 'System Worker'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 uppercase font-semibold text-[10px]">
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
