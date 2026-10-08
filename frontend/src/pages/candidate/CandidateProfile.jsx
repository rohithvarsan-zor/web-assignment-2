import React, { useState, useEffect } from 'react';
import {
  User,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Download,
  Percent,
  Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CandidateProfile() {
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    location: '',
    qualification: '',
    university: '',
    graduation_year: '',
    experience_years: 0,
    bio: ''
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [completion, setCompletion] = useState({ percentage: 0, missing: [] });

  // File Upload states
  const [resumeUploading, setResumeUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates/profile');
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          name: d.name || '',
          phone: d.phone || '',
          date_of_birth: d.date_of_birth ? d.date_of_birth.split('T')[0] : '',
          gender: d.gender || '',
          location: d.location || '',
          qualification: d.qualification || '',
          university: d.university || '',
          graduation_year: d.graduation_year || '',
          experience_years: d.experience_years || 0,
          bio: d.bio || ''
        });
        setSkills(d.skills ? d.skills.map((s) => s.name) : []);
        setResumeUrl(d.resume_url || '');
        setPhotoUrl(d.profile_photo_url || '');
        if (d.completion) setCompletion(d.completion);
      }
    } catch (err) {
      setErrorMsg('Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put('/candidates/profile', {
        ...formData,
        skills
      });
      if (res.success) {
        setSuccessMsg('Profile updated successfully!');
        await refreshUser();
        await fetchProfile();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Resume file must be smaller than 5 MB');
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append('resume', file);

    try {
      setResumeUploading(true);
      setErrorMsg('');
      const res = await api.post('/candidates/resume', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setResumeUrl(res.data.resume_url);
        setSuccessMsg('Resume uploaded successfully!');
        await fetchProfile();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload resume');
    } finally {
      setResumeUploading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Profile photo must be smaller than 2 MB');
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append('photo', file);

    try {
      setPhotoUploading(true);
      setErrorMsg('');
      const res = await api.post('/candidates/photo', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setPhotoUrl(res.data.profile_photo_url);
        setSuccessMsg('Profile photo uploaded!');
        await fetchProfile();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading candidate profile details..." size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Candidate Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Keep your professional details updated so top recruiters can discover and assess you.
        </p>
      </div>

      {/* Profile Completion Card (Section 13) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Profile Completion</h3>
          </div>
          <span className="text-base font-extrabold text-blue-600">{completion.percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${completion.percentage}%` }}
          />
        </div>

        {completion.missing && completion.missing.length > 0 && (
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Missing fields: </span>
            {completion.missing.join(', ')}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Files Section: Photo & Resume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Upload Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Profile Photo</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Candidate Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>

            <div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {photoUploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">JPG or PNG. Max 2 MB.</p>
            </div>
          </div>
        </div>

        {/* Resume Upload Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Resume Document</h3>
          {resumeUrl ? (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {resumeUrl.split('/').pop()}
                </span>
              </div>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-1.5 text-blue-600 hover:text-blue-800"
                title="Download / View Resume"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <p className="text-xs text-rose-600">No resume document uploaded yet.</p>
          )}

          <div>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              {resumeUploading ? 'Uploading...' : resumeUrl ? 'Replace Resume' : 'Upload Resume'}
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">PDF, DOC, or DOCX. Max 5 MB.</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Personal Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                placeholder="+1 555-0123"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location (City, Country)</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. San Francisco, CA"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Education & Experience */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Education & Experience</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Highest Qualification</label>
              <input
                type="text"
                name="qualification"
                placeholder="e.g. B.S. in Computer Science"
                value={formData.qualification}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University / College</label>
              <input
                type="text"
                name="university"
                placeholder="e.g. UC Berkeley"
                value={formData.university}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                placeholder="e.g. 2021"
                min="1960"
                max="2035"
                value={formData.graduation_year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                step="0.5"
                name="experience_years"
                placeholder="e.g. 4"
                value={formData.experience_years}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio / Summary</label>
              <textarea
                rows={4}
                name="bio"
                placeholder="Write a brief professional overview outlining your core strengths and achievements..."
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Skills Tag Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Technical Skills</h3>
          <p className="text-xs text-slate-500">
            Add relevant languages, frameworks, and engineering tools.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. React.js, Docker, PostgreSQL"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Skill
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
