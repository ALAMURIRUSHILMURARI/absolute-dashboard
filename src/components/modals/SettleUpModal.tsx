import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Wallet, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';
import { Person, PaymentMethod } from '../../types';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  person: Person;
  currentNetBalance: number;
  specificTxId?: string;
  specificAmount?: number;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  person,
  currentNetBalance,
  specificTxId,
  specificAmount,
}) => {
  const { symbol, formatMoney } = useCurrency();
  const outstandingAmount = Math.abs(specificAmount !== undefined ? specificAmount : currentNetBalance);
  const [settleAmount, setSettleAmount] = useState(outstandingAmount > 0 ? outstandingAmount.toString() : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const numSettle = parseFloat(settleAmount) || 0;
  const remaining = Math.max(0, outstandingAmount - numSettle);
  const isFullSettlement = numSettle >= outstandingAmount;
  const isTheyOweMe = currentNetBalance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numSettle <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.settleUp({
        personId: person.id,
        amount: numSettle,
        paymentMethod,
        date,
        notes: notes || undefined,
        specificTransactionId: specificTxId,
      });

      if (isFullSettlement) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D36B4E', '#3AB4B9', '#FAF6F0'],
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Settlement recording failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />
      <div className="w-full max-w-md rounded-3xl bg-[#121212] border border-[#FAF6F0]/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#FAF6F0]/10 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D36B4E]/15 text-[#D36B4E]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF6F0]">Settle Up with {person.name}</h2>
              <p className="text-xs text-[#A49690]">Record full or partial settlement</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#D36B4E]/15 border border-[#D36B4E]/30 text-[#FAF6F0] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Balance Overview Banner */}
          <div className="p-4 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A49690] font-medium">
                {isTheyOweMe ? `${person.name} currently owes you` : `You currently owe ${person.name}`}
              </span>
              <span className={`font-mono font-bold text-sm ${isTheyOweMe ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
                {formatMoney(outstandingAmount)}
              </span>
            </div>

            {/* Dynamic Calculation breakdown */}
            <div className="pt-2 border-t border-[#FAF6F0]/10 flex items-center justify-between text-xs font-mono">
              <span className="text-[#A49690]">Paying now:</span>
              <span className="text-[#FAF6F0] font-bold">{formatMoney(numSettle)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A49690]">Remaining Balance:</span>
              <span className={`font-bold ${remaining === 0 ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
                {formatMoney(remaining)} {remaining === 0 ? '✓ (Settled!)' : ''}
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                Payment Amount ({symbol})
              </label>
              <button
                type="button"
                onClick={() => setSettleAmount(outstandingAmount.toString())}
                className="text-[11px] font-bold text-[#D36B4E] hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-mono text-sm font-bold text-[#A49690]">
                {symbol}
              </span>
              <input
                type="number"
                step="any"
                value={settleAmount}
                onChange={e => setSettleAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 font-mono text-[#FAF6F0] text-lg font-bold focus:border-[#D36B4E] focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#A49690]" />
                Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              >
                <option value="UPI">UPI (GPay/PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
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
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Settlement Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Settle dinner split via UPI"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-6 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-95 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#D36B4E]/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Confirm Settlement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
