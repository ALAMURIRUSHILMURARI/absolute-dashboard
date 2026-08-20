import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Receipt, UserPlus, Bell, WalletCards } from 'lucide-react';

interface QuickAddFABProps {
  onAddSchedule: () => void;
  onAddTransaction: () => void;
  onAddPerson: () => void;
  onAddReminder: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({
  onAddSchedule,
  onAddTransaction,
  onAddPerson,
  onAddReminder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Daily Payment (UPI/Cash)',
      icon: WalletCards,
      color: 'bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0]',
      onClick: () => {
        setIsOpen(false);
        navigate('/daily-payments');
      },
    },
    {
      label: 'Tab Transaction',
      icon: Receipt,
      color: 'bg-[#1D1B1A] hover:bg-[#282320] text-[#FAF6F0] border border-[#FAF6F0]/20',
      onClick: () => {
        setIsOpen(false);
        onAddTransaction();
      },
    },
    {
      label: 'Schedule',
      icon: Calendar,
      color: 'bg-[#3AB4B9] hover:bg-[#4FC5CA] text-[#0A0A0A]',
      onClick: () => {
        setIsOpen(false);
        onAddSchedule();
      },
    },
    {
      label: 'Person / Tab',
      icon: UserPlus,
      color: 'bg-[#1D1B1A] hover:bg-[#282320] text-[#FAF6F0] border border-[#FAF6F0]/20',
      onClick: () => {
        setIsOpen(false);
        onAddPerson();
      },
    },
    {
      label: 'Reminder',
      icon: Bell,
      color: 'bg-[#B5553B] hover:bg-[#D36B4E] text-[#FAF6F0]',
      onClick: () => {
        setIsOpen(false);
        onAddReminder();
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed dial items */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-3 z-40 animate-in fade-in slide-in-from-bottom-4 duration-150">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#121212] border border-[#FAF6F0]/15 shadow-2xl shadow-black hover:scale-105 active:scale-95 transition-all text-xs font-bold text-[#FAF6F0] group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="text-[#A49690] group-hover:text-[#FAF6F0]">{action.label}</span>
                <div className={`p-2 rounded-xl ${action.color} shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Floating Trigger */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative z-40 w-14 h-14 rounded-2xl flex items-center justify-center text-[#FAF6F0] shadow-2xl shadow-[#D36B4E]/30 transition-all duration-300 active:scale-95 ${
          isOpen
            ? 'bg-[#1D1B1A] rotate-45 border border-[#FAF6F0]/20'
            : 'bg-gradient-to-tr from-[#D36B4E] to-[#E27B5E] hover:scale-105'
        }`}
        title="Quick Add"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
