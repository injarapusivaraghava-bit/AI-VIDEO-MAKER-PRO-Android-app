import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Download, Wand2, Film, Upload, Copy, Check, Loader2 } from 'lucide-react';
import { LanguageMode } from '../types/studio';

interface PhotoStudioViewProps {
  lang: LanguageMode;
  onSendPhotoToVideo: (dataUrl: string, title: string, prompt: string) => void;
}

export const PhotoStudioView: React.FC<PhotoStudioViewProps> = ({ lang, onSendPhotoToVideo }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('3D Cartoon');
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    title: string;
    enhancedPrompt: string;
    pngDataUrl: string;
    width: number;
    height: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const svgToPngDataUrl = (svgMarkup: string, width: number, height: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const png = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(png);
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context unavailable'));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to render generated artwork'));
      };
      img.src = url;
    });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(lang === 'te' ? 'దయచేసి చిత్ర వివరణ రాయండి.' : 'Please enter an image description.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/studio/generate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate artwork');

      const pngDataUrl = await svgToPngDataUrl(data.svgMarkup, data.width || 1024, data.height || 1024);
      setResult({
        title: data.title,
        enhancedPrompt: data.enhancedPrompt,
        pngDataUrl,
        width: data.width || 1024,
        height: data.height || 1024,
      });
    } catch (err: any) {
      setError(err.message || 'Artwork generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCustomPhoto = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setResult({
        title: file.name.replace(/\.[^.]+$/, ''),
        enhancedPrompt: prompt || file.name,
        pngDataUrl: reader.result as string,
        width: 1280,
        height: 720,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPng = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.pngDataUrl;
    a.download = `${result.title.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopyPrompt = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.enhancedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-slate-100">
          {lang === 'te' ? 'AI ఫొటో స్టూడియో' : 'AI Photo Studio'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {lang === 'te'
            ? 'చిత్ర వివరణతో AI ఆర్ట్‌వర్క్ & ప్రాంప్ట్ తయారు చేసి PNG డౌన్లోడ్ చేయండి లేదా కదిలే వీడియోగా మార్చండి.'
            : 'Generate AI scene illustrations and pro visual prompts, download PNG, or animate into a video scene.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-[#13161F] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">
              {lang === 'te' ? 'చిత్ర వివరణ' : 'Image Description'}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                lang === 'te'
                  ? 'ఉదా: అందమైన 3D కార్టూన్ అడవిలో కుందేలు...'
                  : 'Example: A cute 3D cartoon rabbit beside a glowing forest stream at sunrise...'
              }
              className="w-full bg-[#0B0D12] border border-white/10 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                {lang === 'te' ? 'చిత్ర శైలి' : 'Image Style'}
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
              >
                <option value="3D Cartoon">3D Cartoon</option>
                <option value="Realistic Cinema">Realistic Cinema</option>
                <option value="Anime">Anime Visual</option>
                <option value="Telugu Village Art">Telugu Village Art</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">
                {lang === 'te' ? 'చిత్ర పరిమాణం' : 'Dimensions'}
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
              >
                <option value="1024x1024">1024 × 1024 (Square)</option>
                <option value="1280x720">1280 × 720 (16:9 YouTube)</option>
                <option value="720x1280">720 × 1280 (9:16 Shorts)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="min-h-[48px] w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>
              {loading
                ? lang === 'te'
                  ? 'చిత్రం తయారవుతోంది...'
                  : 'Generating Artwork...'
                : lang === 'te'
                  ? 'చిత్రం & Prompt తయారు చేయండి'
                  : 'Generate Image & Prompt'}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUploadCustomPhoto(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'te' ? 'లేదా మీ ఫోటో అప్లోడ్ చేయండి' : 'Or Upload Your Own Photo'}</span>
          </button>
        </div>

        <div className="lg:col-span-7 bg-[#13161F] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
          {!result ? (
            <div className="aspect-video bg-[#0B0D12] border border-white/5 rounded-xl flex flex-col items-center justify-center p-8 text-center gap-3">
              <ImageIcon className="w-10 h-10 text-slate-600" />
              <p className="text-sm text-slate-400 max-w-sm">
                {lang === 'te'
                  ? 'ఎడమ వైపున చిత్ర వివరణ రాసి తయారు చేయండి. తయారైన చిత్రాన్ని PNG గా డౌన్లోడ్ చేయవచ్చు లేదా వీడియో సీన్‌గా మార్చవచ్చు.'
                  : 'Describe an image on the left to generate custom artwork and an enhanced AI prompt, or upload a photo to animate.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">{result.title}</h2>
                  <p className="text-xs text-slate-400 font-mono-tabular">
                    {result.width} × {result.height} · {style}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendPhotoToVideo(result.pngDataUrl, result.title, result.enhancedPrompt)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-4 h-4" />
                    <span>{lang === 'te' ? 'వీడియోలో వాడండి' : 'Animate in Video Studio'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#0B0D12] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center max-h-[420px]">
                <img
                  src={result.pngDataUrl}
                  alt={result.title}
                  className="max-h-[420px] w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="bg-[#0B0D12] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {lang === 'te' ? 'AI మెరుగుపరిచిన చిత్ర Prompt' : 'Enhanced AI Visual Prompt'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{result.enhancedPrompt}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
