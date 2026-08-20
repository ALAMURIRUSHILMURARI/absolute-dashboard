import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { PersonBalanceSummary, RelationshipCategory } from '../types';
import { AddPersonModal } from '../components/modals/AddPersonModal';

export const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<PersonBalanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRel, setSelectedRel] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const { formatMoney } = useCurrency();
  const navigate = useNavigate();

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await api.getPeople();
      setPeople(res.people);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const relationships: (RelationshipCategory | 'All')[] = [
    'All',
    'Friend',
    'Colleague',
    'Roommate',
    'Family',
    'Client',
    'Other',
  ];

  const filteredPeople = people.filter(p => {
    const matchesSearch =
      p.person.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.person.phone && p.person.phone.includes(search)) ||
      (p.person.notes && p.person.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesRel = selectedRel === 'All' || p.person.relationship === selectedRel;
    return matchesSearch && matchesRel;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
            <Users className="w-8 h-8 text-[#D36B4E]" />
            <span>People & Financial Tabs</span>
          </h1>
          <p className="text-xs text-[#A49690] mt-1">
            Maintain dedicated personal ledgers and tabs for friends, colleagues, and flatmates.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-95 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#D36B4E]/30 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Person / Tab</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A49690] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search person by name, phone, notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
          />
        </div>

        {/* Relationship filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#A49690] shrink-0 mr-1" />
          {relationships.map(rel => (
            <button
              key={rel}
              onClick={() => setSelectedRel(rel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedRel === rel
                  ? 'bg-[#D36B4E] text-[#FAF6F0] shadow-sm'
                  : 'bg-[#1D1B1A] text-[#A49690] hover:text-[#FAF6F0] border border-[#FAF6F0]/10'
              }`}
            >
              {rel}
            </button>
          ))}
        </div>
      </div>

      {/* People Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#A49690]">Loading people tabs...</div>
      ) : filteredPeople.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 text-center">
          <Users className="w-12 h-12 text-[#A49690]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#FAF6F0]">No people tabs found</h3>
          <p className="text-xs text-[#A49690] mt-1">
            Create a tab for someone to start tracking money you owe or are owed.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider"
          >
            + Create First Person Tab
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map(p => {
            return (
              <div
                key={p.person.id}
                onClick={() => navigate(`/people/${p.person.id}`)}
                className="p-6 rounded-3xl bg-[#121212] hover:bg-[#181514] border border-[#FAF6F0]/10 hover:border-[#D36B4E]/50 transition-all duration-300 shadow-xl cursor-pointer group flex flex-col justify-between"
              >
                {/* Top Profile */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          p.person.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(p.person.name)}&background=D36B4E&color=FAF6F0`
                        }
                        alt={p.person.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-1 ring-[#FAF6F0]/10 group-hover:ring-[#D36B4E] transition-all"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-[#FAF6F0] group-hover:text-[#D36B4E] transition-colors">
                          {p.person.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-[#1D1B1A] text-[#A49690] text-[10px] font-bold">
                          {p.person.relationship}
                        </span>
                      </div>
                    </div>

                    <span className="p-2 rounded-xl bg-[#1D1B1A] border border-[#FAF6F0]/10 text-[#A49690] group-hover:text-[#D36B4E] group-hover:border-[#D36B4E]/30 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Notes / contact */}
                  {p.person.notes && (
                    <p className="text-xs text-[#A49690] mt-3 line-clamp-2 italic">
                      &ldquo;{p.person.notes}&rdquo;
                    </p>
                  )}

                  {/* Contact info */}
                  <div className="mt-3 space-y-1 text-[11px] text-[#A49690]">
                    {p.person.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#A49690]" />
                        <span>{p.person.phone}</span>
                      </div>
                    )}
                    {p.person.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#A49690]" />
                        <span>{p.person.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Ledger Summary Box */}
                <div className="mt-5 pt-4 border-t border-[#FAF6F0]/10">
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="p-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10">
                      <span className="text-[10px] uppercase font-bold text-[#A49690] block">You Owe</span>
                      <span className="font-mono font-bold text-[#D36B4E] text-xs">
                        {formatMoney(p.youOwe)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/10">
                      <span className="text-[10px] uppercase font-bold text-[#A49690] block">They Owe</span>
                      <span className="font-mono font-bold text-[#3AB4B9] text-xs">
                        {formatMoney(p.theyOweYou)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#A49690] font-semibold">Net Tab:</span>
                    <span className={`font-mono font-extrabold text-sm ${
                      p.netBalance > 0 ? 'text-[#3AB4B9]' :
                      p.netBalance < 0 ? 'text-[#D36B4E]' : 'text-[#A49690]'
                    }`}>
                      {p.netBalance > 0 ? `+ ${formatMoney(p.netBalance)}` :
                       p.netBalance < 0 ? `- ${formatMoney(Math.abs(p.netBalance))}` : '₹0 Settled'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AddPersonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchPeople}
      />
    </div>
  );
};
