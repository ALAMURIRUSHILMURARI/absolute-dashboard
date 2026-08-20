import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, Tag, FileText, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api/client';
import { RelationshipCategory } from '../../types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<RelationshipCategory>('Friend');
  const [avatar, setAvatar] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the person\'s name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createPerson({
        name: name.trim(),
        phone: phone ? phone.trim() : undefined,
        email: email ? email.trim() : undefined,
        relationship,
        avatar: avatar || undefined,
        notes: notes ? notes.trim() : undefined,
      });

      onSuccess();
      onClose();
      // Reset
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setAvatar('');
    } catch (err: any) {
      setError(err.message || 'Failed to create person tab');
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF6F0]">Add Person / Tab</h2>
              <p className="text-xs text-[#A49690]">Create a dedicated financial tab & ledger</p>
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

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma, Srija Reddy"
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Relationship & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#A49690]" />
                Relationship
              </label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value as RelationshipCategory)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="Friend">Friend</option>
                <option value="Colleague">Colleague</option>
                <option value="Roommate">Roommate</option>
                <option value="Family">Family</option>
                <option value="Client">Client</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#A49690]" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#A49690]" />
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-[#A49690]" />
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#A49690]" />
              Notes / Context
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Roommate, split rent and groceries"
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
              className="px-6 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-95 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#D36B4E]/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Person Tab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
