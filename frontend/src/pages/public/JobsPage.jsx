import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, X, RotateCcw } from 'lucide-react';
import api from '../../api/client';
import JobCard from '../../components/jobs/JobCard';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employment_type') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salary_min') || '');
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '9');
      params.append('status', 'published');
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (employmentType) params.append('employment_type', employmentType);
      if (experience) params.append('experience', experience);
      if (salaryMin) params.append('salary_min', salaryMin);
      if (skill) params.append('skill', skill);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await api.get(`/jobs?${params.toString()}`);
      if (res.success) {
        setJobs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, location, employmentType, experience, salaryMin, skill, sortBy]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams();
    if (search) newParams.append('search', search);
    if (location) newParams.append('location', location);
    if (employmentType) newParams.append('employment_type', employmentType);
    if (experience) newParams.append('experience', experience);
    if (salaryMin) newParams.append('salary_min', salaryMin);
    if (skill) newParams.append('skill', skill);
    if (sortBy) newParams.append('sortBy', sortBy);
    newParams.append('page', '1');
    setSearchParams(newParams);
    setMobileFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setEmploymentType('');
    setExperience('');
    setSalaryMin('');
    setSkill('');
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
    setMobileFiltersOpen(false);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Job Openings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Find your next software engineering opportunity from top-tier companies.
        </p>
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Trigger */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            <Filter className="w-4 h-4 text-blue-600" /> Filters
          </button>
          <span className="text-xs text-slate-500 font-medium">
            {pagination.total} positions found
          </span>
        </div>

        {/* Filters Sidebar (Desktop & Mobile Drawer) */}
        <div
          className={`lg:block ${
            mobileFiltersOpen
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto'
              : 'hidden'
          }`}
        >
          <div className="bg-white lg:rounded-2xl lg:border lg:border-slate-200 lg:p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> Filter Roles
              </h3>
              {mobileFiltersOpen ? (
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-4">
              {/* Keyword Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keywords
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Title, company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="City, state, or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">All Employment Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Experience Level
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3+ years, 4-7 years"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Min Salary */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Minimum Annual Salary ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  step="5000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Skill */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Specific Skill
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, PostgreSQL, Docker"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Count Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{jobs.length}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.total}</span> jobs
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0 font-medium">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="salary_desc">Salary (High to Low)</option>
                <option value="salary_asc">Salary (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Job List / Loading / Empty */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Loading opportunities..." />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No matching jobs found"
              description="Try broadening your keywords or removing some filter constraints."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                className="mt-6 bg-white p-3 rounded-xl border border-slate-200"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
