import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Users,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { AnalyticsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { symbol, formatMoney } = useCurrency();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const COLORS = ['#D36B4E', '#3AB4B9', '#E27B5E', '#FAF6F0', '#4FC5CA', '#A49690'];

  const categoryBreakdown = data?.categoryCounts
    ? Object.entries(data.categoryCounts).map(([category, count]) => ({
        category,
        count,
      }))
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#3AB4B9]" />
            <span>Financial Analytics</span>
          </h1>
          <p className="text-xs text-[#A49690] mt-1">
            Cash flow trends, debt distribution, category breakdown, and highest value tabs.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#121212] hover:bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-bold uppercase tracking-wider self-start md:self-auto transition-all"
        >
          <Download className="w-4 h-4 text-[#D36B4E]" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* 3 Executive Stat Cards */}
      {data?.overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">Total Outgoing (You Owe)</span>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#D36B4E] mt-2">
              {formatMoney(data.overview.totalYouOwe)}
            </p>
            <p className="text-xs text-[#A49690] mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#D36B4E]" />
              <span>Pending debt liabilities</span>
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">Total Incoming (Others Owe)</span>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#3AB4B9] mt-2">
              {formatMoney(data.overview.totalOthersOweYou)}
            </p>
            <p className="text-xs text-[#A49690] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#3AB4B9]" />
              <span>Expected debt receivables</span>
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">Net Financial Position</span>
            <p className={`text-2xl sm:text-3xl font-extrabold font-mono mt-2 ${data.overview.netBalance >= 0 ? 'text-[#3AB4B9]' : 'text-[#D36B4E]'}`}>
              {formatMoney(data.overview.netBalance, true)}
            </p>
            <p className="text-xs text-[#A49690] mt-1">
              {data.overview.netBalance >= 0 ? 'Surplus receivable' : 'Deficit liability'}
            </p>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Cashflow Bar Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3AB4B9]" />
            <span>Monthly Cashflow Comparison (Money In vs Money Out)</span>
          </h3>

          <div className="h-72 w-full pt-4">
            {(!data?.monthlyTrends || data.monthlyTrends.length === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-[#A49690]">
                No monthly transactions to display
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#A49690" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A49690" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: 'rgba(250,246,240,0.15)',
                      borderRadius: '1rem',
                      color: '#FAF6F0',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${symbol} ${value}`, '']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={(val) => <span className="text-[#FAF6F0]">{val === 'moneyOut' ? 'Total Money Out (Daily Expenses + Debts Owed)' : 'Total Money In (Daily Income + Receivables)'}</span>}
                  />
                  <Bar dataKey="moneyOut" name="moneyOut" fill="#D36B4E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="moneyIn" name="moneyIn" fill="#3AB4B9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#D36B4E]" />
            <span>Transaction Status Breakdown</span>
          </h3>

          <div className="h-72 w-full">
            {(!data?.statusBreakdown || data.statusBreakdown.every(s => s.value === 0)) ? (
              <div className="h-full flex items-center justify-center text-xs text-[#A49690]">
                No transaction records yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {data.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: 'rgba(250,246,240,0.15)',
                      borderRadius: '1rem',
                      color: '#FAF6F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(val) => <span className="text-[#FAF6F0]">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Active Tabs Leaderboard */}
      <div className="p-6 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4 text-[#D36B4E]" />
          <span>Top Active People Tabs</span>
        </h3>

        {(!data?.activeTabs || data.activeTabs.length === 0) ? (
          <div className="py-8 text-center text-xs text-[#A49690]">No active tabs found</div>
        ) : (
          <div className="divide-y divide-[#FAF6F0]/10">
            {data.activeTabs.map((item, idx) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-[#A49690] w-4">{idx + 1}.</span>
                  <img
                    src={item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=D36B4E&color=FAF6F0`}
                    alt={item.name}
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#FAF6F0]">{item.name}</p>
                    <span className="text-[10px] text-[#A49690]">{item.relationship} • {item.transactionsCount} txs</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xs font-mono font-bold ${item.netBalance > 0 ? 'text-[#3AB4B9]' : item.netBalance < 0 ? 'text-[#D36B4E]' : 'text-[#A49690]'}`}>
                    Net: {item.netBalance > 0 ? `+${formatMoney(item.netBalance)}` : item.netBalance < 0 ? `-${formatMoney(Math.abs(item.netBalance))}` : '₹0'}
                  </p>
                  <p className="text-[10px] text-[#A49690]">
                    You owe: {formatMoney(item.youOwe)} | They owe: {formatMoney(item.theyOweYou)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
