import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Receipt, Calendar, Bell, ArrowRight, CornerDownLeft } from 'lucide-react';
import { api } from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    people: any[];
    transactions: any[];
    schedules: any[];
    reminders: any[];
  }>({
    people: [],
    transactions: [],
    schedules: [],
    reminders: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ people: [], transactions: [], schedules: [], reminders: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ people: [], transactions: [], schedules: [], reminders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults({
          people: res.people || [],
          transactions: res.transactions || [],
          schedules: res.schedules || [],
          reminders: res.reminders || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.people.length +
    results.transactions.length +
    results.schedules.length +
    results.reminders.length;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />
      <div className="w-full max-w-2xl rounded-3xl bg-[#121212] border border-[#FAF6F0]/15 shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="flex items-center px-5 py-4 border-b border-[#FAF6F0]/10 bg-[#0A0A0A]">
          <Search className="w-5 h-5 text-[#D36B4E] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people, transactions, schedules, dues, notes..."
            className="flex-1 bg-transparent border-none outline-none text-[#FAF6F0] placeholder:text-[#A49690] text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-[#A49690] hover:text-[#FAF6F0] mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-mono text-[#A49690] bg-[#1D1B1A] rounded border border-[#FAF6F0]/10 cursor-pointer hover:bg-[#282320]"
          >
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#A49690]">Searching command center...</div>
          ) : query && totalResults === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-[#FAF6F0]">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[#A49690] mt-1">Try searching for a person name, schedule title, or payment detail.</p>
            </div>
          ) : !query ? (
            <div className="py-8 px-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#A49690]">Quick Filters</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {['Loan', 'Dinner', 'College', 'Rent', 'Exam'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1D1B1A] hover:bg-[#282320] text-xs text-[#FAF6F0] border border-[#FAF6F0]/10 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* People Results */}
              {results.people.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#A49690] uppercase tracking-wider mb-2">
                    <Users className="w-3.5 h-3.5 text-[#D36B4E]" />
                    <span>People ({results.people.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.people.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelect(`/people/${p.id}`)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#1D1B1A] border border-transparent hover:border-[#D36B4E]/30 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=D36B4E&color=FAF6F0`
                            }
                            alt={p.name}
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#FAF6F0] group-hover:text-[#D36B4E]">{p.name}</p>
                            <p className="text-[11px] text-[#A49690]">{p.relationship} {p.phone ? `• ${p.phone}` : ''}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#A49690] group-hover:text-[#D36B4E] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions Results */}
              {results.transactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#A49690] uppercase tracking-wider mb-2">
                    <Receipt className="w-3.5 h-3.5 text-[#3AB4B9]" />
                    <span>Transactions ({results.transactions.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.transactions.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect(`/people/${t.personId}`)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#1D1B1A] border border-transparent hover:border-[#3AB4B9]/30 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#FAF6F0] group-hover:text-[#3AB4B9]">{t.description}</p>
                          <p className="text-[11px] text-[#A49690]">{t.personName} • {t.type} • {t.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold font-mono ${t.direction === 'THEY_OWE_ME' ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
                            {t.direction === 'THEY_OWE_ME' ? '+' : '-'} {formatMoney(t.amount)}
                          </p>
                          <span className="text-[10px] text-[#A49690] uppercase">{t.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedules Results */}
              {results.schedules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#A49690] uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-[#D36B4E]" />
                    <span>Schedules ({results.schedules.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.schedules.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelect('/schedule')}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#1D1B1A] border border-transparent hover:border-[#D36B4E]/30 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#FAF6F0] group-hover:text-[#D36B4E]">{s.title}</p>
                          <p className="text-[11px] text-[#A49690]">{s.category} • {s.date} at {s.startTime}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#D36B4E]/15 text-[#D36B4E] border border-[#D36B4E]/30 font-bold">
                          {s.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminders Results */}
              {results.reminders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#A49690] uppercase tracking-wider mb-2">
                    <Bell className="w-3.5 h-3.5 text-[#3AB4B9]" />
                    <span>Reminders ({results.reminders.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.reminders.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect('/reminders')}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#1D1B1A] border border-transparent hover:border-[#3AB4B9]/30 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#FAF6F0] group-hover:text-[#3AB4B9]">{r.title}</p>
                          <p className="text-[11px] text-[#A49690]">{r.date} at {r.time}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30 font-bold">
                          {r.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0A0A0A] border-t border-[#FAF6F0]/10 flex items-center justify-between text-[11px] text-[#A49690]">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-[#1D1B1A] rounded text-[#FAF6F0]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[#1D1B1A] rounded text-[#FAF6F0]">↓</kbd></span>
          <span className="flex items-center gap-1">Press <CornerDownLeft className="w-3 h-3" /> to select</span>
        </div>
      </div>
    </div>
  );
};
