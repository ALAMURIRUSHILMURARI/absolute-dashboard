import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Clock, AlertCircle, User } from 'lucide-react';
import { api } from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';
import { ReminderType, SchedulePriority, Person } from '../../types';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { symbol } = useCurrency();
  const [people, setPeople] = useState<Person[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<ReminderType>('Payment');
  const [priority, setPriority] = useState<SchedulePriority>('High');
  const [relatedPersonId, setRelatedPersonId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getPeople().then(res => {
        setPeople(res.people.map(p => p.person));
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter reminder text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createReminder({
        title: title.trim(),
        date,
        time,
        type,
        priority,
        relatedPersonId: relatedPersonId || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        notes: notes || undefined,
      });

      onSuccess();
      onClose();
      // Reset
      setTitle('');
      setAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />
      <div className="w-full max-w-md rounded-3xl bg-[#121212] border border-[#FAF6F0]/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#FAF6F0]/10 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D36B4E]/15 text-[#D36B4E]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF6F0]">Add Reminder</h2>
              <p className="text-xs text-[#A49690]">Set alert for payments, exams, or personal tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#D36B4E]/15 border border-[#D36B4E]/30 text-[#FAF6F0] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Reminder Title / Task
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Pay rent, Study for exam"
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#A49690]" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D36B4E]" />
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ReminderType)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="Payment">Payment</option>
                <option value="Schedule">Schedule</option>
                <option value="Exam">Exam</option>
                <option value="Meeting">Meeting</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[#D36B4E]" />
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as SchedulePriority)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Related Person & Amount (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3 text-[#A49690]" />
                Related Person
              </label>
              <select
                value={relatedPersonId}
                onChange={e => setRelatedPersonId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="">None</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                Amount ({symbol})
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 font-mono text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional details..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-95 text-[#FAF6F0] font-bold text-xs uppercase tracking-wider shadow-xl shadow-[#D36B4E]/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
