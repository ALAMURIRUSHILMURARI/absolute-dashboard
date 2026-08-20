import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickAddFAB } from '../common/QuickAddFAB';
import { SearchModal } from '../common/SearchModal';
import { AddScheduleModal } from '../modals/AddScheduleModal';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import { AddPersonModal } from '../modals/AddPersonModal';
import { AddReminderModal } from '../modals/AddReminderModal';
import { api } from '../../api/client';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  const [pendingDuesCount, setPendingDuesCount] = useState(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const refreshBadges = async () => {
    try {
      const [duesRes, notifsRes] = await Promise.all([
        api.getDues(),
        api.getNotifications(),
      ]);
      setPendingDuesCount(duesRes.summary.iOweCount + duesRes.summary.theyOweMeCount);
      setUnreadNotifsCount(notifsRes.unreadCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshBadges();

    // Global keyboard shortcut: Ctrl+K or Cmd+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAF6F0] flex flex-col md:flex-row relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#D36B4E]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#3AB4B9]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingDuesCount={pendingDuesCount}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickAdd={() => setTxModalOpen(true)}
          unreadNotifsCount={unreadNotifsCount}
          onRefreshNotifications={refreshBadges}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          <Outlet context={{ refreshBadges }} />
        </main>
      </div>

      {/* Floating Quick Add Button */}
      <QuickAddFAB
        onAddSchedule={() => setScheduleModalOpen(true)}
        onAddTransaction={() => setTxModalOpen(true)}
        onAddPerson={() => setPersonModalOpen(true)}
        onAddReminder={() => setReminderModalOpen(true)}
      />

      {/* Global Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <AddScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={refreshBadges}
      />

      <AddTransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSuccess={refreshBadges}
      />

      <AddPersonModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        onSuccess={refreshBadges}
      />

      <AddReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSuccess={refreshBadges}
      />
    </div>
  );
};
