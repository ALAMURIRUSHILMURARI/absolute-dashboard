import React, { useState, useEffect } from 'react';
import {
  WalletCards,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone,
  Banknote,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Coins,
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import {
  DailyPayment,
  DailyPaymentMethod,
  DailyPaymentFlow,
  DailyPaymentCategory,
  DailyPaymentsSummary,
} from '../types';

export const DailyPaymentsPage: React.FC = () => {
  const { symbol, formatMoney } = useCurrency();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [payments, setPayments] = useState<DailyPayment[]>([]);
  const [summary, setSummary] = useState<DailyPaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFlow, setFilterFlow] = useState<'All' | 'OUTGOING' | 'INCOMING'>('All');
  const [filterMethod, setFilterMethod] = useState<'All' | 'UPI' | 'Cash'>('All');

  // Single Add Form State
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [flow, setFlow] = useState<DailyPaymentFlow>('OUTGOING'); // Default to Outgoing (Spent)
  const [paymentMethod, setPaymentMethod] = useState<DailyPaymentMethod>('UPI');
  const [category, setCategory] = useState<DailyPaymentCategory>('Food & Dining');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit modal / item
  const [editingPayment, setEditingPayment] = useState<DailyPayment | null>(null);

  // Bulk Upload Drawer / Modal
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRows, setBulkRows] = useState<
    Array<{
      amount: string;
      reason: string;
      flow: DailyPaymentFlow;
      method: DailyPaymentMethod;
      category: DailyPaymentCategory;
    }>
  >([
    { amount: '', reason: '', flow: 'OUTGOING', method: 'UPI', category: 'Food & Dining' },
    { amount: '', reason: '', flow: 'OUTGOING', method: 'UPI', category: 'Travel & Fuel' },
    { amount: '', reason: '', flow: 'INCOMING', method: 'UPI', category: 'Income & Salary' },
    { amount: '', reason: '', flow: 'OUTGOING', method: 'Cash', category: 'Groceries' },
  ]);

  const categories: DailyPaymentCategory[] = [
    'Food & Dining',
    'Travel & Fuel',
    'Groceries',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
    'Income & Salary',
    'Freelance',
    'Refund & Cashback',
    'Personal Care',
    'Other',
  ];

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes] = await Promise.all([
        api.getDailyPayments(),
        api.getDailyPaymentsSummary(),
      ]);
      setPayments(paymentsRes.payments);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load daily payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason / description');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingPayment) {
        await api.updateDailyPayment(editingPayment.id, {
          amount: parseFloat(amount),
          reason: reason.trim(),
          flow,
          paymentMethod,
          date: selectedDate,
          category,
          notes: notes ? notes.trim() : undefined,
        });
        setEditingPayment(null);
        setSuccessMsg('Payment updated successfully!');
      } else {
        await api.createDailyPayment({
          amount: parseFloat(amount),
          reason: reason.trim(),
          flow,
          paymentMethod,
          date: selectedDate, // Defaultly fixed per selected date
          time: new Date().toTimeString().slice(0, 5),
          category,
          notes: notes ? notes.trim() : undefined,
        });
        setSuccessMsg(
          `${flow === 'INCOMING' ? '+₹' : '-₹'}${amount} (${flow === 'INCOMING' ? 'Received' : 'Spent'}) recorded via ${paymentMethod}!`
        );
      }

      // Reset form
      setAmount('');
      setReason('');
      setNotes('');
      setTimeout(() => setSuccessMsg(''), 3000);

      fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    const validItems = bulkRows.filter(r => r.amount && parseFloat(r.amount) > 0 && r.reason.trim());
    if (validItems.length === 0) {
      setError('Please fill in at least one payment row with amount and reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.bulkCreateDailyPayments({
        date: selectedDate,
        items: validItems.map(r => ({
          amount: parseFloat(r.amount),
          reason: r.reason.trim(),
          flow: r.flow,
          paymentMethod: r.method,
          category: r.category,
        })),
      });

      setBulkMode(false);
      setBulkRows([
        { amount: '', reason: '', flow: 'OUTGOING', method: 'UPI', category: 'Food & Dining' },
        { amount: '', reason: '', flow: 'OUTGOING', method: 'UPI', category: 'Travel & Fuel' },
        { amount: '', reason: '', flow: 'INCOMING', method: 'UPI', category: 'Income & Salary' },
        { amount: '', reason: '', flow: 'OUTGOING', method: 'Cash', category: 'Groceries' },
      ]);
      setSuccessMsg(`Uploaded ${validItems.length} transactions for ${selectedDate}!`);
      setTimeout(() => setSuccessMsg(''), 3500);

      fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('Delete this payment entry?')) return;
    try {
      await api.deleteDailyPayment(id);
      fetchPayments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = (p: DailyPayment) => {
    setEditingPayment(p);
    setAmount(p.amount.toString());
    setReason(p.reason);
    setFlow(p.flow || 'OUTGOING');
    setPaymentMethod(p.paymentMethod);
    setSelectedDate(p.date);
    if (p.category) setCategory(p.category);
    if (p.notes) setNotes(p.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Group and filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.reason.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = filterMethod === 'All' || p.paymentMethod === filterMethod;
    const matchesFlow = filterFlow === 'All' || (p.flow || 'OUTGOING') === filterFlow;
    return matchesSearch && matchesMethod && matchesFlow;
  });

  // Calculate stats for the currently selected date
  const selectedDatePayments = payments.filter(p => p.date === selectedDate);
  const selectedDateOutgoing = selectedDatePayments
    .filter(p => (p.flow || 'OUTGOING') === 'OUTGOING')
    .reduce((acc, p) => acc + p.amount, 0);
  const selectedDateIncoming = selectedDatePayments
    .filter(p => p.flow === 'INCOMING')
    .reduce((acc, p) => acc + p.amount, 0);
  const selectedDateNet = selectedDateIncoming - selectedDateOutgoing;

  const selectedDateUpi = selectedDatePayments.filter(p => p.paymentMethod === 'UPI').reduce((acc, p) => acc + p.amount, 0);
  const selectedDateCash = selectedDatePayments.filter(p => p.paymentMethod === 'Cash').reduce((acc, p) => acc + p.amount, 0);

  // Formatted date string for header
  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Quick Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#FAF6F0]/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
              <WalletCards className="w-8 h-8 text-[#D36B4E]" />
              <span>Daily Payments & Cashflow</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 font-sans">
              In & Out Flow
            </span>
          </div>
          <p className="text-xs text-[#A49690] mt-1">
            Upload and manage your incoming cash/UPI receipts and outgoing daily payments.
          </p>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#FAF6F0]/10 p-2 rounded-2xl shadow-inner self-start md:self-auto">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A]"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedDate === todayStr
                ? 'bg-[#D36B4E] text-[#FAF6F0]'
                : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0]'
            }`}
          >
            Today
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-mono font-bold px-3 py-1.5 rounded-xl focus:border-[#D36B4E] focus:outline-none"
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl text-[#A49690] hover:text-[#FAF6F0] hover:bg-[#1D1B1A]"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#3AB4B9]/15 border border-[#3AB4B9]/30 text-[#FAF6F0] text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4 text-[#3AB4B9]" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#D36B4E]/15 border border-[#D36B4E]/30 text-[#FAF6F0] text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. Daily Cashflow Summary Cards for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outgoing Cashflow (Spent) */}
        <div className="p-6 rounded-3xl bg-[#181514] border border-[#D36B4E]/30 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690] flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D36B4E]" />
              Outgoing (Spent)
            </span>
            <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 uppercase">
              Money Out
            </span>
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#D36B4E] mt-2">
            - {formatMoney(selectedDateOutgoing)}
          </p>
          <p className="text-[11px] text-[#A49690] mt-1 font-medium">
            Daily expenses on {selectedDate === todayStr ? 'Today' : selectedDate}
          </p>
        </div>

        {/* Incoming Cashflow (Received) */}
        <div className="p-6 rounded-3xl bg-[#141818] border border-[#3AB4B9]/30 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690] flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#3AB4B9]" />
              Incoming (Received)
            </span>
            <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30 uppercase">
              Money In
            </span>
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#3AB4B9] mt-2">
            + {formatMoney(selectedDateIncoming)}
          </p>
          <p className="text-[11px] text-[#A49690] mt-1 font-medium">
            Daily inflows / earnings
          </p>
        </div>

        {/* Net Daily Cashflow */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#FAF6F0]" />
              Net Daily Cashflow
            </span>
            <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#1D1B1A] text-[#FAF6F0] border border-[#FAF6F0]/10 uppercase">
              In - Out
            </span>
          </div>
          <p
            className={`text-3xl font-extrabold font-mono mt-2 ${
              selectedDateNet > 0 ? 'text-[#3AB4B9]' : selectedDateNet < 0 ? 'text-[#D36B4E]' : 'text-[#FAF6F0]'
            }`}
          >
            {selectedDateNet > 0 ? `+ ${formatMoney(selectedDateNet)}` : selectedDateNet < 0 ? `- ${formatMoney(Math.abs(selectedDateNet))}` : '₹0.00'}
          </p>
          <p className="text-[11px] text-[#A49690] mt-1">
            {selectedDateNet >= 0 ? 'Positive net flow' : 'Deficit outflow'}
          </p>
        </div>

        {/* Method Breakdown (UPI vs Cash) */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">
              Method Split
            </span>
            <Coins className="w-4 h-4 text-[#D36B4E]" />
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A49690] flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-[#3AB4B9]" />
                UPI:
              </span>
              <span className="font-bold text-[#3AB4B9]">{formatMoney(selectedDateUpi)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A49690] flex items-center gap-1">
                <Banknote className="w-3 h-3 text-[#D36B4E]" />
                Cash:
              </span>
              <span className="font-bold text-[#D36B4E]">{formatMoney(selectedDateCash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Action Section: Form (Left) & Timeline Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Upload Form Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D36B4E]/15 text-[#D36B4E]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">
                    {editingPayment ? 'Edit Payment' : 'Record Cashflow'}
                  </h3>
                  <p className="text-[11px] text-[#A49690]">
                    Date: <span className="text-[#FAF6F0] font-mono font-bold">{selectedDate}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBulkMode(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                  bulkMode
                    ? 'bg-[#3AB4B9] text-[#0A0A0A] border-[#3AB4B9]'
                    : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border-[#FAF6F0]/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{bulkMode ? 'Single Form' : 'Batch Upload'}</span>
              </button>
            </div>

            {/* SINGLE FORM MODE */}
            {!bulkMode ? (
              <form onSubmit={handleAddPayment} className="space-y-4">
                {/* 1. Cashflow Direction Toggle: Outgoing vs Incoming */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                    Cashflow Direction
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFlow('OUTGOING');
                        if (category === 'Income & Salary' || category === 'Freelance' || category === 'Refund & Cashback') {
                          setCategory('Food & Dining');
                        }
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        flow === 'OUTGOING'
                          ? 'bg-[#D36B4E]/15 border-[#D36B4E]/60 text-[#D36B4E] ring-1 ring-[#D36B4E]/40 shadow-sm shadow-[#D36B4E]/20'
                          : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 text-[#D36B4E]" />
                      <span>Outgoing (Spent)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFlow('INCOMING');
                        setCategory('Income & Salary');
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        flow === 'INCOMING'
                          ? 'bg-[#3AB4B9]/15 border-[#3AB4B9]/60 text-[#3AB4B9] ring-1 ring-[#3AB4B9]/40 shadow-sm shadow-[#3AB4B9]/20'
                          : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 text-[#3AB4B9]" />
                      <span>Incoming (Received)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Date (Fixed per selected date) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3 text-[#A49690]" />
                      Payment Date
                    </label>
                    <span className="text-[10px] text-[#D36B4E] font-semibold">Fixed per date</span>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-mono font-bold focus:border-[#D36B4E] focus:outline-none"
                  />
                </div>

                {/* 3. Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                    Amount ({symbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 font-mono text-base font-bold text-[#A49690]">
                      {symbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 font-mono text-lg font-bold text-[#FAF6F0] focus:border-[#D36B4E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. Reason / Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                    {flow === 'INCOMING' ? 'Reason / Received From' : 'Reason / What did you pay for?'}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={
                      flow === 'INCOMING'
                        ? 'e.g. Salary, Client project payout, Pocket money, Cash from friend'
                        : 'e.g. Chai & breakfast, Auto fare, Groceries, Dinner split'
                    }
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
                  />
                </div>

                {/* 5. Payment Method: UPI vs Cash */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-[#3AB4B9]/15 border-[#3AB4B9]/60 text-[#3AB4B9] ring-1 ring-[#3AB4B9]/40'
                          : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-[#3AB4B9]" />
                      <span>UPI (Online)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        paymentMethod === 'Cash'
                          ? 'bg-[#D36B4E]/15 border-[#D36B4E]/60 text-[#D36B4E] ring-1 ring-[#D36B4E]/40'
                          : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-[#D36B4E]" />
                      <span>Cash (Offline)</span>
                    </button>
                  </div>
                </div>

                {/* 6. Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as DailyPaymentCategory)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Notes (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Additional context or references..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex items-center gap-3">
                  {editingPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPayment(null);
                        setAmount('');
                        setReason('');
                        setNotes('');
                      }}
                      className="px-4 py-3 rounded-2xl bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98 ${
                      flow === 'INCOMING'
                        ? 'bg-[#3AB4B9] hover:bg-[#4FC5CA] text-[#0A0A0A] shadow-[#3AB4B9]/30'
                        : 'bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] shadow-[#D36B4E]/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Recording...'
                        : editingPayment
                        ? 'Update Entry'
                        : flow === 'INCOMING'
                        ? '+ Record Incoming Receipt'
                        : '- Record Outgoing Expense'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              /* BATCH UPLOAD MODE */
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 text-xs text-[#A49690]">
                  Batch add multiple expenses or income for <b className="text-[#FAF6F0] font-mono">{selectedDate}</b>.
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {bulkRows.map((row, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#A49690] uppercase">
                        <span>Entry #{idx + 1}</span>
                        {bulkRows.length > 1 && (
                          <button
                            onClick={() => setBulkRows(prev => prev.filter((_, i) => i !== idx))}
                            className="text-[#D36B4E] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={row.flow}
                          onChange={e => {
                            const val = e.target.value as DailyPaymentFlow;
                            setBulkRows(prev => prev.map((r, i) => (i === idx ? { ...r, flow: val } : r)));
                          }}
                          className={`w-full px-2 py-2 rounded-xl border text-xs font-bold focus:outline-none ${
                            row.flow === 'INCOMING'
                              ? 'bg-[#3AB4B9]/15 text-[#3AB4B9] border-[#3AB4B9]/40'
                              : 'bg-[#D36B4E]/15 text-[#D36B4E] border-[#D36B4E]/40'
                          }`}
                        >
                          <option value="OUTGOING">Outgoing (-)</option>
                          <option value="INCOMING">Incoming (+)</option>
                        </select>

                        <input
                          type="number"
                          step="any"
                          value={row.amount}
                          onChange={e => {
                            const val = e.target.value;
                            setBulkRows(prev => prev.map((r, i) => (i === idx ? { ...r, amount: val } : r)));
                          }}
                          placeholder={`Amount (${symbol})`}
                          className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#FAF6F0]/10 font-mono text-xs text-[#FAF6F0] focus:border-[#D36B4E] focus:outline-none"
                        />

                        <select
                          value={row.method}
                          onChange={e => {
                            const val = e.target.value as DailyPaymentMethod;
                            setBulkRows(prev => prev.map((r, i) => (i === idx ? { ...r, method: val } : r)));
                          }}
                          className="w-full px-2 py-2 rounded-xl bg-[#121212] border border-[#FAF6F0]/10 text-xs text-[#FAF6F0] focus:border-[#D36B4E] focus:outline-none"
                        >
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        value={row.reason}
                        onChange={e => {
                          const val = e.target.value;
                          setBulkRows(prev => prev.map((r, i) => (i === idx ? { ...r, reason: val } : r)));
                        }}
                        placeholder="Reason (e.g. Chai, Auto, Salary, Groceries)"
                        className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#FAF6F0]/10 text-xs text-[#FAF6F0] focus:border-[#D36B4E] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBulkRows(prev => [
                        ...prev,
                        { amount: '', reason: '', flow: 'OUTGOING', method: 'UPI', category: 'Food & Dining' },
                      ])
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#1D1B1A] hover:bg-[#282320] text-[#FAF6F0] text-xs font-bold border border-[#FAF6F0]/10"
                  >
                    + Add Another Row
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-[#3AB4B9] hover:bg-[#4FC5CA] active:scale-95 text-[#0A0A0A] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#3AB4B9]/30"
                  >
                    {submitting ? 'Uploading...' : 'Upload All Items'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Totals Card */}
          {summary && (
            <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">
                  This Month Overview ({summary.month.month})
                </span>
                <span
                  className={`font-mono text-xs font-bold ${
                    summary.month.net >= 0 ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'
                  }`}
                >
                  Net: {summary.month.net >= 0 ? `+${formatMoney(summary.month.net)}` : `-${formatMoney(Math.abs(summary.month.net))}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#FAF6F0]/10">
                <div>
                  <span className="text-[#A49690] block text-[10px] uppercase font-bold">Total Inflow:</span>
                  <span className="text-[#3AB4B9] font-mono font-bold text-sm">
                    + {formatMoney(summary.month.incoming || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[#A49690] block text-[10px] uppercase font-bold">Total Outflow:</span>
                  <span className="text-[#D36B4E] font-mono font-bold text-sm">
                    - {formatMoney(summary.month.outgoing || summary.month.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Timeline Log (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
            {/* Header & Filter options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FAF6F0]/10 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#3AB4B9]" />
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">
                  Payments Timeline ({filteredPayments.length})
                </h3>
              </div>

              {/* Flow Filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['All', 'OUTGOING', 'INCOMING'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterFlow(f)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      filterFlow === f
                        ? f === 'INCOMING'
                          ? 'bg-[#3AB4B9] text-[#0A0A0A] shadow-sm'
                          : 'bg-[#D36B4E] text-[#FAF6F0] shadow-sm'
                        : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10'
                    }`}
                  >
                    {f === 'All' ? 'All Flows' : f === 'OUTGOING' ? 'Outgoing (Spent)' : 'Incoming (Received)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Method Filter & Search Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A49690] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by reason, category, notes..."
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['All', 'UPI', 'Cash'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setFilterMethod(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      filterMethod === m
                        ? 'bg-[#1D1B1A] text-[#FAF6F0] border border-[#FAF6F0]/30'
                        : 'bg-[#121212] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Payments List */}
            {loading ? (
              <div className="py-16 text-center text-xs text-[#A49690]">Loading cashflow log...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-16 text-center">
                <WalletCards className="w-12 h-12 text-[#A49690]/40 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-[#FAF6F0]">No payments recorded in this view</h4>
                <p className="text-xs text-[#A49690] mt-1 max-w-xs mx-auto">
                  Record your incoming income or outgoing expenses on the left to populate the log.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map(p => {
                  const isIncoming = p.flow === 'INCOMING';
                  const isUPI = p.paymentMethod === 'UPI';
                  const isSelectedDate = p.date === selectedDate;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isSelectedDate
                          ? 'bg-[#1D1B1A] border-[#FAF6F0]/20 shadow-sm'
                          : 'bg-[#141211] border-[#FAF6F0]/10 hover:border-[#FAF6F0]/20'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                            isIncoming ? 'bg-[#3AB4B9]/15 text-[#3AB4B9]' : 'bg-[#D36B4E]/15 text-[#D36B4E]'
                          }`}
                        >
                          {isIncoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-[#FAF6F0]">{p.reason}</h4>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isIncoming
                                  ? 'bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30'
                                  : 'bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30'
                              }`}
                            >
                              {isIncoming ? 'INCOMING' : 'OUTGOING'}
                            </span>

                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#121212] text-[#A49690] border border-[#FAF6F0]/10">
                              {p.paymentMethod}
                            </span>

                            {p.category && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#121212] text-[#A49690]">
                                {p.category}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#A49690] mt-1 font-mono">
                            {p.date} {p.time ? `at ${p.time}` : ''}
                            {p.notes ? ` • "${p.notes}"` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-11 sm:pl-0">
                        <span
                          className={`font-mono text-base font-extrabold ${
                            isIncoming ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'
                          }`}
                        >
                          {isIncoming ? '+' : '-'} {formatMoney(p.amount)}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1.5 text-[#A49690] hover:text-[#3AB4B9] rounded-lg hover:bg-[#121212] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 text-[#A49690] hover:text-[#D36B4E] rounded-lg hover:bg-[#121212] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
