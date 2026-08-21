import React, { useState, useEffect } from 'react';
import { X, Receipt, ArrowDownLeft, ArrowUpRight, Calendar, User, CreditCard, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';
import { Person, TransactionDirection, TransactionType, PaymentMethod } from '../../types';
import { getLocalDateString, parseNumericAmount } from '../../utils/date';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPersonId?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedPersonId,
}) => {
  const { symbol } = useCurrency();
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState(preselectedPersonId || '');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>('THEY_OWE_ME');
  const [type, setType] = useState<TransactionType>('Expense');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getPeople().then(res => {
        const rawPeople = res.people.map(p => p.person);
        setPeople(rawPeople);
        if (preselectedPersonId) {
          setPersonId(preselectedPersonId);
        } else if (rawPeople.length > 0 && !personId) {
          setPersonId(rawPeople[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen, preselectedPersonId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) {
      setError('Please select or add a person first (use + Add Person)');
      return;
    }

    const parsedAmt = parseNumericAmount(amount);
    if (parsedAmt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createTransaction({
        personId,
        amount: parsedAmt,
        direction,
        type,
        description: description.trim(),
        date: date || getLocalDateString(new Date()),
        dueDate: dueDate || undefined,
        paymentMethod,
        notes: notes ? notes.trim() : undefined,
      });
      onSuccess();
      onClose();
      // Reset form
      setAmount('');
      setDescription('');
      setNotes('');
      setDueDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
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
            <div className="p-2.5 rounded-2xl bg-[#D36B4E]/15 text-[#D36B4E]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF6F0]">Add Transaction</h2>
              <p className="text-xs text-[#A49690]">Record an expense, loan, borrowed money, or tab</p>
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

          {/* Direction Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Money Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDirection('THEY_OWE_ME')}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  direction === 'THEY_OWE_ME'
                    ? 'bg-[#3AB4B9]/15 border-[#3AB4B9]/50 text-[#3AB4B9] shadow-sm shadow-[#3AB4B9]/15 ring-1 ring-[#3AB4B9]/40'
                    : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-[#3AB4B9]" />
                <span>They Owe Me (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('I_OWE_THEM')}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  direction === 'I_OWE_THEM'
                    ? 'bg-[#D36B4E]/15 border-[#D36B4E]/50 text-[#D36B4E] shadow-sm shadow-[#D36B4E]/15 ring-1 ring-[#D36B4E]/40'
                    : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-[#D36B4E]" />
                <span>I Owe Them (-)</span>
              </button>
            </div>
          </div>

          {/* Person Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D36B4E]" />
              Person / Tab
            </label>
            <select
              value={personId}
              onChange={e => setPersonId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            >
              <option value="" disabled>Select a person</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.relationship})
                </option>
              ))}
            </select>
            {people.length === 0 && (
              <p className="text-[11px] text-[#D36B4E] mt-1">
                ⚠️ No people added yet. Please add a person first using &quot;+ Add Person&quot;
              </p>
            )}
          </div>

          {/* Amount & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                Amount ({symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-mono text-sm font-bold text-[#A49690]">
                  {symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 font-mono text-[#FAF6F0] text-base font-bold focus:border-[#D36B4E] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TransactionType)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="Expense">Expense</option>
                <option value="Loan">Loan</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Reimbursement">Reimbursement</option>
                <option value="Payment">Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Description / Reason
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
              required
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Dates & Payment Method */}
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D36B4E]" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#A49690]" />
                Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="UPI">UPI (GPay/PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes"
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
              {loading ? 'Saving...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
