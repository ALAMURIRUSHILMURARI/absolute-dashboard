import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  WalletCards,
  Users,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pendingDuesCount?: number;
  unreadNotifsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  pendingDuesCount = 0,
  unreadNotifsCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { symbol } = useCurrency();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daily Payments', path: '/daily-payments', icon: WalletCards },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'People & Tabs', path: '/people', icon: Users },
    { name: 'Dues & Debts', path: '/dues', icon: Receipt, badge: pendingDuesCount },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reminders', path: '/reminders', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#121212] border-r border-[#FAF6F0]/10 flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#FAF6F0]/10 bg-[#0A0A0A]/60">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D36B4E] to-[#B5553B] flex items-center justify-center shadow-lg shadow-[#D36B4E]/25 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-[#FAF6F0] fill-[#FAF6F0]" />
            </div>
            <div>
              <span className="font-serif text-xl tracking-wider text-[#FAF6F0] flex items-center gap-1.5 font-bold">
                ABSOLUTE
              </span>
              <span className="text-[10px] uppercase font-bold text-[#D36B4E] tracking-widest block -mt-1 font-sans">
                Command Center
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#A49690]">
            Workspace
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-[#D36B4E]/15 text-[#FAF6F0] font-semibold border border-[#D36B4E]/40 shadow-sm'
                    : 'text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A]/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#D36B4E]' : 'text-[#A49690] group-hover:text-[#FAF6F0]'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D36B4E]/25 text-[#D36B4E] border border-[#D36B4E]/40">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </div>

        {/* Currency Quick Indicator Card */}
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-[#1D1B1A] border border-[#FAF6F0]/10">
          <div className="flex items-center justify-between text-xs text-[#A49690]">
            <span className="flex items-center gap-1.5 font-medium text-[#FAF6F0]">
              <Sparkles className="w-3.5 h-3.5 text-[#3AB4B9]" />
              Currency
            </span>
            <span className="font-mono font-bold text-[#D36B4E] px-2 py-0.5 rounded bg-[#D36B4E]/15 border border-[#D36B4E]/30">
              {symbol} INR
            </span>
          </div>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-[#FAF6F0]/10 bg-[#0A0A0A]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1D1B1A] border border-[#FAF6F0]/10">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=D36B4E&color=FAF6F0`
                }
                alt={user?.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#D36B4E]/50"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#FAF6F0] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#A49690] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 text-[#A49690] hover:text-[#D36B4E] hover:bg-[#D36B4E]/15 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
