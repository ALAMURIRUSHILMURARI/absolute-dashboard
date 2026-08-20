import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { DueItem } from '../types';
import { SettleUpModal } from '../components/modals/SettleUpModal';

export const DuesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [filter, setFilter] = useState<string>(initialFilter);
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [iOwe, setIOwe] = useState<DueItem[]>([]);
  const [theyOweMe, setTheyOweMe] = useState<DueItem[]>([]);
  const [summary, setSummary] = useState({
    totalIOwe: 0,
    totalTheyOweMe: 0,
    netBalance: 0,
    iOweCount: 0,
    theyOweMeCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Settle modal state
  const [settleTarget, setSettleTarget] = useState<DueItem | null>(null);

  const { symbol, formatMoney } = useCurrency();
  const navigate = useNavigate();

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await api.getDues({ filter, sortBy });
      setIOwe(res.iOwe);
      setTheyOweMe(res.theyOweMe);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, [filter, sortBy]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setSearchParams(newFilter === 'all' ? {} : { filter: newFilter });
  };

  const getStatusBadge = (dueStatus: DueItem['dueStatus'], daysDiff: number) => {
    switch (dueStatus) {
      case 'Overdue':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 text-[10px] font-bold uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Overdue ({Math.abs(daysDiff)}d ago)</span>
          </span>
        );
      case 'Due Today':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-[#D36B4E]/20 text-[#FAF6F0] border border-[#D36B4E]/50 text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3 text-[#D36B4E]" />
            <span>Due Today!</span>
          </span>
        );
      case 'Due Soon':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30 text-[10px] font-bold uppercase">
            In {daysDiff} days
          </span>
        );
      case 'Settled':
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30 text-[10px] font-bold uppercase">
            Settled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md bg-[#1D1B1A] text-[#A49690] text-[10px] font-semibold">
            No Due Date
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
            <Receipt className="w-8 h-8 text-[#D36B4E]" />
            <span>Dues & Debts Manager</span>
          </h1>
          <p className="text-xs text-[#A49690] mt-1">
            Instant split view of payments you need to make vs money you need to collect.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-[#121212] border border-[#FAF6F0]/10 px-5 py-3 rounded-2xl shadow-inner">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A49690] block tracking-wider">Total Net Dues</span>
            <span className={`text-base font-serif font-extrabold ${summary.netBalance >= 0 ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
              {formatMoney(summary.netBalance, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="p-4 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#A49690] shrink-0 mr-1" />
          {[
            { id: 'all', label: 'All Dues' },
            { id: 'due_today', label: 'Due Today 🔥' },
            { id: 'overdue', label: 'Overdue ⚠️' },
            { id: 'due_soon', label: 'Due Soon (7 Days)' },
            { id: 'settled', label: 'Settled' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-[#D36B4E] text-[#FAF6F0] shadow-sm'
                  : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-[#A49690] self-start md:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#A49690]" />
          <span className="font-semibold">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-medium focus:border-[#D36B4E] focus:outline-none"
          >
            <option value="due_date">Due Date (Urgent first)</option>
            <option value="amount">Amount (Highest first)</option>
            <option value="person">Person Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* DUAL COLUMN SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: I OWE */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D36B4E]/15 text-[#D36B4E]">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">I Owe (Outgoing)</h3>
                <p className="text-[11px] text-[#A49690]">Money you need to pay back</p>
              </div>
            </div>

            <span className="font-mono text-base font-extrabold text-[#D36B4E]">
              {formatMoney(summary.totalIOwe)}
            </span>
          </div>

          {iOwe.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A49690]">
              Zero pending outgoing dues in this view
            </div>
          ) : (
            <div className="space-y-3">
              {iOwe.map(item => (
                <div
                  key={item.transaction.id}
                  className="p-4 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 hover:border-[#D36B4E]/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.personAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(item.personName)}&background=D36B4E&color=FAF6F0`
                        }
                        alt={item.personName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#FAF6F0]/10"
                      />
                      <div>
                        <button
                          onClick={() => navigate(`/people/${item.transaction.personId}`)}
                          className="text-xs font-bold text-[#FAF6F0] hover:text-[#D36B4E] transition-colors text-left"
                        >
                          {item.personName}
                        </button>
                        <p className="text-[11px] text-[#A49690]">{item.transaction.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-mono font-extrabold text-[#D36B4E]">
                        {formatMoney(item.transaction.remainingAmount || item.transaction.amount)}
                      </p>
                      <div className="mt-1 flex justify-end">
                        {getStatusBadge(item.dueStatus, item.daysDifference)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#FAF6F0]/10 flex items-center justify-between text-[11px] text-[#A49690]">
                    <span>Due: <b className="text-[#FAF6F0] font-mono">{item.transaction.dueDate || 'Flexible'}</b></span>

                    {item.transaction.status !== 'Settled' && (
                      <button
                        onClick={() => setSettleTarget(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#D36B4E]/15 hover:bg-[#D36B4E]/25 text-[#D36B4E] text-xs font-bold border border-[#D36B4E]/30 transition-all"
                      >
                        Pay / Settle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 2: THEY OWE ME */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#3AB4B9]/15 text-[#3AB4B9]">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">They Owe Me (Incoming)</h3>
                <p className="text-[11px] text-[#A49690]">Money you are supposed to receive</p>
              </div>
            </div>

            <span className="font-mono text-base font-extrabold text-[#3AB4B9]">
              {formatMoney(summary.totalTheyOweMe)}
            </span>
          </div>

          {theyOweMe.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#A49690]">
              Zero pending incoming dues in this view
            </div>
          ) : (
            <div className="space-y-3">
              {theyOweMe.map(item => (
                <div
                  key={item.transaction.id}
                  className="p-4 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10 hover:border-[#3AB4B9]/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.personAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(item.personName)}&background=3AB4B9&color=0A0A0A`
                        }
                        alt={item.personName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#FAF6F0]/10"
                      />
                      <div>
                        <button
                          onClick={() => navigate(`/people/${item.transaction.personId}`)}
                          className="text-xs font-bold text-[#FAF6F0] hover:text-[#3AB4B9] transition-colors text-left"
                        >
                          {item.personName}
                        </button>
                        <p className="text-[11px] text-[#A49690]">{item.transaction.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-mono font-extrabold text-[#3AB4B9]">
                        {formatMoney(item.transaction.remainingAmount || item.transaction.amount)}
                      </p>
                      <div className="mt-1 flex justify-end">
                        {getStatusBadge(item.dueStatus, item.daysDifference)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#FAF6F0]/10 flex items-center justify-between text-[11px] text-[#A49690]">
                    <span>Due: <b className="text-[#FAF6F0] font-mono">{item.transaction.dueDate || 'Flexible'}</b></span>

                    {item.transaction.status !== 'Settled' && (
                      <button
                        onClick={() => setSettleTarget(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#3AB4B9]/15 hover:bg-[#3AB4B9]/25 text-[#3AB4B9] text-xs font-bold border border-[#3AB4B9]/30 transition-all"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settle Up modal */}
      {settleTarget && (
        <SettleUpModal
          isOpen={true}
          onClose={() => setSettleTarget(null)}
          onSuccess={fetchDues}
          person={{
            id: settleTarget.transaction.personId,
            name: settleTarget.personName,
            relationship: settleTarget.personRelationship as any,
            userId: settleTarget.transaction.userId,
            createdAt: '',
            updatedAt: '',
          }}
          currentNetBalance={
            settleTarget.transaction.direction === 'THEY_OWE_ME'
              ? (settleTarget.transaction.remainingAmount || settleTarget.transaction.amount)
              : -(settleTarget.transaction.remainingAmount || settleTarget.transaction.amount)
          }
          specificTxId={settleTarget.transaction.id}
          specificAmount={settleTarget.transaction.remainingAmount || settleTarget.transaction.amount}
        />
      )}
    </div>
  );
};
