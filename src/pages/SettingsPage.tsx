import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Download,
  Upload,
  Check,
  Sparkles,
  Database,
  Moon,
  Sun,
  IndianRupee,
  Mail,
  Flame,
  Zap,
  Clock,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { CurrencyCode, SchedulePriority } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { currency, setCurrency, symbol } = useCurrency();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [alertEmail, setAlertEmail] = useState(user?.preferences?.alertEmail || 'mail4murari27@gmail.com');
  const [smtpUser, setSmtpUser] = useState(user?.preferences?.smtpUser || user?.preferences?.alertEmail || 'mail4murari27@gmail.com');
  const [smtpPass, setSmtpPass] = useState(user?.preferences?.smtpPass || '');
  const [showSmtpSetup, setShowSmtpSetup] = useState(!user?.preferences?.smtpPass);

  const [updating, setUpdating] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [testingPriority, setTestingPriority] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setMessage('');
    try {
      await api.updateProfile({ name, avatarUrl });
      await api.updatePreferences({ alertEmail: alertEmail.trim() });
      await refreshUser();
      setSavedSuccess(true);
      setMessage('Profile and target alert email updated successfully!');
      setTimeout(() => {
        setSavedSuccess(false);
        setMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpUser.trim() || !smtpPass.trim()) {
      setError('Please enter both your Gmail address and 16-character Google App Password.');
      return;
    }

    setSavingSmtp(true);
    setError('');
    setMessage('');
    try {
      const res = await api.saveSmtpConfig({
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
      });
      await refreshUser();
      setMessage(`✅ Connected to Gmail SMTP! Real emails will now deliver directly to ${res.smtpUser}`);
      setShowSmtpSetup(false);
      setTimeout(() => setMessage(''), 6000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify Gmail SMTP credentials');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSendTestPriorityEmail = async (priority: SchedulePriority) => {
    try {
      setTestingPriority(priority);
      setError('');
      setMessage('');
      const res = await api.sendTestPriorityEmail(priority, alertEmail.trim());
      if (res.result?.isLiveDelivered) {
        setMessage(`🚀 Live ${priority} priority alert email sent directly to your inbox (${alertEmail.trim()})! Check your inbox.`);
      } else {
        setMessage(
          `✉️ Dispatched ${priority} test email for ${alertEmail.trim()}! (Configure your Gmail App Password below to deliver live to your inbox).`
        );
      }
      setTimeout(() => setMessage(''), 6000);
    } catch (err: any) {
      setError(err.message || 'Failed to send test email');
    } finally {
      setTestingPriority(null);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `absolute_command_center_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Full JSON vault backup downloaded.');
    } catch (e) {
      setError('Failed to export vault data');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!window.confirm('Import this backup into your account? Existing data will be merged.')) return;
      await api.importData(json);
      setMessage('Backup restored successfully! Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to restore JSON backup');
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Clear all your transactions, people tabs, schedules, and reminders? This leaves a completely empty vault.')) return;
    try {
      await api.importData({
        people: [],
        transactions: [],
        dailyPayments: [],
        schedules: [],
        reminders: [],
        notifications: [],
      });
      setMessage('Vault cleaned. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError('Failed to clean vault');
    }
  };

  const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { code: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', label: 'Euro (€)', symbol: '€' },
    { code: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { code: 'CAD', label: 'Canadian Dollar (CA$)', symbol: 'CA$' },
    { code: 'AUD', label: 'Australian Dollar (AU$)', symbol: 'AU$' },
  ];

  const hasLiveSmtp = Boolean(user?.preferences?.smtpPass);

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FAF6F0] tracking-wider font-serif flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-[#D36B4E]" />
          <span>Settings & Vault Storage</span>
        </h1>
        <p className="text-xs text-[#A49690] mt-1">
          Preferences, live schedule email alerts, currency format, and data backup controls.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#3AB4B9]/15 border border-[#3AB4B9]/30 text-[#FAF6F0] text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#3AB4B9]" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#D36B4E]/15 border border-[#D36B4E]/30 text-[#FAF6F0] text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 1. Schedule Email Alert Notifications (30-min prior) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-[#D36B4E]/30 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#FAF6F0]/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D36B4E]/15 text-[#D36B4E]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FAF6F0] uppercase tracking-widest flex items-center gap-2">
                <span>Schedule 30-Min Email Alerts</span>
                <span className="px-2 py-0.5 text-[9px] rounded-full bg-[#3AB4B9]/15 text-[#3AB4B9] border border-[#3AB4B9]/30">
                  Priority-Themed
                </span>
              </h2>
              <p className="text-xs text-[#A49690]">
                Dispatches a color-coded HTML email alert 30 minutes before any schedule event starts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                hasLiveSmtp
                  ? 'bg-[#3AB4B9]/15 text-[#3AB4B9] border-[#3AB4B9]/40'
                  : 'bg-[#D36B4E]/15 text-[#D36B4E] border-[#D36B4E]/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{hasLiveSmtp ? 'Live SMTP Active' : 'Setup Real SMTP'}</span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Target Email Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest flex items-center gap-1">
              <span>Target Notification Email</span>
              <span className="text-[#D36B4E] font-bold">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                placeholder="mail4murari27@gmail.com"
                className="flex-1 px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-mono font-bold focus:border-[#D36B4E] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updating}
                className="px-5 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-[#A49690]">
              Alerts for upcoming events (exams, meetings, work) will be delivered to <b className="text-[#FAF6F0] font-mono">{alertEmail}</b>.
            </p>
          </div>

          {/* Real Gmail SMTP Setup Box */}
          <div className="p-5 rounded-2xl bg-[#181514] border border-[#D36B4E]/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D36B4E]" />
                <h3 className="text-xs font-bold text-[#FAF6F0] uppercase tracking-wider">
                  Live Gmail Delivery Setup (To receive actual inbox emails)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSmtpSetup(prev => !prev)}
                className="text-xs font-bold text-[#3AB4B9] hover:underline"
              >
                {showSmtpSetup ? 'Hide Setup' : hasLiveSmtp ? 'Change Credentials' : 'Configure Now →'}
              </button>
            </div>

            {showSmtpSetup && (
              <form onSubmit={handleSaveSmtp} className="space-y-3.5 pt-2">
                <div className="p-3 rounded-xl bg-[#121212] border border-[#FAF6F0]/10 text-xs text-[#A49690] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#FAF6F0] font-bold">
                    <Info className="w-3.5 h-3.5 text-[#3AB4B9]" />
                    <span>How to get a Google App Password (takes 1 minute):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] pl-1">
                    <li>
                      Visit{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3AB4B9] font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        Google App Passwords <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>Ensure 2-Step Verification is enabled on your Google Account.</li>
                    <li>Type App Name &quot;ABSOLUTE&quot; and click <b>Create</b>.</li>
                    <li>Copy the 16-letter password and paste it below.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                      Sender Gmail Address
                    </label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={e => setSmtpUser(e.target.value)}
                      placeholder="mail4murari27@gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-mono focus:border-[#D36B4E] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
                      16-Character App Password
                    </label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={e => setSmtpPass(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs font-mono focus:border-[#D36B4E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="px-5 py-2.5 rounded-xl bg-[#3AB4B9] hover:bg-[#4FC5CA] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider shadow-md shadow-[#3AB4B9]/20 flex items-center gap-2 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingSmtp ? 'Verifying with Google...' : 'Verify & Save Gmail SMTP'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Test Priority Email Buttons */}
          <div className="pt-3 border-t border-[#FAF6F0]/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A49690]">
                Instant Test Priority Alerts
              </span>
              <span className="text-[10px] text-[#3AB4B9] font-mono">
                {hasLiveSmtp ? 'Direct Delivery to Inbox' : 'Ready to Send'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Urgent Test Button */}
              <button
                type="button"
                disabled={testingPriority !== null}
                onClick={() => handleSendTestPriorityEmail('Urgent')}
                className="p-3.5 rounded-2xl bg-[#381611] hover:bg-[#4A1D16] border border-[#E05A47]/60 text-[#FFA092] flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-95 group shadow-lg shadow-[#E05A47]/20"
              >
                <Flame className="w-4 h-4 text-[#E05A47] group-hover:scale-110 transition-transform" />
                <span>{testingPriority === 'Urgent' ? 'Sending...' : '🔥 Test Urgent (Red)'}</span>
              </button>

              {/* High Test Button */}
              <button
                type="button"
                disabled={testingPriority !== null}
                onClick={() => handleSendTestPriorityEmail('High')}
                className="p-3.5 rounded-2xl bg-[#2E1C18] hover:bg-[#3D2520] border border-[#D36B4E]/60 text-[#E27B5E] flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-95 group shadow-lg shadow-[#D36B4E]/20"
              >
                <Zap className="w-4 h-4 text-[#D36B4E] group-hover:scale-110 transition-transform" />
                <span>{testingPriority === 'High' ? 'Sending...' : '⚡ Test High (Orange)'}</span>
              </button>

              {/* Medium Test Button */}
              <button
                type="button"
                disabled={testingPriority !== null}
                onClick={() => handleSendTestPriorityEmail('Medium')}
                className="p-3.5 rounded-2xl bg-[#2E2210] hover:bg-[#3D2E15] border border-[#F59E0B]/60 text-[#FBBF24] flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-95 group shadow-lg shadow-[#F59E0B]/20"
              >
                <Clock className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                <span>{testingPriority === 'Medium' ? 'Sending...' : '⏳ Test Medium (Amber)'}</span>
              </button>

              {/* Low Test Button */}
              <button
                type="button"
                disabled={testingPriority !== null}
                onClick={() => handleSendTestPriorityEmail('Low')}
                className="p-3.5 rounded-2xl bg-[#112325] hover:bg-[#163032] border border-[#3AB4B9]/60 text-[#4FC5CA] flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-95 group shadow-lg shadow-[#3AB4B9]/20"
              >
                <Sparkles className="w-4 h-4 text-[#3AB4B9] group-hover:scale-110 transition-transform" />
                <span>{testingPriority === 'Low' ? 'Sending...' : '✨ Test Low (Cyan)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profile Settings */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#FAF6F0]/10">
          <User className="w-5 h-5 text-[#D36B4E]" />
          <h2 className="text-sm font-bold text-[#FAF6F0] uppercase tracking-widest">Personal Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-2xl bg-[#0A0A0A] border border-[#FAF6F0]/5 text-[#A49690] text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">Avatar Image URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-[#FAF6F0] text-xs focus:border-[#D36B4E] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="px-6 py-3 rounded-2xl bg-[#D36B4E] hover:bg-[#E27B5E] text-[#FAF6F0] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#D36B4E]/30 transition-all flex items-center gap-2"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : null}
            <span>{updating ? 'Saving...' : savedSuccess ? 'Profile Saved' : 'Save Changes'}</span>
          </button>
        </form>
      </div>

      {/* 3. Preferences: Currency & Theme */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#FAF6F0]/10">
          <IndianRupee className="w-5 h-5 text-[#3AB4B9]" />
          <h2 className="text-sm font-bold text-[#FAF6F0] uppercase tracking-widest">Currency & Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#A49690] uppercase tracking-widest">
              Default Ledger Currency (Current: {symbol})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currencies.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    currency === c.code
                      ? 'bg-[#3AB4B9]/15 border-[#3AB4B9]/50 text-[#3AB4B9] ring-1 ring-[#3AB4B9]/40'
                      : 'bg-[#1D1B1A] border-[#FAF6F0]/10 text-[#A49690] hover:text-[#FAF6F0]'
                  }`}
                >
                  <span className="text-xs font-bold">{c.label}</span>
                  <span className="font-mono font-bold text-sm">{c.symbol}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme switcher */}
          <div className="pt-4 border-t border-[#FAF6F0]/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#FAF6F0]">Color Scheme</p>
              <p className="text-[11px] text-[#A49690]">Switch between dark obsidian mode and warm cream light mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-2xl bg-[#1D1B1A] border border-[#FAF6F0]/15 text-xs font-bold text-[#FAF6F0] flex items-center gap-2 hover:border-[#D36B4E]/40"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-[#D36B4E]" /> : <Sun className="w-4 h-4 text-[#3AB4B9]" />}
              <span>{theme === 'dark' ? 'Dark Obsidian' : 'Warm Cream'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Persistent Vault & Data Management */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-[#FAF6F0]/10 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#FAF6F0]/10">
          <Database className="w-5 h-5 text-[#D36B4E]" />
          <h2 className="text-sm font-bold text-[#FAF6F0] uppercase tracking-widest">
            Persistent Data Storage & Backup
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[#A49690]">
            All records are stored persistently on your system in <code className="text-[#FAF6F0] bg-[#1D1B1A] px-2 py-0.5 rounded font-mono">server/data/db.json</code>. You can export a full snapshot or restore it at any time.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportData}
              className="px-5 py-3 rounded-2xl bg-[#1D1B1A] hover:bg-[#282320] text-[#FAF6F0] text-xs font-bold border border-[#FAF6F0]/10 flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-[#3AB4B9]" />
              <span>Export Full JSON Vault</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 rounded-2xl bg-[#1D1B1A] hover:bg-[#282320] text-[#FAF6F0] text-xs font-bold border border-[#FAF6F0]/10 flex items-center gap-2 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4 text-[#D36B4E]" />
              <span>Restore from Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="pt-4 border-t border-[#FAF6F0]/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#D36B4E]">Clean Vault Slate</p>
              <p className="text-[11px] text-[#A49690]">Wipes all transactions, schedules, and people records</p>
            </div>
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 rounded-2xl bg-[#D36B4E]/15 hover:bg-[#D36B4E]/25 text-[#D36B4E] border border-[#D36B4E]/30 text-xs font-bold transition-all"
            >
              Clean Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
