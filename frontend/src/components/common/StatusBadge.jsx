import React from 'react';
import { getStatusColor, formatStatusText } from '../../utils/formatters';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  const colorClass = getStatusColor(status);
  const label = formatStatusText(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}
