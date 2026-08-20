import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple' | 'slate' | 'terracotta' | 'tealglaze';
  onClick?: () => void;
  badge?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'terracotta',
  onClick,
  badge,
  className = '',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'terracotta':
      case 'rose':
        return {
          bg: 'bg-[#181514]',
          border: 'border-[#D36B4E]/30 hover:border-[#D36B4E]/60',
          iconBg: 'bg-[#D36B4E]/15 text-[#D36B4E]',
          text: 'text-[#D36B4E]',
          glow: 'group-hover:shadow-[#D36B4E]/15',
        };
      case 'tealglaze':
      case 'emerald':
        return {
          bg: 'bg-[#141818]',
          border: 'border-[#3AB4B9]/30 hover:border-[#3AB4B9]/60',
          iconBg: 'bg-[#3AB4B9]/15 text-[#3AB4B9]',
          text: 'text-[#3AB4B9]',
          glow: 'group-hover:shadow-[#3AB4B9]/15',
        };
      case 'amber':
        return {
          bg: 'bg-[#1C1814]',
          border: 'border-[#D36B4E]/30 hover:border-[#D36B4E]/60',
          iconBg: 'bg-[#D36B4E]/20 text-[#FAF6F0]',
          text: 'text-[#FAF6F0]',
          glow: 'group-hover:shadow-[#D36B4E]/15',
        };
      default:
        return {
          bg: 'bg-[#121212]',
          border: 'border-[#FAF6F0]/10 hover:border-[#FAF6F0]/25',
          iconBg: 'bg-[#1D1B1A] text-[#FAF6F0]',
          text: 'text-[#FAF6F0]',
          glow: 'group-hover:shadow-black/40',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-3xl border ${colors.bg} ${colors.border} transition-all duration-300 shadow-xl backdrop-blur-md ${
        onClick ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.99] group' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">{title}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight ${colors.text}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#A49690] mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${colors.iconBg} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {badge && (
        <div className="mt-4 pt-3.5 border-t border-[#FAF6F0]/10 flex items-center justify-between text-[11px] font-semibold text-[#A49690]">
          <span>{badge}</span>
        </div>
      )}
    </div>
  );
};
