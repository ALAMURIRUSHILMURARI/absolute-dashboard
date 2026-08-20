import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Receipt,
  Plus,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { Person, Transaction } from '../types';
import { SettleUpModal } from '../components/modals/SettleUpModal';
import { AddTransactionModal } from '../components/modals/AddTransactionModal';

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();

  const [person, setPerson] = useState<Person | null>(null);
  const [balances, setBalances] = useState({
    youOwe: 0,
    theyOweYou: 0,
    netBalance: 0,
    pendingCount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [settleOpen, setSettleOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [selectedTxForSettle, setSelectedTxForSettle] = useState<{ id: string; amount: number } | null>(null);

  const fetchPersonData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPerson(id);
      setPerson(res.person);
      setBalances(res.balances);
      setTransactions(res.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonData();
  }, [id]);

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm('Delete this ledger record?')) return;
    try {
      await api.deleteTransaction(txId);
      fetchPersonData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePerson = async () => {
    if (!person) return;
    if (!window.confirm(`Delete ${person.name}'s tab and all ledger history? This cannot be undone.`)) return;
    try {
      await api.deletePerson(person.id);
      navigate('/people');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#A49690]">Loading personal ledger...</div>;
  }

  if (!person) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-bold text-[#FAF6F0]">Person tab not found</p>
        <button
          onClick={() => navigate('/people')}
          className="px-4 py-2 rounded-2xl bg-[#1D1B1A] text-[#FAF6F0] text-xs font-semibold"
        >
          ← Back to People
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Back Navigation & Person Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/people')}
            className="p-2.5 rounded-2xl bg-[#121212] border border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0] hover:border-[#FAF6F0]/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-[#FAF6F0] font-serif">{person.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 text-xs font-bold">
                {person.relationship}
              </span>
            </div>
            <p className="text-xs text-[#A49690] mt-0.5">
              Personal Tab & Transaction Ledger
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedTxForSettle(null);
              setSettleOpen(true);
            }}
            disabled={balances.netBalance === 0}
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-95 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#D36B4E]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>Settle Up</span>
          </button>

          <button
            onClick={() => setAddTxOpen(true)}
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[#121212] hover:bg-[#1D1B1A] active:scale-95 text-[#FAF6F0] border border-[#FAF6F0]/20 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Person Summary Card */}
      <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={
              person.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=D36B4E&color=FAF6F0`
            }
            alt={person.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#D36B4E]/40"
          />
          <div>
            <h3 className="text-base font-bold text-[#FAF6F0]">{person.name}</h3>
            {person.notes && (
              <p className="text-xs text-[#A49690] mt-1 italic">&ldquo;{person.notes}&rdquo;</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#A49690]">
              {person.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#A49690]" />
                  <span>{person.phone}</span>
                </div>
              )}
              {person.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#A49690]" />
                  <span>{person.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleDeletePerson}
          className="text-xs text-[#A49690] hover:text-[#D36B4E] transition-colors self-start md:self-auto font-semibold"
        >
          Delete Tab
        </button>
      </div>

      {/* 3 Prominent Hero Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* You Owe */}
        <div className="p-6 rounded-3xl bg-[#181514] border border-[#D36B4E]/30 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">You Owe {person.name}</span>
            <div className="p-2 rounded-xl bg-[#D36B4E]/15 text-[#D36B4E]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#D36B4E] mt-2">
            {formatMoney(balances.youOwe)}
          </p>
          <p className="text-[11px] text-[#A49690] mt-1">Pending payments you need to transfer</p>
        </div>

        {/* They Owe You */}
        <div className="p-6 rounded-3xl bg-[#141818] border border-[#3AB4B9]/30 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">{person.name} Owes You</span>
            <div className="p-2 rounded-xl bg-[#3AB4B9]/15 text-[#3AB4B9]">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#3AB4B9] mt-2">
            {formatMoney(balances.theyOweYou)}
          </p>
          <p className="text-[11px] text-[#A49690] mt-1">Money you are supposed to collect</p>
        </div>

        {/* Net Tab */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">Net Tab Balance</span>
            <div className="p-2 rounded-xl bg-[#1D1B1A] text-[#FAF6F0]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-extrabold font-mono mt-2 ${
            balances.netBalance > 0 ? 'text-[#3AB4B9]' : balances.netBalance < 0 ? 'text-[#D36B4E]' : 'text-[#FAF6F0]'
          }`}>
            {balances.netBalance > 0 ? `+ ${formatMoney(balances.netBalance)}` :
             balances.netBalance < 0 ? `- ${formatMoney(Math.abs(balances.netBalance))}` : '₹0 Settled'}
          </p>
          <p className="text-[11px] text-[#A49690] mt-1">
            {balances.netBalance > 0 ? `${person.name} owes you net ${formatMoney(balances.netBalance)}` :
             balances.netBalance < 0 ? `You owe ${person.name} net ${formatMoney(Math.abs(balances.netBalance))}` : 'Tab is completely settled'}
          </p>
        </div>
      </div>

      {/* Complete Transaction Ledger History */}
      <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#FAF6F0]/10 pb-3.5">
          <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#D36B4E]" />
            <span>Complete Ledger History ({transactions.length} records)</span>
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A49690]">
            No transactions in this ledger yet. Click &quot;+ Add Transaction&quot; above.
          </div>
        ) : (
          <div className="divide-y divide-[#FAF6F0]/10">
            {transactions.map(t => {
              const isTheyOwe = t.direction === 'THEY_OWE_ME';
              const isPartial = t.status === 'Partial';
              const isSettled = t.status === 'Settled';
              const isOverdue = t.status === 'Overdue';

              return (
                <div
                  key={t.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl mt-0.5 shrink-0 ${isTheyOwe ? 'bg-[#3AB4B9]/15 text-[#3AB4B9]' : 'bg-[#D36B4E]/15 text-[#D36B4E]'}`}>
                      {isTheyOwe ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#FAF6F0]">{t.description}</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1D1B1A] text-[#A49690]">
                          {t.type}
                        </span>
                        {t.isSettlement && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30">
                            SETTLEMENT
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#A49690] mt-1">
                        {t.date} • Paid via <span className="font-semibold text-[#FAF6F0]">{t.paymentMethod}</span>
                        {t.dueDate && ` • Due ${t.dueDate}`}
                      </p>

                      {t.notes && (
                        <p className="text-xs text-[#A49690] mt-0.5 italic">
                          Note: {t.notes}
                        </p>
                      )}

                      {/* Partial Payment Calculation Display */}
                      {isPartial && (
                        <div className="mt-2 p-2.5 rounded-2xl bg-[#1D1B1A] border border-[#D36B4E]/30 text-xs font-mono flex items-center gap-4 text-[#A49690]">
                          <span>Original: <b className="text-[#FAF6F0]">{formatMoney(t.originalAmount || t.amount)}</b></span>
                          <span>Paid: <b className="text-[#3AB4B9]">{formatMoney(t.paidAmount || 0)}</b></span>
                          <span>Remaining: <b className="text-[#D36B4E]">{formatMoney(t.remainingAmount)}</b></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <p className={`text-base font-extrabold font-mono ${isTheyOwe ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
                        {isTheyOwe ? '+' : '-'} {formatMoney(t.amount)}
                      </p>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                        isSettled ? 'bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30' :
                        isOverdue ? 'bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30' :
                        isPartial ? 'bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30' :
                        'bg-[#1D1B1A] text-[#A49690]'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isSettled && (
                        <button
                          onClick={() => {
                            setSelectedTxForSettle({ id: t.id, amount: t.remainingAmount || t.amount });
                            setSettleOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#D36B4E]/15 hover:bg-[#D36B4E]/25 text-[#D36B4E] text-xs font-bold border border-[#D36B4E]/30"
                        >
                          Settle
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-2 text-[#A49690] hover:text-[#D36B4E] rounded-xl hover:bg-[#1D1B1A]"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Up Modal */}
      {settleOpen && (
        <SettleUpModal
          isOpen={true}
          onClose={() => {
            setSettleOpen(false);
            setSelectedTxForSettle(null);
          }}
          onSuccess={fetchPersonData}
          person={person}
          currentNetBalance={balances.netBalance}
          specificTxId={selectedTxForSettle?.id}
          specificAmount={selectedTxForSettle?.amount}
        />
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        onSuccess={fetchPersonData}
        preselectedPersonId={person.id}
      />
    </div>
  );
};
