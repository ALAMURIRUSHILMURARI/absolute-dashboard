import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  Repeat,
  Tag,
  AlertCircle,
  Filter,
  Mail,
  Flame,
  Zap,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { Schedule, ScheduleCategory, SchedulePriority } from '../types';
import { AddScheduleModal } from '../components/modals/AddScheduleModal';

type CalendarView = 'day' | 'week' | 'month';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const categories: (ScheduleCategory | 'All')[] = [
    'All',
    'Personal',
    'College',
    'Work',
    'Interview',
    'Exam',
    'Meeting',
    'Other',
  ];

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules();
      setSchedules(res.schedules);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleToggleComplete = async (id: string) => {
    try {
      await api.toggleSchedule(id);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.deleteSchedule(id);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  const handleSendEmailAlertNow = async (schedule: Schedule) => {
    try {
      setDispatchingId(schedule.id);
      const res = await api.sendScheduleEmailAlert(schedule.id);
      setActionMsg(res.message || `Priority email alert (${schedule.priority}) sent for "${schedule.title}" to mail4murari27@gmail.com!`);
      setTimeout(() => setActionMsg(''), 5000);
      fetchSchedules();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch email alert');
    } finally {
      setDispatchingId(null);
    }
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else if (view === 'month') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'month') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityBadge = (priority: SchedulePriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#381611] text-[#FFA092] border border-[#E05A47]/50 flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-[#E05A47]" />
            <span>Urgent</span>
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#2E1C18] text-[#E27B5E] border border-[#D36B4E]/50 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#D36B4E]" />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#2E2210] text-[#FBBF24] border border-[#F59E0B]/50 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-[#F59E0B]" />
            <span>Medium</span>
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#112325] text-[#4FC5CA] border border-[#3AB4B9]/50 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-[#3AB4B9]" />
            <span>Low</span>
          </span>
        );
    }
  };

  const getCategoryBadgeClass = (category: ScheduleCategory) => {
    switch (category) {
      case 'Work':
        return 'bg-[#3AB4B9]/15 text-[#3AB4B9] border-[#3AB4B9]/30';
      case 'College':
        return 'bg-[#D36B4E]/15 text-[#D36B4E] border-[#D36B4E]/30';
      case 'Exam':
        return 'bg-[#E27B5E]/15 text-[#E27B5E] border-[#E27B5E]/30';
      case 'Interview':
        return 'bg-[#FAF6F0]/15 text-[#FAF6F0] border-[#FAF6F0]/30';
      case 'Meeting':
        return 'bg-[#3AB4B9]/15 text-[#3AB4B9] border-[#3AB4B9]/30';
      case 'Personal':
        return 'bg-[#D36B4E]/15 text-[#D36B4E] border-[#D36B4E]/30';
      default:
        return 'bg-[#1D1B1A] text-[#A49690] border-[#FAF6F0]/10';
    }
  };

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  const todayLocalDateStr = getLocalDateString(new Date());
  const currentViewDateStr = getLocalDateString(currentDate);
  const currentViewMonthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter schedules strictly by view (day, week, month) + category
  const filteredSchedules = schedules.filter(s => {
    if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;

    if (view === 'day') {
      return s.date === currentViewDateStr;
    }
    if (view === 'month') {
      return s.date.startsWith(currentViewMonthPrefix);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-[#3AB4B9]" />
              <span>Schedule Manager</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 font-sans">
              30m Mail Alerts Active
            </span>
          </div>
          <p className="text-xs text-[#A49690] mt-1">
            Manage your daily agenda, college commitments, exams, and receive 30-min priority email alerts at <b className="text-[#FAF6F0] font-mono">mail4murari27@gmail.com</b>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Day / Week / Month Toggle */}
          <div className="p-1 rounded-2xl bg-[#121212] border border-[#FAF6F0]/10 flex items-center">
            {(['day', 'week', 'month'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  view === v
                    ? 'bg-[#D36B4E] text-[#FAF6F0]'
                    : 'text-[#A49690] hover:text-[#FAF6F0]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Add Schedule Button */}
          <button
            onClick={() => {
              setEditingSchedule(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#D36B4E]/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-[#3AB4B9]/15 border border-[#3AB4B9]/30 text-[#FAF6F0] text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4 text-[#3AB4B9]" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Date Navigation & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-[#FAF6F0] ml-2">
            {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {view === 'week' && `Week of ${weekDates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#D36B4E] text-[#FAF6F0] shadow-sm'
                  : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar View Area */}
      {view === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDates.map(d => {
            const dStr = getLocalDateString(d);
            const isCurrentToday = dStr === todayLocalDateStr;
            const daySchedules = schedules
              .filter(s => s.date === dStr)
              .filter(s => selectedCategory === 'All' || s.category === selectedCategory);

            return (
              <div
                key={dStr}
                className={`rounded-3xl border flex flex-col min-h-[360px] p-3.5 transition-all ${
                  isCurrentToday
                    ? 'bg-[#181514] border-[#D36B4E]/50 shadow-xl shadow-[#D36B4E]/10 ring-1 ring-[#D36B4E]/40'
                    : 'bg-[#121212] border-[#FAF6F0]/10'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#FAF6F0]/10">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#A49690] block">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`text-base font-extrabold font-mono ${isCurrentToday ? 'text-[#D36B4E]' : 'text-[#FAF6F0]'}`}>
                      {d.getDate()}
                    </span>
                  </div>

                  {isCurrentToday && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D36B4E] text-[9px] font-bold text-[#FAF6F0] uppercase">
                      Today
                    </span>
                  )}
                </div>

                {/* Schedules for this day */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {daySchedules.length === 0 ? (
                    <p className="text-[11px] text-[#A49690]/40 italic py-6 text-center">No schedules</p>
                  ) : (
                    daySchedules.map(s => (
                      <div
                        key={s.id}
                        className={`p-3 rounded-2xl border flex flex-col justify-between transition-all group ${
                          s.isCompleted
                            ? 'bg-[#0A0A0A] border-[#FAF6F0]/5 opacity-50'
                            : 'bg-[#1D1B1A] border-[#FAF6F0]/10 hover:border-[#D36B4E]/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 flex-wrap">
                            <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold ${getCategoryBadgeClass(s.category)}`}>
                              {s.category}
                            </span>
                            {getPriorityBadge(s.priority)}
                          </div>

                          <p className={`text-xs font-bold mt-2 leading-snug ${s.isCompleted ? 'line-through text-[#A49690]' : 'text-[#FAF6F0]'}`}>
                            {s.title}
                          </p>

                          <div className="flex items-center gap-1 text-[10px] text-[#A49690] font-mono mt-1">
                            <Clock className="w-2.5 h-2.5 text-[#3AB4B9]" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>

                          {s.location && (
                            <div className="flex items-center gap-1 text-[10px] text-[#A49690] truncate mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#A49690]" />
                              <span className="truncate">{s.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#FAF6F0]/10 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleComplete(s.id)}
                            className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                              s.isCompleted
                                ? 'text-[#3AB4B9]'
                                : 'text-[#A49690] hover:text-[#3AB4B9]'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{s.isCompleted ? 'Done' : 'Check'}</span>
                          </button>

                          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleSendEmailAlertNow(s)}
                              title="Send 30-min priority mail alert now"
                              disabled={dispatchingId === s.id}
                              className="p-1 text-[#D36B4E] hover:text-[#FAF6F0] rounded hover:bg-[#121212]"
                            >
                              <Mail className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSchedule(s);
                                setModalOpen(true);
                              }}
                              className="p-1 text-[#A49690] hover:text-[#3AB4B9]"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="p-1 text-[#A49690] hover:text-[#D36B4E]"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day / Month list view */}
      {view !== 'week' && (
        <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3">
            <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">
              {view === 'day'
                ? `Events for ${currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} (${filteredSchedules.length})`
                : `Events for ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} (${filteredSchedules.length})`}
            </h3>
            <span className="text-[10px] text-[#A49690] font-mono">
              Viewing: {view === 'day' ? currentViewDateStr : currentViewMonthPrefix}
            </span>
          </div>

          {filteredSchedules.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarIcon className="w-10 h-10 text-[#A49690]/30 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#FAF6F0]">
                {view === 'day' ? `No events scheduled for ${currentViewDateStr}` : `No events in this month`}
              </p>
              <p className="text-[11px] text-[#A49690] mt-1">
                {view === 'day' ? 'Check other dates or switch to Week view to see upcoming commitments.' : ''}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#FAF6F0]/10">
              {filteredSchedules.map(s => (
                <div
                  key={s.id}
                  className="py-4 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleComplete(s.id)}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        s.isCompleted
                          ? 'bg-[#3AB4B9] text-[#0A0A0A] border-[#3AB4B9]'
                          : 'border-[#FAF6F0]/20 hover:border-[#3AB4B9] text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${s.isCompleted ? 'line-through text-[#A49690]' : 'text-[#FAF6F0]'}`}>
                          {s.title}
                        </p>
                        {getPriorityBadge(s.priority)}
                      </div>
                      <p className="text-xs text-[#A49690] mt-0.5">
                        <span className="text-[#FAF6F0] font-mono font-semibold">{s.date}</span> • {s.startTime} - {s.endTime} {s.location ? `• ${s.location}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-xl border font-bold ${getCategoryBadgeClass(s.category)}`}>
                      {s.category}
                    </span>
                    <button
                      onClick={() => handleSendEmailAlertNow(s)}
                      title="Send priority email alert now"
                      className="p-2 text-[#D36B4E] hover:text-[#FAF6F0] rounded-xl hover:bg-[#1D1B1A]"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSchedule(s);
                        setModalOpen(true);
                      }}
                      className="p-2 text-[#A49690] hover:text-[#3AB4B9] rounded-xl hover:bg-[#1D1B1A]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(s.id)}
                      className="p-2 text-[#A49690] hover:text-[#D36B4E] rounded-xl hover:bg-[#1D1B1A]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AddScheduleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSchedule(null);
        }}
        onSuccess={fetchSchedules}
        initialSchedule={editingSchedule}
      />
    </div>
  );
};
