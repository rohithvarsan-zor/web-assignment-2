import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import api from '../../api/client';
import JobCard from '../../components/jobs/JobCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/jobs?limit=6&status=published&sortBy=newest');
        if (res.success && res.data) {
          setFeaturedJobs(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchTerm) query.append('search', searchTerm);
    if (locationTerm) query.append('location', locationTerm);
    navigate(`/jobs?${query.toString()}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-50/70 via-white to-white pt-16 sm:pt-24 pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation Talent Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Find the right opportunity.{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              Build your future.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The unified recruitment ecosystem connecting ambitious software engineers with top-tier technology enterprises.
          </p>

          {/* Job Search Form */}
          <div className="mt-10 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-3 px-3 w-full border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, keyword, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-2"
                />
              </div>

              <div className="flex-1 flex items-center gap-3 px-3 w-full pb-2 sm:pb-0">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="City, state, or 'Remote'..."
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
              >
                Search Jobs
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Popular Searches:</span>
              {['Full Stack', 'PostgreSQL', 'React.js', 'Remote', 'DevOps', 'Python'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchTerm(term);
                    navigate(`/jobs?search=${encodeURIComponent(term)}`);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATFORM STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Active Opportunities', value: '150+', icon: Briefcase, color: 'text-blue-600' },
            { label: 'Verified Candidates', value: '2,400+', icon: Users, color: 'text-indigo-600' },
            { label: 'Hiring Companies', value: '80+', icon: Building2, color: 'text-purple-600' },
            { label: 'Interviews Completed', value: '1,200+', icon: TrendingUp, color: 'text-emerald-600' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED JOBS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Featured Job Openings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Hand-picked verified roles from high-growth software enterprises.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Explore all openings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching featured opportunities..." />
        ) : featuredJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No published jobs available right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS (Recruitment Lifecycle) */}
      <section className="bg-slate-900 text-white py-16 sm:py-24 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            End-to-End Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2">
            The Complete Recruitment Lifecycle
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            TalentSync brings candidates and recruiters into a synchronized pipeline from initial application to final hire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Discover & Apply',
              desc: 'Browse tailored positions, upload structured resumes, and submit with personalized cover letters.',
              icon: Search
            },
            {
              step: '02',
              title: 'Screening & Shortlist',
              desc: 'Recruiters review candidate skills, qualifications, and move qualified applicants forward.',
              icon: ShieldCheck
            },
            {
              step: '03',
              title: 'Interview Scheduling',
              desc: 'Seamless interview coordinates with Google Meet and Zoom links, calendar alerts, and notifications.',
              icon: Calendar
            },
            {
              step: '04',
              title: 'Offer & Selection',
              desc: 'Real-time status updates keep candidates informed every step of the decision journey.',
              icon: Award
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="relative p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="text-3xl font-black text-slate-700 mb-3">{item.step}</div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FOR CANDIDATES & FOR RECRUITERS DUAL SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Candidates Box */}
          <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50/50 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-4">
                <Users className="w-3.5 h-3.5" /> For Candidates
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Accelerate your software engineering career
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  'Unified candidate profile with completion scoring',
                  'Secure PDF resume storage and easy updates',
                  'One-click application with cover letters',
                  'Live application status updates and interview notifications'
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Create Candidate Account
            </Link>
          </div>

          {/* Recruiters Box */}
          <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-slate-50 to-slate-100/60 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 mb-4">
                <Building2 className="w-3.5 h-3.5" /> For Recruiters
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Hire world-class engineers faster with clarity
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  'Draft, publish, and close job postings effortlessly',
                  'Comprehensive applicant screening with instant resume downloads',
                  'Built-in interview scheduling with calendar notes',
                  'Rich recruitment telemetry and status conversion charts'
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Post Jobs as Recruiter
            </Link>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Trusted by Top Engineers & Hiring Leaders
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto mb-10">
          Hear from candidates and recruiters who scaled their teams using TalentSync.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              quote:
                'TalentSync streamlined our technical hiring. We cut our scheduling round-trip by 60% and secured senior distributed systems talent in 10 days.',
              author: 'Sarah Jenkins',
              role: 'Talent Acquisition Lead at Apex Global'
            },
            {
              quote:
                'The transparency is unmatched. I always knew the exact review stage of my application, and interview links were coordinated instantly.',
              author: 'Alex Rivera',
              role: 'Senior Full Stack Engineer'
            },
            {
              quote:
                'The role-based dashboards and candidate filtering make managing dozens of engineering requisitions an effortless pleasure.',
              author: 'Marcus Vance',
              role: 'Director of Talent at CloudScale'
            }
          ].map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <p className="text-sm text-slate-600 italic leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-sm font-bold text-slate-800">{t.author}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 p-8 sm:p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to transform your recruitment journey?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base mb-8">
            Join thousands of professionals already discovering roles and hiring visionary engineers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-md transition-colors"
            >
              Get Started for Free
            </Link>
            <Link
              to="/jobs"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl border border-blue-400/40 transition-colors"
            >
              Browse Open Roles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
