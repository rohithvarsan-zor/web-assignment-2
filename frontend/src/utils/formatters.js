export const formatSalary = (min, max) => {
  if (!min && !max) return 'Competitive';
  const formatNum = (num) => {
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
    return `$${num}`;
  };
  if (min && max) return `${formatNum(min)} - ${formatNum(max)} / yr`;
  if (min) return `From ${formatNum(min)} / yr`;
  return `Up to ${formatNum(max)} / yr`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeString;
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'applied':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'under_review':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'shortlisted':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'interview_scheduled':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'selected':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'withdrawn':
      return 'bg-slate-50 text-slate-700 border-slate-200';
    case 'published':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'draft':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'closed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'scheduled':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rescheduled':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const formatStatusText = (status) => {
  if (!status) return '';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
