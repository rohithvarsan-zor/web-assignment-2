import React, { useState, useEffect } from 'react';
import { Building, Upload, CheckCircle2, AlertCircle, Globe, Phone, Briefcase } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function RecruiterProfile() {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    company_description: '',
    company_website: '',
    designation: '',
    phone: ''
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recruiter/profile');
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          name: d.name || '',
          company_name: d.company_name || '',
          company_description: d.company_description || '',
          company_website: d.company_website || '',
          designation: d.designation || '',
          phone: d.phone || ''
        });
        setLogoUrl(d.company_logo_url || '');
      }
    } catch (err) {
      setErrorMsg('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put('/recruiter/profile', formData);
      if (res.success) {
        setSuccessMsg('Company profile updated successfully!');
        await refreshUser();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Logo file must be smaller than 2 MB');
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append('logo', file);

    try {
      setLogoUploading(true);
      setErrorMsg('');
      const res = await api.post('/recruiter/logo', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        setLogoUrl(res.data.company_logo_url);
        setSuccessMsg('Company logo uploaded successfully!');
        await refreshUser();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading company profile details..." size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Recruiter & Company Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Present your organization's mission and culture to attract top engineering talent.
        </p>
      </div>

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

      {/* Company Logo Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Company Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <Building className="w-10 h-10" />
            )}
          </div>

          <div>
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              {logoUploading ? 'Uploading...' : 'Upload Logo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleLogoUpload}
                disabled={logoUploading}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">JPG or PNG. Max 2 MB.</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Company Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Website
              </label>
              <input
                type="url"
                name="company_website"
                placeholder="https://company.com"
                value={formData.company_website}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Designation / Role
              </label>
              <input
                type="text"
                name="designation"
                placeholder="e.g. Senior Talent Lead"
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+1 555-0123"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Overview & Mission
              </label>
              <textarea
                rows={4}
                name="company_description"
                placeholder="Describe your company culture, technology stack, and engineering team achievements..."
                value={formData.company_description}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
