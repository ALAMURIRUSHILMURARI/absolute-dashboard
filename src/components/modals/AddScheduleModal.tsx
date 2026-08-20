import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Tag, AlertCircle, Repeat } from 'lucide-react';
import { api } from '../../api/client';
import { Schedule, ScheduleCategory, SchedulePriority, ScheduleRecurrence } from '../../types';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSchedule?: Schedule | null;
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSchedule,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SchedulePriority>('Medium');
  const [category, setCategory] = useState<ScheduleCategory>('Personal');
  const [reminder, setReminder] = useState('15_min');
  const [recurring, setRecurring] = useState<ScheduleRecurrence>('None');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSchedule) {
      setTitle(initialSchedule.title);
      setDate(initialSchedule.date);
      setStartTime(initialSchedule.startTime);
      setEndTime(initialSchedule.endTime);
      setLocation(initialSchedule.location || '');
      setDescription(initialSchedule.description || '');
      setPriority(initialSchedule.priority);
      setCategory(initialSchedule.category);
      setReminder(initialSchedule.reminder || '15_min');
      setRecurring(initialSchedule.recurring || 'None');
    } else {
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setEndTime('11:00');
      setLocation('');
      setDescription('');
      setPriority('Medium');
      setCategory('Personal');
      setReminder('15_min');
      setRecurring('None');
    }
  }, [initialSchedule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a schedule title');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (initialSchedule) {
        await api.updateSchedule(initialSchedule.id, {
          title,
          date,
          startTime,
          endTime,
          location: location || undefined,
          description: description || undefined,
          priority,
          category,
          reminder,
          recurring,
        });
      } else {
        await api.createSchedule({
          title,
          date,
          startTime,
          endTime,
          location: location || undefined,
          description: description || undefined,
          priority,
          category,
          reminder,
          recurring,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />
      <div className="w-full max-w-lg rounded-3xl bg-[#121212] border border-[#FAF6F0]/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#FAF6F0]/10 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#3AB4B9]/15 text-[#3AB4B9]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF6F0]">
                {initialSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </h2>
              <p className="text-xs text-[#A49690]">Set agenda, meetings, exams, or personal events</p>
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Capstone Review, Final Exam, Gym Workout"
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
            />
          </div>

          {/* Date and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#3AB4B9]" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#3AB4B9]" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#A49690]" />
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ScheduleCategory)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              >
                <option value="Personal">Personal</option>
                <option value="College">College</option>
                <option value="Work">Work</option>
                <option value="Interview">Interview</option>
                <option value="Exam">Exam</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
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
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#A49690]" />
              Location / Link
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Google Meet, Hall 302, Studio"
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
            />
          </div>

          {/* Recurrence & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Repeat className="w-3 h-3 text-[#A49690]" />
                Recurring
              </label>
              <select
                value={recurring}
                onChange={e => setRecurring(e.target.value as ScheduleRecurrence)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              >
                <option value="None">Does not repeat</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                Reminder
              </label>
              <select
                value={reminder}
                onChange={e => setReminder(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
              >
                <option value="none">No reminder</option>
                <option value="15_min">15 minutes before</option>
                <option value="30_min">30 minutes before</option>
                <option value="1_hour">1 hour before</option>
                <option value="1_day">1 day before</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Additional agenda or preparation notes..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#3AB4B9] focus:outline-none"
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
              className="px-6 py-3 rounded-2xl bg-[#3AB4B9] hover:bg-[#4FC5CA] active:scale-95 text-[#0A0A0A] text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#3AB4B9]/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialSchedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
