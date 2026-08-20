import React, { useState } from 'react';
import { Search, Bell, Menu, Sun, Moon, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onOpenQuickAdd: () => void;
  unreadNotifsCount: number;
  onRefreshNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenSearch,
  onOpenQuickAdd,
  unreadNotifsCount,
  onRefreshNotifications,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#FAF6F0]/10 px-4 md:px-8 flex items-center justify-between">
      {/* Left section: Mobile toggle + Quick Search Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A] md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar trigger (Ctrl + K) */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#121212] border border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0] hover:border-[#D36B4E]/40 transition-all text-xs font-medium w-48 sm:w-64 md:w-80 shadow-inner group"
        >
          <Search className="w-4 h-4 text-[#A49690] group-hover:text-[#D36B4E] transition-colors" />
          <span className="flex-1 text-left truncate">Search people, tabs, dues...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1D1B1A] text-[#A49690] rounded border border-[#FAF6F0]/10">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Quick Add + Theme + Notifications + User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#D36B4E]/25 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A] border border-transparent hover:border-[#FAF6F0]/10 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D36B4E]" /> : <Moon className="w-4 h-4 text-[#3AB4B9]" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="relative p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A] border border-transparent hover:border-[#FAF6F0]/10 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D36B4E] ring-2 ring-[#0A0A0A]" />
            )}
          </button>

          {isNotifOpen && (
            <NotificationDropdown
              onClose={() => setIsNotifOpen(false)}
              onRefresh={onRefreshNotifications}
            />
          )}
        </div>

        {/* Security & Private status badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1D1B1A] border border-[#3AB4B9]/30 text-[11px] font-bold text-[#3AB4B9]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Private Vault</span>
        </div>
      </div>
    </header>
  );
};
