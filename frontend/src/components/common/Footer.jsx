import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Heart, Shield, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <span>
                Talent<span className="text-blue-600">Sync</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Modern full-stack recruitment platform connecting exceptional engineering candidates with visionary tech enterprises.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Enterprise-grade Role Security
            </div>
          </div>

          {/* Candidates */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-4">
              For Candidates
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/jobs" className="hover:text-blue-600 transition-colors">
                  Explore Opportunities
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-600 transition-colors">
                  Candidate Profile
                </Link>
              </li>
              <li>
                <Link to="/candidate/applications" className="hover:text-blue-600 transition-colors">
                  Application Tracker
                </Link>
              </li>
              <li>
                <Link to="/candidate/interviews" className="hover:text-blue-600 transition-colors">
                  Interview Preparation
                </Link>
              </li>
            </ul>
          </div>

          {/* Recruiters */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-4">
              For Recruiters
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/register" className="hover:text-blue-600 transition-colors">
                  Recruiter Sign Up
                </Link>
              </li>
              <li>
                <Link to="/recruiter/jobs/create" className="hover:text-blue-600 transition-colors">
                  Post a Job Opening
                </Link>
              </li>
              <li>
                <Link to="/recruiter/applications" className="hover:text-blue-600 transition-colors">
                  Talent Pipeline
                </Link>
              </li>
              <li>
                <Link to="/recruiter/dashboard" className="hover:text-blue-600 transition-colors">
                  Hiring Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/about" className="hover:text-blue-600 transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-600 transition-colors">
                  Support & Contact
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> API Status: Online
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} TalentSync Recruitment Management System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              <Terminal className="w-3.5 h-3.5" /> Built with React & PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
