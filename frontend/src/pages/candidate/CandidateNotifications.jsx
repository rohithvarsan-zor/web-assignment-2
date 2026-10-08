import React from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

export default function CandidateNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Stay up to date with application progress, recruiter updates, and interview schedules.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up! New status alerts and interview notices will appear here."
          icon={Bell}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-2xs">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !notif.is_read ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!notif.is_read && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {notif.message}
                </p>
                <span className="text-[11px] text-slate-400 block pt-1">
                  {formatRelativeTime(notif.created_at)}
                </span>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-blue-600" /> Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
