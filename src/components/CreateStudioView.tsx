import React, { useRef, useState } from 'react';
import {
  Wand2,
  ImagePlus,
  Smile,
  BookOpen,
  Mic,
  Music,
  Download,
  Youtube,
  Save,
  Plus,
  Trash2,
  Check,
  Loader2,
  Captions,
} from 'lucide-react';
import {
  AdminSettings,
  AspectRatio,
  CameraMotion,
  CartoonCharacter,
  ContentLanguage,
  CreationMode,
  LanguageMode,
  MusicTrackId,
  SceneItem,
  STUDIO_BACKDROPS,
  SubtitleStyle,
  VideoLengthOption,
  VideoProject,
  VideoStyle,
  VoiceName,
  VoiceStylePreset,
  WeatherFx,
} from '../types/studio';
import { TRANSLATIONS } from '../i18n/translations';
import { MUSIC_TRACK_OPTIONS } from '../utils/audioEngine';
import { generateSrtContent } from '../utils/canvasRenderer';
import { StudioPreviewPlayer } from './StudioPreviewPlayer';

interface CreateStudioViewProps {
  project: VideoProject;
  lang: LanguageMode;
  adminSettings: Omit<AdminSettings, 'adminPin'>;
  onChangeProject: (updated: VideoProject) => void;
  onSaveProject: () => Promise<void>;
  onDownloadVideo: () => Promise<void>;
  onOpenYouTubeModal: () => void;
  isExporting: boolean;
  exportProgress: number;
  savingProject: boolean;
  savedNotice: boolean;
}

const QUICK_STARTERS = [
  {
    id: 'starter-cartoon',
    labelTe: 'పిల్లల కార్టూన్ కథ',
    labelEn: 'Kids Cartoon Story',
    mode: 'cartoon-maker' as CreationMode,
    style: 'cartoon' as VideoStyle,
    aspectRatio: '16:9' as AspectRatio,
    promptTe: 'ఒక అల్లరి కుందేలు, తెలివైన గుడ్లగూబ కలిసి అడవిలో తప్పిపోయిన చిన్న పక్షిని ఇంటికి చేర్చిన పిల్లల కార్టూన్ కథ.',
    promptEn: 'A playful rabbit and a wise owl team up to guide a lost baby bird home through the sunlit forest.',
  },
  {
    id: 'starter-shorts',
    labelTe: 'YouTube షార్ట్స్ (9:16)',
    labelEn: 'YouTube Shorts Reel',
    mode: 'text-to-video' as CreationMode,
    style: 'realistic' as VideoStyle,
    aspectRatio: '9:16' as AspectRatio,
    promptTe: 'జీవితంలో విజయం సాధించడానికి ప్రతిరోజూ ఉదయం పాటించాల్సిన 3 శక్తివంతమైన అలవాట్ల పై మోటివేషనల్ యూట్యూబ్ షార్ట్.',
    promptEn: 'Three powerful morning habits that transform focus and discipline in 30 days, cinematic vertical short.',
  },
  {
    id: 'starter-village',
    labelTe: 'తెలుగు పల్లెటూరి కథ',
    labelEn: 'Telugu Village Tale',
    mode: 'story-maker' as CreationMode,
    style: 'devotional' as VideoStyle,
    aspectRatio: '16:9' as AspectRatio,
    promptTe: 'గోదావరి తీరంలోని అందమైన పల్లెటూరిలో తాతయ్య తన మనవడికి చెప్పిన నిజాయితీ విలువ గురించి హృద్యమైన తెలుగు కథ.',
    promptEn: 'A heartwarming tale of a grandfather sharing a timeless lesson on honesty along a quiet riverside village at dusk.',
  },
];

export const CreateStudioView: React.FC<CreateStudioViewProps> = ({
  project,
  lang,
  adminSettings,
  onChangeProject,
  onSaveProject,
  onDownloadVideo,
  onOpenYouTubeModal,
  isExporting,
  exportProgress,
  savingProject,
  savedNotice,
}) => {
  const t = TRANSLATIONS[lang];
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [generatingStoryboard, setGeneratingStoryboard] = useState(false);
  const [generationStep, setGenerationStep] = useState<'idle' | 'scripting' | 'voicing'>('idle');
  const [autoGenerateVoice, setAutoGenerateVoice] = useState(true);
  const [generatingVoices, setGeneratingVoices] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const scenePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [targetSceneForPhoto, setTargetSceneForPhoto] = useState<string | null>(null);

  const updateScene = (sceneId: string, patch: Partial<SceneItem>) => {
    onChangeProject({
      ...project,
      scenes: project.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
    });
  };

  const handleGenerateStoryboard = async () => {
    if (!project.prompt.trim()) {
      setErrorMsg(lang === 'te' ? 'దయచేసి ముందుగా కథ లేదా వీడియో ఆలోచన రాయండి.' : 'Please enter a story or prompt first.');
      return;
    }
    setGeneratingStoryboard(true);
    setGenerationStep('scripting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/studio/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: project.prompt,
          style: project.style,
          aspectRatio: project.aspectRatio,
          contentLanguage: project.contentLanguage,
          mode: project.mode,
          targetDurationSec: project.targetDurationSec || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate storyboard');

      let updatedProject: VideoProject = {
        ...project,
        title: data.videoTitle || project.title,
        scenes: data.scenes || project.scenes,
      };
      onChangeProject(updatedProject);
      setActiveSceneIndex(0);

      // Step 2: Automatically generate AI voiceover for all generated scenes if enabled
      if (autoGenerateVoice && updatedProject.scenes.length > 0) {
        setGenerationStep('voicing');
        const voicedScenes = [...updatedProject.scenes];
        for (let i = 0; i < voicedScenes.length; i++) {
          const s = voicedScenes[i];
          if (!s.narration.trim()) continue;
          voicedScenes[i] = { ...s, audioStatus: 'generating' };
          onChangeProject({ ...updatedProject, scenes: [...voicedScenes] });

          const vRes = await fetch('/api/studio/generate-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: s.narration,
              voiceName: updatedProject.voiceName,
              voiceStyle: updatedProject.voiceStyle,
            }),
          });
          const vData = await vRes.json();
          if (vRes.ok && vData.audioBase64) {
            voicedScenes[i] = {
              ...s,
              audioBase64: vData.audioBase64,
              audioMimeType: vData.mimeType || 'audio/wav',
              audioStatus: 'ready',
            };
          } else {
            voicedScenes[i] = { ...s, audioStatus: 'error' };
          }
          updatedProject = { ...updatedProject, scenes: [...voicedScenes] };
          onChangeProject(updatedProject);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI video generation failed');
    } finally {
      setGeneratingStoryboard(false);
      setGenerationStep('idle');
    }
  };

  const handleGenerateSingleVoice = async (scene: SceneItem) => {
    if (!scene.narration.trim()) return;
    updateScene(scene.id, { audioStatus: 'generating' });
    setErrorMsg('');
    try {
      const res = await fetch('/api/studio/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.narration,
          voiceName: project.voiceName,
          voiceStyle: project.voiceStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voice generation failed');

      updateScene(scene.id, {
        audioBase64: data.audioBase64,
        audioMimeType: data.mimeType || 'audio/wav',
        audioStatus: 'ready',
      });
    } catch (err: any) {
      updateScene(scene.id, { audioStatus: 'error' });
      setErrorMsg(err.message || 'Voice generation failed');
    }
  };

  const handleGenerateAllVoices = async () => {
    setGeneratingVoices(true);
    setErrorMsg('');
    try {
      const nextScenes = [...project.scenes];
      for (let i = 0; i < nextScenes.length; i++) {
        const s = nextScenes[i];
        if (!s.narration.trim()) continue;
        nextScenes[i] = { ...s, audioStatus: 'generating' };
        onChangeProject({ ...project, scenes: [...nextScenes] });

        const res = await fetch('/api/studio/generate-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: s.narration,
            voiceName: project.voiceName,
            voiceStyle: project.voiceStyle,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Voice generation failed');

        nextScenes[i] = {
          ...s,
          audioBase64: data.audioBase64,
          audioMimeType: data.mimeType || 'audio/wav',
          audioStatus: 'ready',
        };
        onChangeProject({ ...project, scenes: [...nextScenes] });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Voice generation failed');
    } finally {
      setGeneratingVoices(false);
    }
  };

  const handleUploadPhotosForVideo = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newScene: SceneItem = {
          id: `img-scene-${Date.now()}-${idx}`,
          title: file.name.replace(/\.[^.]+$/, ''),
          narration:
            project.contentLanguage === 'en'
              ? 'Watch this scene come alive with smooth cinematic motion.'
              : 'ఈ సుందరమైన దృశ్యం కదిలే వీడియో రూపంలో మీ ముందుకు వస్తోంది.',
          subtitleTe: 'ఈ సుందరమైన దృశ్యం కదిలే వీడియో రూపంలో మీ ముందుకు వస్తోంది.',
          subtitleEn: 'Watch this scene come alive with smooth cinematic motion.',
          durationSec: 5,
          cameraMotion: idx % 2 === 0 ? 'ken-burns' : 'zoom-in',
          weatherFx: 'golden-dust',
          backdropType: 'uploaded',
          imageUrl: dataUrl,
          palette: { skyTop: '#0F172A', skyBottom: '#1E293B', ground: '#0F172A', accent: '#F59E0B' },
          cartoonElements: { character: 'none', setting: 'mountains', mood: 'sunset' },
        };
        onChangeProject({
          ...project,
          mode: 'image-to-video',
          scenes:
            project.scenes.length === 1 && project.scenes[0].id.startsWith('blank-')
              ? [newScene]
              : [...project.scenes, newScene],
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScenePhotoReplace = (files: FileList | null) => {
    if (!files || !files[0] || !targetSceneForPhoto) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateScene(targetSceneForPhoto, {
        backdropType: 'uploaded',
        imageUrl: reader.result as string,
      });
      setTargetSceneForPhoto(null);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleAddScene = () => {
    const newScene: SceneItem = {
      id: `scene-${Date.now()}`,
      title: lang === 'te' ? `కొత్త సీన్ ${project.scenes.length + 1}` : `Scene ${project.scenes.length + 1}`,
      narration:
        project.contentLanguage === 'en'
          ? 'Add your narration line here.'
          : 'ఇక్కడ మీ కథా వాక్యం రాయండి.',
      subtitleTe: 'ఇక్కడ మీ తెలుగు సబ్టైటిల్ రాయండి.',
      subtitleEn: 'Add your English subtitle here.',
      durationSec: 5,
      cameraMotion: project.style === 'cartoon' ? 'bounce-cartoon' : 'ken-burns',
      weatherFx: 'golden-dust',
      backdropType: 'procedural',
      palette: { skyTop: '#1E293B', skyBottom: '#334155', ground: '#14532D', accent: '#FBBF24' },
      cartoonElements: {
        character: project.style === 'cartoon' ? 'rabbit' : 'none',
        setting: 'forest',
        mood: 'sunny',
      },
    };
    onChangeProject({
      ...project,
      scenes: [...project.scenes, newScene],
    });
    setActiveSceneIndex(project.scenes.length);
  };

  const handleDownloadSrt = () => {
    const srt = generateSrtContent(project);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modeTabs: { id: CreationMode; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'text-to-video', label: t.modeTextToVideo, icon: <Wand2 className="w-4 h-4" /> },
    {
      id: 'image-to-video',
      label: t.modeImageToVideo,
      icon: <ImagePlus className="w-4 h-4" />,
      disabled: !adminSettings.enableImageToVideo,
    },
    {
      id: 'cartoon-maker',
      label: t.modeCartoonMaker,
      icon: <Smile className="w-4 h-4" />,
      disabled: !adminSettings.enableCartoon,
    },
    { id: 'story-maker', label: t.modeStoryMaker, icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-6">
      {/* Studio Headline + Creation Mode Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight text-balance">
            {t.studioHeadline}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{t.studioSubhead}</p>
        </div>

        {/* Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#13161F] border border-white/10 rounded-xl overflow-x-auto max-w-full">
          {modeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => {
                const nextStyle: VideoStyle =
                  tab.id === 'cartoon-maker' ? 'cartoon' : tab.id === 'story-maker' ? 'devotional' : project.style;
                onChangeProject({ ...project, mode: tab.id, style: nextStyle });
              }}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-40 ${
                project.mode === tab.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Studio Grid: Left Composer (5 cols) + Right Preview Stage (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Prompt, Photo Upload & Video Configuration */}
        <div className="lg:col-span-5 bg-[#13161F] border border-white/10 rounded-2xl p-5 flex flex-col gap-5">
          {/* Style + Format + Video Length + Content Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">{t.styleLabel}</label>
              <select
                value={project.style}
                onChange={(e) => onChangeProject({ ...project, style: e.target.value as VideoStyle })}
                className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {adminSettings.enableCartoon && <option value="cartoon">{t.styleCartoon}</option>}
                {adminSettings.enableRealistic && <option value="realistic">{t.styleRealistic}</option>}
                <option value="anime">{t.styleAnime}</option>
                <option value="3d-render">{t.style3dRender}</option>
                <option value="devotional">{t.styleDevotional}</option>
                <option value="explainer">{t.styleExplainer}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400">{t.formatLabel}</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B0D12] border border-white/10 rounded-xl">
                {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onChangeProject({ ...project, aspectRatio: ratio })}
                    className={`min-h-[36px] rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      project.aspectRatio === ratio
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {ratio === '16:9' ? '16:9 Long' : '9:16 Shorts'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Video Length Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">{t.lengthLabel}</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B0D12] border border-white/10 rounded-xl">
              {([15, 30, 60, 90] as VideoLengthOption[]).map((len) => {
                const active = (project.targetDurationSec || 30) === len;
                return (
                  <button
                    key={len}
                    type="button"
                    onClick={() => onChangeProject({ ...project, targetDurationSec: len })}
                    className={`min-h-[36px] rounded-lg text-xs font-medium font-mono-tabular whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {len}s
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">{t.contentLangLabel}</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B0D12] border border-white/10 rounded-xl">
              {(['te', 'en', 'bilingual'] as ContentLanguage[]).map((cl) => (
                <button
                  key={cl}
                  type="button"
                  onClick={() => onChangeProject({ ...project, contentLanguage: cl })}
                  className={`min-h-[36px] rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    project.contentLanguage === cl
                      ? 'bg-white/15 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cl === 'te' ? t.langTe : cl === 'en' ? t.langEn : t.langBilingual}
                </button>
              ))}
            </div>
          </div>

          {/* Image-to-Video Upload Box when mode is image-to-video, or quick add anytime */}
          {project.mode === 'image-to-video' && (
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-dashed border-amber-500/40 flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-100">{t.uploadPhotoTitle}</p>
              <p className="text-xs text-slate-400">{t.uploadHint}</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUploadPhotosForVideo(e.target.files)}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
                <span>{t.uploadPhotoBtn}</span>
              </button>
            </div>
          )}

          {/* Story / Text-to-Video Prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400">{t.promptLabel}</label>
            <textarea
              rows={4}
              value={project.prompt}
              onChange={(e) => onChangeProject({ ...project, prompt: e.target.value })}
              placeholder={t.promptPlaceholder}
              className="w-full bg-[#0B0D12] border border-white/10 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Quick Story Starters */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400">{t.starterIdeas}</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_STARTERS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    onChangeProject({
                      ...project,
                      mode: st.mode,
                      style: st.style,
                      aspectRatio: st.aspectRatio,
                      prompt: lang === 'te' ? st.promptTe : st.promptEn,
                    })
                  }
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  {lang === 'te' ? st.labelTe : st.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Voiceover Toggle + Generate AI Video CTA */}
          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoGenerateVoice}
              onChange={(e) => setAutoGenerateVoice(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
            <span>{t.autoVoiceLabel}</span>
          </label>

          <button
            type="button"
            onClick={handleGenerateStoryboard}
            disabled={generatingStoryboard}
            className="min-h-[48px] w-full px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {generatingStoryboard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>
              {generationStep === 'scripting'
                ? t.stepScripting
                : generationStep === 'voicing'
                  ? t.stepVoicing
                  : t.generateBtn}
            </span>
          </button>
        </div>

        {/* Right: Dominant Preview Player + Export Actions */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <StudioPreviewPlayer
            project={project}
            lang={lang}
            watermarkText={adminSettings.watermarkEnabled ? adminSettings.watermarkText : undefined}
            activeSceneIndex={activeSceneIndex}
            onSelectSceneIndex={setActiveSceneIndex}
          />

          {/* Studio Export & YouTube Action Strip */}
          <div className="bg-[#13161F] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onSaveProject}
                disabled={savingProject}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                {savedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                <span>{savedNotice ? t.projectSaved : t.saveProjectBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSrt}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm flex items-center gap-2 cursor-pointer"
              >
                <Captions className="w-4 h-4" />
                <span>{t.downloadSrtBtn}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onDownloadVideo}
                disabled={isExporting}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isExporting ? `${t.exportingVideo} ${exportProgress}%` : t.exportVideoBtn}</span>
              </button>

              <button
                type="button"
                onClick={onOpenYouTubeModal}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
                <span>{t.youtubeUploadBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Voiceover + Music + Subtitles Mixer */}
      <div className="bg-[#13161F] border border-white/10 rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Mic className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-slate-100">{t.voiceSettings}</h2>
          </div>

          <button
            type="button"
            onClick={handleGenerateAllVoices}
            disabled={generatingVoices}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-sm flex items-center gap-2 cursor-pointer"
          >
            {generatingVoices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            <span>{generatingVoices ? t.generatingVoice : t.generateAllVoices}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Voice Artist */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">{t.voiceActor}</label>
            <select
              value={project.voiceName}
              onChange={(e) => onChangeProject({ ...project, voiceName: e.target.value as VoiceName })}
              className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
            >
              <option value="Kore">Kore (Warm Storyteller)</option>
              <option value="Puck">Puck (Bright Youth)</option>
              <option value="Charon">Charon (Deep Cinema)</option>
              <option value="Fenrir">Fenrir (Bold Narrator)</option>
              <option value="Zephyr">Zephyr (Calm Soft)</option>
            </select>
          </div>

          {/* Delivery Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">{t.voiceStyle}</label>
            <select
              value={project.voiceStyle}
              onChange={(e) =>
                onChangeProject({ ...project, voiceStyle: e.target.value as VoiceStylePreset })
              }
              className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
            >
              <option value="storyteller">Storyteller (కథనం)</option>
              <option value="cartoon">Kids Cartoon (కార్టూన్)</option>
              <option value="documentary">Documentary (డాక్యుమెంటరీ)</option>
              <option value="energetic">Energetic Shorts (షార్ట్స్)</option>
            </select>
          </div>

          {/* Music Track */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>{t.musicTrack}</span>
            </label>
            <select
              value={project.musicTrack}
              onChange={(e) => onChangeProject({ ...project, musicTrack: e.target.value as MusicTrackId })}
              className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
            >
              {MUSIC_TRACK_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {lang === 'te' ? m.labelTe : m.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Subtitle Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">{t.subtitleStyle}</label>
            <select
              value={project.subtitleStyle}
              onChange={(e) =>
                onChangeProject({ ...project, subtitleStyle: e.target.value as SubtitleStyle })
              }
              className="min-h-[44px] bg-[#0B0D12] border border-white/10 rounded-xl px-3 text-sm text-slate-100"
            >
              <option value="cinema">Cinema Bar (సినిమా బార్)</option>
              <option value="shorts-pop">Shorts Bold Pop (షార్ట్స్)</option>
              <option value="minimal">Clean Minimal (సాధారణ)</option>
              <option value="off">Subtitles Off</option>
            </select>
          </div>
        </div>

        {/* Volume Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {t.voiceVol}: <strong className="text-slate-200 font-mono-tabular">{Math.round(project.voiceVolume * 100)}%</strong>
            </span>
            <input
              type="range"
              min={0}
              max={1.2}
              step={0.05}
              value={project.voiceVolume}
              onChange={(e) => onChangeProject({ ...project, voiceVolume: Number(e.target.value) })}
              className="w-full max-w-xs accent-amber-500"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {t.musicVol}: <strong className="text-slate-200 font-mono-tabular">{Math.round(project.musicVolume * 100)}%</strong>
            </span>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={project.musicVolume}
              onChange={(e) => onChangeProject({ ...project, musicVolume: Number(e.target.value) })}
              className="w-full max-w-xs accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Storyboard Scene Timeline Cards */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100">
            {t.scenesHeader} ({project.scenes.length})
          </h2>
          <button
            type="button"
            onClick={handleAddScene}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addScene}</span>
          </button>
        </div>

        <input
          ref={scenePhotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleScenePhotoReplace(e.target.files)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.scenes.map((scene, idx) => {
            const isActive = idx === activeSceneIndex;
            return (
              <div
                key={scene.id}
                onClick={() => setActiveSceneIndex(idx)}
                className={`bg-[#13161F] rounded-2xl p-4 flex flex-col gap-3 transition-colors border ${
                  isActive ? 'border-amber-500/70' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono-tabular text-xs text-amber-400 font-semibold shrink-0">
                      0{idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={scene.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                      className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none border-b border-transparent focus:border-amber-500 w-full truncate"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSingleVoice(scene);
                      }}
                      disabled={scene.audioStatus === 'generating'}
                      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer ${
                        scene.audioBase64
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                      }`}
                    >
                      {scene.audioStatus === 'generating' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                      <span>{scene.audioBase64 ? t.voiceReady : t.genSceneVoice}</span>
                    </button>

                    {project.scenes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeProject({
                            ...project,
                            scenes: project.scenes.filter((s) => s.id !== scene.id),
                          });
                        }}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                        aria-label="Delete scene"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Narration & Subtitles */}
                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={2}
                    value={scene.narration}
                    onChange={(e) =>
                      updateScene(scene.id, {
                        narration: e.target.value,
                        subtitleTe:
                          project.contentLanguage !== 'en' ? e.target.value : scene.subtitleTe,
                      })
                    }
                    className="w-full bg-[#0B0D12] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="Voiceover narration text..."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={scene.subtitleTe}
                      onChange={(e) => updateScene(scene.id, { subtitleTe: e.target.value })}
                      placeholder="తెలుగు సబ్టైటిల్"
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      value={scene.subtitleEn}
                      onChange={(e) => updateScene(scene.id, { subtitleEn: e.target.value })}
                      placeholder="English subtitle"
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                {/* Scene Controls: Duration, Camera Motion, FX, Backdrop */}
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">{t.sceneDuration}</span>
                    <input
                      type="number"
                      min={2}
                      max={15}
                      value={scene.durationSec}
                      onChange={(e) =>
                        updateScene(scene.id, { durationSec: Math.max(2, Number(e.target.value) || 5) })
                      }
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono-tabular"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">{t.cameraMotion}</span>
                    <select
                      value={scene.cameraMotion}
                      onChange={(e) =>
                        updateScene(scene.id, { cameraMotion: e.target.value as CameraMotion })
                      }
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    >
                      <option value="zoom-in">Zoom In</option>
                      <option value="zoom-out">Zoom Out</option>
                      <option value="pan-left">Pan Left</option>
                      <option value="pan-right">Pan Right</option>
                      <option value="ken-burns">Ken Burns</option>
                      <option value="bounce-cartoon">Cartoon Bounce</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">{t.weatherFx}</span>
                    <select
                      value={scene.weatherFx}
                      onChange={(e) =>
                        updateScene(scene.id, { weatherFx: e.target.value as WeatherFx })
                      }
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    >
                      <option value="none">None</option>
                      <option value="golden-dust">Golden Dust</option>
                      <option value="fireflies">Fireflies</option>
                      <option value="rain">Rain</option>
                      <option value="stars">Twinkling Stars</option>
                      <option value="petals">Flower Petals</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">{t.backdropSource}</span>
                    <select
                      value={scene.backdropType === 'procedural' ? 'procedural' : scene.imageUrl || 'procedural'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'upload') {
                          setTargetSceneForPhoto(scene.id);
                          scenePhotoInputRef.current?.click();
                        } else if (val === 'procedural') {
                          updateScene(scene.id, { backdropType: 'procedural', imageUrl: undefined });
                        } else {
                          updateScene(scene.id, { backdropType: 'template', imageUrl: val });
                        }
                      }}
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    >
                      <option value="procedural">AI Animated Art</option>
                      {STUDIO_BACKDROPS.map((b) => (
                        <option key={b.id} value={b.url}>
                          {lang === 'te' ? b.labelTe : b.labelEn}
                        </option>
                      ))}
                      {scene.backdropType === 'uploaded' && scene.imageUrl && (
                        <option value={scene.imageUrl}>Uploaded Photo</option>
                      )}
                      <option value="upload">+ Upload Photo...</option>
                    </select>
                  </div>
                </div>

                {/* Cartoon Character selector when in procedural mode */}
                {scene.backdropType === 'procedural' && (
                  <div
                    className="flex items-center justify-between gap-3 pt-1 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-slate-400">
                      {lang === 'te' ? 'కార్టూన్ పాత్ర:' : 'Animated Character:'}
                    </span>
                    <select
                      value={scene.cartoonElements?.character || 'rabbit'}
                      onChange={(e) =>
                        updateScene(scene.id, {
                          cartoonElements: {
                            ...scene.cartoonElements,
                            character: e.target.value as CartoonCharacter,
                          },
                        })
                      }
                      className="bg-[#0B0D12] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                    >
                      <option value="rabbit">Rabbit (కుందేలు)</option>
                      <option value="turtle">Turtle (తాబేలు)</option>
                      <option value="kid">Kid (పిల్లవాడు)</option>
                      <option value="elder">Elder (తాతయ్య)</option>
                      <option value="owl">Owl (గుడ్లగూబ)</option>
                      <option value="robot">AI Robot (రోబో)</option>
                      <option value="none">Scenery Only</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
