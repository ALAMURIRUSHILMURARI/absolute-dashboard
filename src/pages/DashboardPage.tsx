import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  Receipt,
  Plus,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  WalletCards,
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { AddScheduleModal } from '../components/modals/AddScheduleModal';
import { AddTransactionModal } from '../components/modals/AddTransactionModal';
import { AddPersonModal } from '../components/modals/AddPersonModal';
import { AddReminderModal } from '../components/modals/AddReminderModal';
import { SettleUpModal } from '../components/modals/SettleUpModal';
import {
  FinancialOverviewSummary,
  Schedule,
  Transaction,
  Reminder,
  PersonBalanceSummary,
  Person,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { symbol, formatMoney } = useCurrency();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FinancialOverviewSummary>({
    totalYouOwe: 0,
    totalOthersOweYou: 0,
    netBalance: 0,
    dueTodayAmount: 0,
    overdueAmount: 0,
    activeTabsCount: 0,
    totalTransactionsCount: 0,
    pendingDuesCount: 0,
  });

  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<(Transaction & { personName?: string })[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [people, setPeople] = useState<PersonBalanceSummary[]>([]);

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [settlePerson, setSettlePerson] = useState<{ person: Person; balance: number } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const getLocalDateString = (d: Date = new Date()): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayStr = getLocalDateString(new Date());

      const [analyticsRes, schedulesRes, txsRes, remsRes, peopleRes] = await Promise.all([
        api.getAnalytics(),
        api.getSchedules(),
        api.getTransactions({ limit: 8 }),
        api.getReminders({ status: 'active' }),
        api.getPeople(),
      ]);

      setOverview(analyticsRes.overview);
      setPeople(peopleRes.people);

      // Separate schedules into today and upcoming
      const todayList = schedulesRes.schedules.filter(s => s.date === todayStr);
      const upcomingList = schedulesRes.schedules.filter(s => s.date > todayStr).slice(0, 4);

      setTodaySchedules(todayList);
      setUpcomingSchedules(upcomingList);
      setReminders(remsRes.reminders.slice(0, 4));

      // Map person names into recent transactions
      const peopleMap = new Map(peopleRes.people.map(p => [p.person.id, p.person.name]));
      const enrichedTxs = txsRes.transactions.map(t => ({
        ...t,
        personName: peopleMap.get(t.personId) || 'Unknown Person',
      }));
      setRecentTransactions(enrichedTxs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleSchedule = async (id: string) => {
    try {
      await api.toggleSchedule(id);
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReminder = async (id: string) => {
    try {
      await api.toggleReminder(id);
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const formattedToday = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Live Clock Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#FAF6F0]/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-[#FAF6F0] font-serif">
              COMMAND CENTER
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 font-sans">
              LIVE VAULT
            </span>
          </div>
          <p className="text-xs text-[#A49690] mt-1">
            Welcome back, <span className="text-[#FAF6F0] font-bold">{user?.name}</span>. Here is your daily personal overview & finances.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#121212] border border-[#FAF6F0]/10 px-5 py-3 rounded-2xl self-start md:self-auto shadow-inner">
          <div className="text-right">
            <p className="text-xs font-bold text-[#FAF6F0]">{formattedToday}</p>
            <p className="text-[11px] font-mono text-[#D36B4E] font-bold">{formattedTime}</p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#3AB4B9] animate-pulse" />
        </div>
      </div>

      {/* 2. Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => navigate('/daily-payments')}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-lg shadow-[#D36B4E]/25 group"
        >
          <WalletCards className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Daily Payments</span>
        </button>

        <button
          onClick={() => setScheduleModalOpen(true)}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#121212] hover:bg-[#1D1B1A] border border-[#3AB4B9]/30 hover:border-[#3AB4B9]/60 text-[#3AB4B9] text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm group"
        >
          <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>+ Schedule</span>
        </button>

        <button
          onClick={() => setPersonModalOpen(true)}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#121212] hover:bg-[#1D1B1A] border border-[#FAF6F0]/15 hover:border-[#FAF6F0]/30 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm group"
        >
          <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>+ Person Tab</span>
        </button>

        <button
          onClick={() => setTxModalOpen(true)}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#121212] hover:bg-[#1D1B1A] border border-[#D36B4E]/30 hover:border-[#D36B4E]/60 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm group"
        >
          <Receipt className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>+ Transaction</span>
        </button>

        <button
          onClick={() => setReminderModalOpen(true)}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#121212] hover:bg-[#1D1B1A] border border-[#D36B4E]/30 hover:border-[#D36B4E]/60 text-[#D36B4E] text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm group"
        >
          <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>+ Reminder</span>
        </button>
      </div>

      {/* 3. Money Overview - 4 HERO CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#A49690] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#D36B4E]" />
            <span>Financial Command Overview</span>
          </h2>
          <button
            onClick={() => navigate('/dues')}
            className="text-xs font-bold text-[#D36B4E] hover:underline flex items-center gap-1"
          >
            <span>View All Dues</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: You Owe */}
          <StatCard
            title="You Owe"
            value={formatMoney(overview.totalYouOwe)}
            subtitle="Money you need to pay back"
            icon={ArrowUpRight}
            variant="terracotta"
            onClick={() => navigate('/dues?filter=i_owe')}
            badge="View outgoing dues"
          />

          {/* Card 2: Others Owe You */}
          <StatCard
            title="Others Owe You"
            value={formatMoney(overview.totalOthersOweYou)}
            subtitle="Money you are supposed to receive"
            icon={ArrowDownLeft}
            variant="tealglaze"
            onClick={() => navigate('/dues?filter=they_owe_me')}
            badge="View incoming tabs"
          />

          {/* Card 3: Due Today */}
          <StatCard
            title="Due Today"
            value={formatMoney(overview.dueTodayAmount)}
            subtitle="Immediate payments due today"
            icon={Clock}
            variant="amber"
            onClick={() => navigate('/dues?filter=due_today')}
            badge={overview.dueTodayAmount > 0 ? "Action required today" : "No urgent payments today"}
          />

          {/* Card 4: Overdue */}
          <StatCard
            title="Overdue"
            value={formatMoney(overview.overdueAmount)}
            subtitle="Past deadline dues"
            icon={AlertTriangle}
            variant="terracotta"
            onClick={() => navigate('/dues?filter=overdue')}
            badge={overview.overdueAmount > 0 ? "Follow-up recommended" : "Zero overdue dues"}
          />
        </div>

        {/* Secondary Net Balance & Summary Banner */}
        <div className="mt-4 p-5 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10">
              {overview.netBalance >= 0 ? (
                <TrendingUp className="w-5 h-5 text-[#3AB4B9]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#D36B4E]" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-[#A49690] font-bold uppercase tracking-widest">Overall Net Balance</p>
              <p className={`text-2xl font-serif font-extrabold ${overview.netBalance >= 0 ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
                {formatMoney(overview.netBalance, true)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#A49690]">
            <div>
              <span className="text-[#A49690] block text-[10px] uppercase font-bold tracking-wider">Active People Tabs</span>
              <span className="font-mono font-bold text-[#FAF6F0] text-sm">{overview.activeTabsCount} individuals</span>
            </div>
            <div className="h-8 w-px bg-[#FAF6F0]/10" />
            <div>
              <span className="text-[#A49690] block text-[10px] uppercase font-bold tracking-wider">Total Transactions</span>
              <span className="font-mono font-bold text-[#FAF6F0] text-sm">{overview.totalTransactionsCount} records</span>
            </div>
            <div className="h-8 w-px bg-[#FAF6F0]/10 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-[#A49690] block text-[10px] uppercase font-bold tracking-wider">Pending Dues</span>
              <span className="font-mono font-bold text-[#D36B4E] text-sm">{overview.pendingDuesCount} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Schedule & Reminders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Schedule Card */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#3AB4B9]" />
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">Today&apos;s Agenda</h3>
              </div>
              <button
                onClick={() => navigate('/schedule')}
                className="text-xs font-bold text-[#3AB4B9] hover:underline"
              >
                Schedule Calendar →
              </button>
            </div>

            {todaySchedules.length === 0 ? (
              <div className="py-10 text-center">
                <Calendar className="w-8 h-8 text-[#A49690]/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#A49690]">No schedules set for today</p>
                <button
                  onClick={() => setScheduleModalOpen(true)}
                  className="mt-2 text-xs font-bold text-[#D36B4E] hover:underline"
                >
                  + Add Today&apos;s Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaySchedules.map(s => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      s.isCompleted
                        ? 'bg-[#0A0A0A] border-[#FAF6F0]/5 opacity-50'
                        : 'bg-[#1D1B1A] border-[#FAF6F0]/10 hover:border-[#3AB4B9]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleSchedule(s.id)}
                        className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                          s.isCompleted
                            ? 'bg-[#3AB4B9] text-[#0A0A0A] border-[#3AB4B9]'
                            : 'border-[#FAF6F0]/20 hover:border-[#3AB4B9] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${s.isCompleted ? 'line-through text-[#A49690]' : 'text-[#FAF6F0]'}`}>
                          {s.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A49690]">
                          <span className="font-mono text-[#3AB4B9] font-bold">{s.startTime} - {s.endTime}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#121212] text-[#FAF6F0] text-[10px]">{s.category}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 shrink-0">
                      {s.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Reminders & Alerts */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D36B4E]" />
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">Active Reminders</h3>
              </div>
              <button
                onClick={() => navigate('/reminders')}
                className="text-xs font-bold text-[#D36B4E] hover:underline"
              >
                All Reminders →
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#A49690]">No active pending reminders</div>
            ) : (
              <div className="space-y-2.5">
                {reminders.map(r => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleReminder(r.id)}
                        className="p-1 rounded-lg border border-[#FAF6F0]/20 hover:border-[#D36B4E] text-transparent"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#FAF6F0] truncate">{r.title}</p>
                        <p className="text-[11px] text-[#A49690]">{r.date} at {r.time} • {r.type}</p>
                      </div>
                    </div>

                    {r.amount ? (
                      <span className="font-mono text-xs font-bold text-[#D36B4E] shrink-0">
                        {formatMoney(r.amount)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active People Tabs & Recent Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active People / Tabs Directory Summary */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D36B4E]" />
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">People Tabs ({people.length})</h3>
              </div>
              <button
                onClick={() => navigate('/people')}
                className="text-xs font-bold text-[#D36B4E] hover:underline"
              >
                Manage All Tabs →
              </button>
            </div>

            {people.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="w-8 h-8 text-[#A49690]/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#A49690]">No people tabs created yet</p>
                <button
                  onClick={() => setPersonModalOpen(true)}
                  className="mt-2 text-xs font-bold text-[#D36B4E] hover:underline"
                >
                  + Add First Person Tab
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.slice(0, 4).map(p => (
                  <div
                    key={p.person.id}
                    className="p-4 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 hover:border-[#D36B4E]/40 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            p.person.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(p.person.name)}&background=D36B4E&color=FAF6F0`
                          }
                          alt={p.person.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#FAF6F0]/10"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-[#FAF6F0]">{p.person.name}</h4>
                          <span className="text-[10px] text-[#A49690]">{p.person.relationship}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSettlePerson({ person: p.person, balance: p.netBalance })}
                        className="px-2.5 py-1 rounded-lg bg-[#121212] hover:bg-[#282320] text-[#D36B4E] text-[11px] font-bold border border-[#D36B4E]/30 transition-colors"
                      >
                        Settle Up
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#FAF6F0]/10 flex items-center justify-between text-xs">
                      <span className="text-[#A49690] text-[11px]">Net Tab:</span>
                      <span className={`font-mono font-bold ${p.netBalance > 0 ? 'text-[#3AB4B9]' : p.netBalance < 0 ? 'text-[#D36B4E]' : 'text-[#A49690]'}`}>
                        {p.netBalance > 0 ? `Owes you ${formatMoney(p.netBalance)}` : p.netBalance < 0 ? `You owe ${formatMoney(Math.abs(p.netBalance))}` : 'Settled (₹0)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity & Ledger Stream */}
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#D36B4E]" />
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">Recent Transactions</h3>
              </div>
              <button
                onClick={() => setTxModalOpen(true)}
                className="text-xs font-bold text-[#D36B4E] hover:underline"
              >
                + New Transaction
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-10 text-center">
                <Receipt className="w-8 h-8 text-[#A49690]/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#A49690]">No transactions recorded yet</p>
                <button
                  onClick={() => setTxModalOpen(true)}
                  className="mt-2 text-xs font-bold text-[#D36B4E] hover:underline"
                >
                  + Record First Transaction
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map(t => {
                  const isTheyOwe = t.direction === 'THEY_OWE_ME';
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/people/${t.personId}`)}
                      className="p-4 rounded-2xl bg-[#1D1B1A] hover:bg-[#24201E] border border-[#FAF6F0]/10 hover:border-[#FAF6F0]/25 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isTheyOwe ? 'bg-[#3AB4B9]/15 text-[#3AB4B9]' : 'bg-[#D36B4E]/15 text-[#D36B4E]'}`}>
                          {isTheyOwe ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#FAF6F0] group-hover:text-[#D36B4E] truncate">
                            {t.description}
                          </p>
                          <p className="text-[11px] text-[#A49690]">
                            with <span className="text-[#FAF6F0] font-semibold">{t.personName}</span> • {t.type} • {t.date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-xs sm:text-sm font-mono font-extrabold ${isTheyOwe ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
                          {isTheyOwe ? '+' : '-'} {formatMoney(t.amount)}
                        </p>
                        {t.status === 'Partial' ? (
                          <span className="text-[10px] font-mono text-[#D36B4E]">
                            Rem: {formatMoney(t.remainingAmount)}
                          </span>
                        ) : (
                          <span className={`text-[10px] uppercase font-bold ${
                            t.status === 'Settled' ? 'text-[#3AB4B9]' :
                            t.status === 'Overdue' ? 'text-[#D36B4E]' : 'text-[#A49690]'
                          }`}>
                            {t.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <AddTransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <AddPersonModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <AddReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      {settlePerson && (
        <SettleUpModal
          isOpen={true}
          onClose={() => setSettlePerson(null)}
          onSuccess={loadDashboardData}
          person={settlePerson.person}
          currentNetBalance={settlePerson.balance}
        />
      )}
    </div>
  );
};
