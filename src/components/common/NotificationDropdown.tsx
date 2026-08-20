import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, AlertTriangle, Calendar, Receipt, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

interface NotificationDropdownProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose, onRefresh }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    try {
      if (!item.read) {
        await api.markNotificationRead(item.id);
        onRefresh();
      }
      onClose();
      if (item.link) {
        navigate(item.link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'PAYMENT_OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-[#D36B4E]" />;
      case 'PAYMENT_DUE':
        return <Receipt className="w-4 h-4 text-[#E27B5E]" />;
      case 'SCHEDULE_TODAY':
        return <Calendar className="w-4 h-4 text-[#3AB4B9]" />;
      case 'SETTLEMENT':
        return <Sparkles className="w-4 h-4 text-[#3AB4B9]" />;
      default:
        return <Clock className="w-4 h-4 text-[#A49690]" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[#121212] border border-[#FAF6F0]/15 shadow-2xl shadow-black z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FAF6F0]/10 bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D36B4E]" />
            <span className="text-xs font-bold text-[#FAF6F0] uppercase tracking-wider">Notifications</span>
          </div>
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 text-[11px] font-bold text-[#A49690] hover:text-[#D36B4E] transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#FAF6F0]/5">
          {loading ? (
            <div className="p-6 text-center text-xs text-[#A49690]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-[#1D1B1A] flex items-center justify-center text-[#A49690]">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#FAF6F0]">All caught up</p>
              <p className="text-[11px] text-[#A49690] mt-0.5">No pending alerts or notifications.</p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                  n.read ? 'bg-transparent hover:bg-[#1D1B1A]/40' : 'bg-[#D36B4E]/10 hover:bg-[#D36B4E]/15'
                }`}
              >
                <div className="p-2 rounded-xl bg-[#1D1B1A] border border-[#FAF6F0]/10 mt-0.5 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-bold truncate ${n.read ? 'text-[#FAF6F0]' : 'text-[#FAF6F0]'}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#D36B4E] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#A49690] mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-[#A49690] mt-1 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};
