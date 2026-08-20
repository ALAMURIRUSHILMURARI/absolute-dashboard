import React, { useState } from 'react';
import { Zap, ShieldCheck, ArrowRight, Sparkles, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, signup, demoLogin } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAF6F0] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D36B4E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#3AB4B9]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D36B4E] to-[#B5553B] shadow-2xl shadow-[#D36B4E]/30 mb-4">
            <Zap className="w-8 h-8 text-[#FAF6F0] fill-[#FAF6F0]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider font-serif text-[#FAF6F0]">
            ABSOLUTE
          </h1>
          <p className="text-xs text-[#A49690] mt-1.5 max-w-xs mx-auto">
            Personal Command Center • Schedules, Money Tabs, Dues & Financial Ledger
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-6 p-5 rounded-3xl bg-[#121212] border border-[#D36B4E]/30 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D36B4E] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#D36B4E]" />
                <span>Instant Sign In</span>
              </div>
              <p className="text-xs text-[#A49690] mt-1">
                Enter your private vault with persistent real-time storage.
              </p>
            </div>
          </div>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="mt-4 w-full py-3 px-4 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-98 text-[#FAF6F0] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D36B4E]/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Enter Vault (1-Click)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Form Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#FAF6F0]/10">
            <h2 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-widest">
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </h2>
            <button
              onClick={() => {
                setIsLoginMode(prev => !prev);
                setError('');
              }}
              className="text-xs font-bold text-[#D36B4E] hover:underline"
            >
              {isLoginMode ? 'New user? Sign up' : 'Have an account? Sign in'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#D36B4E]/15 border border-[#D36B4E]/30 text-[#FAF6F0] text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#A49690]" />
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Rushil Murari"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#A49690]" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#A49690]" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] active:scale-98 text-[#FAF6F0] font-bold text-xs uppercase tracking-wider shadow-xl shadow-[#D36B4E]/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLoginMode ? 'Sign In to Command Center' : 'Create My Account'}
            </button>
          </form>

          {/* Privacy badge */}
          <div className="mt-6 pt-4 border-t border-[#FAF6F0]/10 flex items-center justify-center gap-2 text-[11px] text-[#A49690]">
            <ShieldCheck className="w-4 h-4 text-[#3AB4B9]" />
            <span>Encrypted • Private • Multi-User Isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
