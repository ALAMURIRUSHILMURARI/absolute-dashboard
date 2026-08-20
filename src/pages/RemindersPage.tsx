import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { Reminder } from '../types';
import { AddReminderModal } from '../components/modals/AddReminderModal';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { formatMoney } = useCurrency();

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.getReminders({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setReminders(res.reminders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [statusFilter]);

  const handleToggle = async (id: string) => {
    try {
      await api.toggleReminder(id);
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#D36B4E]" />
            <span>Reminders & Alerts</span>
          </h1>
          <p className="text-xs text-[#A49690] mt-1">
            Stay ahead with automated alerts for due payments, exam prep, and daily milestones.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-95 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#D36B4E]/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Reminder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#A49690] mr-1" />
          {(['all', 'active', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-[#D36B4E] text-[#FAF6F0] shadow-sm'
                  : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-[#A49690] font-mono">
          {reminders.length} reminder{reminders.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#A49690]">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 text-center">
          <Bell className="w-12 h-12 text-[#A49690]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#FAF6F0]">No reminders found</h3>
          <p className="text-xs text-[#A49690] mt-1">
            Create reminders for urgent dues, project submissions, or personal habits.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider"
          >
            + Create First Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map(r => {
            const isCompleted = r.isCompleted;

            return (
              <div
                key={r.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                  isCompleted
                    ? 'bg-[#0A0A0A] border-[#FAF6F0]/5 opacity-60'
                    : 'bg-[#121212] border-[#FAF6F0]/10 hover:border-[#D36B4E]/40 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggle(r.id)}
                      className={`mt-0.5 p-1.5 rounded-xl border transition-colors ${
                        isCompleted
                          ? 'bg-[#3AB4B9] text-[#0A0A0A] border-[#3AB4B9]'
                          : 'border-[#FAF6F0]/20 hover:border-[#D36B4E] text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <h4 className={`text-sm font-bold leading-snug ${isCompleted ? 'line-through text-[#A49690]' : 'text-[#FAF6F0]'}`}>
                        {r.title}
                      </h4>
                      <p className="text-xs text-[#A49690] mt-1 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#A49690]" />
                        <span>{r.date} at {r.time}</span>
                      </p>
                      {r.notes && (
                        <p className="text-xs text-[#A49690] mt-1 italic">&ldquo;{r.notes}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30">
                      {r.priority}
                    </span>
                    <span className="text-[10px] text-[#A49690] uppercase font-semibold">
                      {r.type}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#FAF6F0]/10 flex items-center justify-between text-xs">
                  {r.amount ? (
                    <span className="font-mono font-bold text-[#D36B4E]">
                      Amount: {formatMoney(r.amount)}
                    </span>
                  ) : <span className="text-[#A49690]">General Alert</span>}

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-[#A49690] hover:text-[#D36B4E] rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AddReminderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchReminders}
      />
    </div>
  );
};
