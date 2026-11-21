import React, { useEffect, useRef, useState } from 'react';
import { Mic, Download, Music, Play, Square, Loader2, Film } from 'lucide-react';
import {
  ContentLanguage,
  LanguageMode,
  MusicTrackId,
  VoiceName,
  VoiceStylePreset,
} from '../types/studio';
import { MUSIC_TRACK_OPTIONS, scheduleProceduralMusic } from '../utils/audioEngine';

interface AudioStudioViewProps {
  lang: LanguageMode;
  onAttachVoiceToScene: (text: string, audioBase64: string, mimeType: string, voiceName: VoiceName) => void;
}

export const AudioStudioView: React.FC<AudioStudioViewProps> = ({ lang, onAttachVoiceToScene }) => {
  const [text, setText] = useState('');
  const [contentLang, setContentLang] = useState<ContentLanguage>('te');
  const [voiceName, setVoiceName] = useState<VoiceName>('Kore');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStylePreset>('storyteller');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioData, setAudioData] = useState<{ base64: string; mimeType: string; url: string } | null>(null);

  const [playingTrack, setPlayingTrack] = useState<MusicTrackId | null>(null);
  const musicCtxRef = useRef<AudioContext | null>(null);
  const stopMusicRef = useRef<(() => void) | null>(null);

  const stopPreviewMusic = () => {
    if (stopMusicRef.current) {
      stopMusicRef.current();
      stopMusicRef.current = null;
    }
    if (musicCtxRef.current && musicCtxRef.current.state !== 'closed') {
      musicCtxRef.current.close().catch(() => {});
      musicCtxRef.current = null;
    }
    setPlayingTrack(null);
  };

  useEffect(() => {
    return () => stopPreviewMusic();
  }, []);

  const handleToggleMusicPreview = (trackId: MusicTrackId) => {
    if (playingTrack === trackId || trackId === 'none') {
      stopPreviewMusic();
      return;
    }
    stopPreviewMusic();
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    gain.connect(ctx.destination);
    musicCtxRef.current = ctx;
    stopMusicRef.current = scheduleProceduralMusic(ctx, gain, trackId, ctx.currentTime + 0.05, 16);
    setPlayingTrack(trackId);
  };

  const handleGenerateVoice = async () => {
    if (!text.trim()) {
      setError(lang === 'te' ? 'దయచేసి వాయిస్ చదవాల్సిన టెక్స్ట్ రాయండి.' : 'Please enter text to synthesize.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/studio/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName, voiceStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voice synthesis failed');

      const mime = data.mimeType || 'audio/wav';
      const url = `data:${mime};base64,${data.audioBase64}`;
      setAudioData({ base64: data.audioBase64, mimeType: mime, url });
    } catch (err: any) {
      setError(err.message || 'Voice synthesis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWav = () => {
    if (!audioData) return;
    const a = document.createElement('a');
    a.href = audioData.url;
    a.download = `ai_voice_${voiceName.toLowerCase()}.wav`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-slate-100">
          {lang === 'te' ? 'AI వాయిస్ & ఆడియో స్టూడియో' : 'AI Voice & Audio Studio'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {lang === 'te'
            ? 'Gemini 3.8 AI వాయిస్ ద్వారా తెలుగు మరియు ఇంగ్లీష్ కథలకు నిజమైన ఆడియో తయారు చేసి WAV డౌన్లోడ్ చేయండి.'
            : 'Synthesize real Telugu and English voiceovers with Gemini 3.8 TTS and audition copyright-free background tracks.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: AI Voice Generator */}
        <div className="lg:col-span-7 bg-[#13161F] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Mic className="w-4 h-4" />
            <span>{lang === 'te' ? 'వాయిస్ జనరేటర్ (Gemini TTS)' : 'AI Voice Generator (Gemini TTS)'}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">
              {lang === 'te' ? 'వాయిస్ కోసం టెక్స్ట్' : 'Voiceover Script Text'}
            </label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                lang === 'te'
                  ? 'వాయిస్ చదవాల్సిన కథ / మాటలు ఇక్కడ రాయండి...'
                  : 'Enter Telugu or English narration text here...'
              }
              className="w-full bg-[#0B0D12] border border-white/10 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">{lang === 'te' ? 'భాష' : 'Language'}</label>
              <select
                value={contentLang}
                onChange={(e) => setContentLang(e.target.value as ContentLanguage)}
                className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
              >
                <option value="te">తెలుగు (Telugu)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                {lang === 'te' ? 'వాయిస్ ఆర్టిస్ట్' : 'Voice Actor'}
              </label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value as VoiceName)}
                className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
              >
                <option value="Kore">Kore (Warm Female)</option>
                <option value="Puck">Puck (Bright Youth)</option>
                <option value="Charon">Charon (Deep Cinema)</option>
                <option value="Fenrir">Fenrir (Bold Storyteller)</option>
                <option value="Zephyr">Zephyr (Calm Soft)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                {lang === 'te' ? 'వాయిస్ శైలి' : 'Voice Style'}
              </label>
              <select
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value as VoiceStylePreset)}
                className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
              >
                <option value="storyteller">Warm Storyteller</option>
                <option value="cartoon">Kids Cartoon</option>
                <option value="documentary">Documentary</option>
                <option value="energetic">Energetic Shorts</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateVoice}
            disabled={loading}
            className="min-h-[48px] w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            <span>
              {loading
                ? lang === 'te'
                  ? 'AI వాయిస్ తయారవుతోంది...'
                  : 'Generating AI Voice...'
                : lang === 'te'
                  ? 'AI వాయిస్ తయారు చేయండి (WAV)'
                  : 'Generate AI Voiceover (WAV)'}
            </span>
          </button>

          {audioData && (
            <div className="bg-[#0B0D12] border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3">
              <audio controls src={audioData.url} className="w-full" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDownloadWav}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'te' ? 'WAV ఆడియో డౌన్లోడ్' : 'Download WAV'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAttachVoiceToScene(text, audioData.base64, audioData.mimeType, voiceName)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>{lang === 'te' ? 'వీడియో సీన్‌కు జోడించండి' : 'Send to Video Scene'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Royalty-Free Music Audition */}
        <div className="lg:col-span-5 bg-[#13161F] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Music className="w-4 h-4" />
            <span>{lang === 'te' ? 'కాపీరైట్ ఫ్రీ బ్యాక్‌గ్రౌండ్ సంగీతం' : 'Royalty-Free Music Tracks'}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {MUSIC_TRACK_OPTIONS.filter((m) => m.id !== 'none').map((track) => {
              const isPlaying = playingTrack === track.id;
              return (
                <div
                  key={track.id}
                  className="bg-[#0B0D12] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {lang === 'te' ? track.labelTe : track.labelEn}
                    </p>
                    <p className="text-xs text-slate-400 font-mono-tabular">{track.bpm} BPM · YouTube Safe</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleMusicPreview(track.id)}
                    className={`min-h-[40px] min-w-[40px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? (lang === 'te' ? 'ఆపండి' : 'Stop') : lang === 'te' ? 'వినండి' : 'Play'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
