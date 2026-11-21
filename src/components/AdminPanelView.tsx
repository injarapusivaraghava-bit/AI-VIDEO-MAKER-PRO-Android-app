import React, { useEffect, useState } from 'react';
import { Lock, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AdminSettings, LanguageMode, UsageStats } from '../types/studio';
import { TRANSLATIONS } from '../i18n/translations';

interface AdminPanelViewProps {
  lang: LanguageMode;
  publicSettings: Omit<AdminSettings, 'adminPin'>;
  usageStats: UsageStats;
  onSettingsUpdated: (settings: Omit<AdminSettings, 'adminPin'>, stats: UsageStats) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  lang,
  publicSettings,
  usageStats,
  onSettingsUpdated,
}) => {
  const t = TRANSLATIONS[lang];
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [draft, setDraft] = useState<Omit<AdminSettings, 'adminPin'>>(publicSettings);
  const [newPin, setNewPin] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setBackendConnected(Boolean(d.ok && d.hasApiKey)))
      .catch(() => setBackendConnected(false));
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.unlocked) {
        setAuthError(lang === 'te' ? 'తప్పు PIN. డిఫాల్ట్ PIN: 1234' : 'Incorrect PIN. Default is 1234');
        return;
      }
      setDraft(data.settings);
      setUnlocked(true);
    } catch {
      setAuthError('Server error verifying PIN');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          settings: {
            ...draft,
            ...(newPin.trim() ? { newPin: newPin.trim() } : {}),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      if (newPin.trim()) {
        setPin(newPin.trim());
        setNewPin('');
      }
      onSettingsUpdated(data.settings, data.usageStats);
      setSavedMsg(lang === 'te' ? 'అడ్మిన్ సెట్టింగ్స్ సేవ్ అయ్యాయి' : 'Admin settings saved successfully');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t.adminTitle}</h1>
          <p className="text-sm text-slate-400 mt-1">{t.adminSubtitle}</p>
        </div>
        <p className="text-xs font-medium text-slate-300">
          AI Backend Status:{' '}
          <span className={backendConnected ? 'text-emerald-400' : 'text-amber-400'}>
            {backendConnected === null
              ? 'Checking...'
              : backendConnected
                ? 'Connected (Gemini 4 & TTS Live)'
                : 'API Key Pending'}
          </span>
        </p>
      </div>

      {/* Live Usage Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#13161F] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">{lang === 'te' ? 'నేటి తయారీలు' : 'Today Creations'}</p>
          <p className="text-2xl font-bold text-slate-100 font-mono-tabular mt-1">
            {usageStats.todayCount} / {publicSettings.freeDailyLimit}
          </p>
        </div>
        <div className="bg-[#13161F] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">{lang === 'te' ? 'మొత్తం స్టోరీబోర్డులు' : 'Total Storyboards'}</p>
          <p className="text-2xl font-bold text-slate-100 font-mono-tabular mt-1">{usageStats.totalStoryboards}</p>
        </div>
        <div className="bg-[#13161F] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">{lang === 'te' ? 'AI వాయిస్ క్లిప్స్' : 'AI Voiceovers'}</p>
          <p className="text-2xl font-bold text-slate-100 font-mono-tabular mt-1">{usageStats.totalVoices}</p>
        </div>
        <div className="bg-[#13161F] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">{lang === 'te' ? 'వీడియో ఎగుమతులు' : 'Video Exports'}</p>
          <p className="text-2xl font-bold text-amber-400 font-mono-tabular mt-1">{usageStats.totalExports}</p>
        </div>
      </div>

      {!unlocked ? (
        <form
          onSubmit={handleUnlock}
          className="bg-[#13161F] border border-white/10 rounded-2xl p-6 max-w-md flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {lang === 'te' ? 'నిర్వాహక ప్రాప్యత' : 'Proprietor Access'}
              </h2>
              <p className="text-xs text-slate-400">{publicSettings.proprietorName}</p>
            </div>
          </div>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={t.adminPinPrompt}
            className="w-full bg-[#0B0D12] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
          />

          {authError && <p className="text-xs text-rose-400">{authError}</p>}

          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm cursor-pointer"
          >
            {t.adminUnlock}
          </button>
        </form>
      ) : (
        <div className="bg-[#13161F] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <ShieldCheck className="w-5 h-5" />
              <span>{lang === 'te' ? 'అడ్మిన్ కంట్రోల్ అన్‌లాక్ అయింది' : 'Admin Controls Unlocked'}</span>
            </div>
            {savedMsg && (
              <span className="text-xs text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {savedMsg}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">{lang === 'te' ? 'స్టూడియో పేరు' : 'Studio Brand Name'}</label>
              <input
                type="text"
                value={draft.studioName}
                onChange={(e) => setDraft({ ...draft, studioName: e.target.value })}
                className="bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">{lang === 'te' ? 'యజమాని పేరు' : 'Proprietor Name'}</label>
              <input
                type="text"
                value={draft.proprietorName}
                onChange={(e) => setDraft({ ...draft, proprietorName: e.target.value })}
                className="bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">
                {lang === 'te' ? 'యాప్ ధర మోడ్' : 'Monetization Mode'}
              </label>
              <select
                value={draft.pricingMode}
                onChange={(e) =>
                  setDraft({ ...draft, pricingMode: e.target.value as 'free-starter' | 'freemium' })
                }
                className="bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              >
                <option value="free-starter">Free Starter (100% Free to Start)</option>
                <option value="freemium">Freemium (Free + Paid Pro Plan)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">
                {lang === 'te' ? 'రోజువారీ ఉచిత పరిమితి' : 'Free Daily Storyboard Limit'}:{' '}
                <span className="font-mono-tabular text-amber-400">{draft.freeDailyLimit}</span>
              </label>
              <input
                type="range"
                min={5}
                max={200}
                value={draft.freeDailyLimit}
                onChange={(e) => setDraft({ ...draft, freeDailyLimit: Number(e.target.value) })}
                className="accent-amber-500 mt-2"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">{lang === 'te' ? 'వాటర్‌మార్క్ టెక్స్ట్' : 'Watermark Text'}</label>
              <input
                type="text"
                value={draft.watermarkText}
                onChange={(e) => setDraft({ ...draft, watermarkText: e.target.value })}
                className="bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400">
                {lang === 'te' ? 'కొత్త అడ్మిన్ PIN (ఐచ్ఛికం)' : 'Change Admin PIN (Optional)'}
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                className="bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-slate-400">
                {lang === 'te' ? 'Admin గమనిక' : 'Admin Note'}
              </label>
              <textarea
                rows={2}
                value={draft.adminNote || ''}
                onChange={(e) => setDraft({ ...draft, adminNote: e.target.value })}
                placeholder={
                  lang === 'te'
                    ? 'ప్రాజెక్ట్ లేదా API సేవల గురించి గమనిక...'
                    : 'Internal note about project limits or API status...'
                }
                className="bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Feature & Engine Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            {[
              { key: 'watermarkEnabled', labelTe: 'వీడియో వాటర్‌మార్క్', labelEn: 'Video Watermark' },
              { key: 'enableCartoon', labelTe: 'AI కార్టూన్ ఇంజన్', labelEn: 'AI Cartoon Engine' },
              { key: 'enableRealistic', labelTe: 'రియలిస్టిక్ ఇంజన్', labelEn: 'Realistic Engine' },
              { key: 'enableImageToVideo', labelTe: 'ఫోటో-టు-వీడియో', labelEn: 'Image-to-Video' },
            ].map((item) => {
              const checked = Boolean((draft as any)[item.key]);
              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-3 bg-[#0B0D12] border border-white/10 rounded-xl px-3.5 py-3 cursor-pointer"
                >
                  <span className="text-xs font-medium text-slate-200">
                    {lang === 'te' ? item.labelTe : item.labelEn}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setDraft({ ...draft, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '...' : t.adminSave}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
