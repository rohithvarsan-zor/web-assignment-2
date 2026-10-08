import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Bookmark,
  Calendar,
  Bell,
  Briefcase,
  PlusCircle,
  Users,
  Building,
  Shield,
  FileClock,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const candidateLinks = [
    { name: 'Dashboard', path: '/candidate/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/candidate/profile', icon: User },
    { name: 'My Applications', path: '/candidate/applications', icon: FileText },
    { name: 'Saved Jobs', path: '/candidate/saved-jobs', icon: Bookmark },
    { name: 'Interviews', path: '/candidate/interviews', icon: Calendar },
    { name: 'Notifications', path: '/candidate/notifications', icon: Bell }
  ];

  const recruiterLinks = [
    { name: 'Overview', path: '/recruiter/dashboard', icon: LayoutDashboard },
    { name: 'Job Postings', path: '/recruiter/jobs', icon: Briefcase },
    { name: 'Post New Job', path: '/recruiter/jobs/create', icon: PlusCircle },
    { name: 'Applications', path: '/recruiter/applications', icon: Users },
    { name: 'Interviews', path: '/recruiter/interviews', icon: Calendar },
    { name: 'Company Profile', path: '/recruiter/profile', icon: Building }
  ];

  const adminLinks = [
    { name: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Job Management', path: '/admin/jobs', icon: Briefcase },
    { name: 'Applications', path: '/admin/applications', icon: FileText },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileClock },
    { name: 'Platform Settings', path: '/admin/settings', icon: Settings }
  ];

  const links =
    role === 'candidate'
      ? candidateLinks
      : role === 'recruiter'
      ? recruiterLinks
      : adminLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* User Role Card */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[11px] font-medium text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </p>
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
          <p className="font-medium text-slate-500">TalentSync RMS v1.0</p>
          <p>Production Ready System</p>
        </div>
      </aside>
    </>
  );
}
