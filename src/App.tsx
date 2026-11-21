import { useEffect, useState } from 'react';
import {
  Clapperboard,
  Smartphone,
  FolderKanban,
  Shield,
  Globe,
  Image as ImageIcon,
  Mic,
  BookOpen,
  Video,
} from 'lucide-react';
import {
  AdminSettings,
  ContentLanguage,
  LanguageMode,
  SceneItem,
  UsageStats,
  VideoProject,
  VoiceName,
  YouTubeSeo,
} from './types/studio';
import { TRANSLATIONS } from './i18n/translations';
import { CreateStudioView } from './components/CreateStudioView';
import { PhotoStudioView } from './components/PhotoStudioView';
import { AudioStudioView } from './components/AudioStudioView';
import { StoryStudioView } from './components/StoryStudioView';
import { ProjectsView } from './components/ProjectsView';
import { AdminPanelView } from './components/AdminPanelView';
import { YouTubeUploadModal } from './components/YouTubeUploadModal';
import { exportProjectVideo } from './utils/canvasRenderer';

type ActiveTab = 'studio' | 'shorts' | 'projects' | 'admin';
type StudioSuiteTool = 'video' | 'photo' | 'audio' | 'story';

const DEFAULT_ADMIN_SETTINGS: Omit<AdminSettings, 'adminPin'> = {
  studioName: 'AI VIDEO MAKER PRO',
  proprietorName: 'Injarapu Siva Raghava',
  adminNote: '',
  freeDailyLimit: 25,
  watermarkEnabled: false,
  watermarkText: 'AI VIDEO MAKER PRO',
  enableCartoon: true,
  enableRealistic: true,
  enableImageToVideo: true,
  pricingMode: 'free-starter',
  proMonthlyInr: 199,
  maintenanceMode: false,
};

const DEFAULT_STATS: UsageStats = {
  totalStoryboards: 0,
  totalVoices: 0,
  totalExports: 0,
  totalYouTubePreps: 0,
  todayCount: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
};

function createBlankProject(aspectRatio: '16:9' | '9:16' = '16:9'): VideoProject {
  const now = new Date().toISOString();
  return {
    id: `proj-${Date.now()}`,
    title: aspectRatio === '9:16' ? 'కొత్త YouTube షార్ట్ వీడియో' : 'చిట్టి కుందేలు AI వీడియో కథ',
    mode: aspectRatio === '9:16' ? 'text-to-video' : 'cartoon-maker',
    style: aspectRatio === '9:16' ? 'realistic' : 'cartoon',
    aspectRatio,
    targetDurationSec: 30,
    contentLanguage: 'bilingual',
    prompt: '',
    voiceName: 'Kore',
    voiceStyle: 'storyteller',
    musicTrack: aspectRatio === '9:16' ? 'shorts-beat' : 'kids-playful',
    musicVolume: 0.25,
    voiceVolume: 1.0,
    subtitleStyle: aspectRatio === '9:16' ? 'shorts-pop' : 'cinema',
    exportCount: 0,
    createdAt: now,
    updatedAt: now,
    scenes: [
      {
        id: `scene-init-${Date.now()}`,
        title: aspectRatio === '9:16' ? 'ఆరంభ దృశ్యం' : 'అడవి ఉదయం',
        narration:
          aspectRatio === '9:16'
            ? 'మన తెలుగు కథల ప్రపంచానికి స్వాగతం!'
            : 'పచ్చని అడవిలో చిట్టి కుందేలు తన స్నేహితులతో ఆనందంగా గడిపేది.',
        subtitleTe:
          aspectRatio === '9:16'
            ? 'మన తెలుగు కథల ప్రపంచానికి స్వాగతం!'
            : 'పచ్చని అడవిలో చిట్టి కుందేలు తన స్నేహితులతో ఆనందంగా గడిపేది.',
        subtitleEn:
          aspectRatio === '9:16'
            ? 'Welcome to the world of Telugu AI Shorts!'
            : 'In a sunlit forest, the little rabbit played happily with friends.',
        durationSec: 5,
        cameraMotion: aspectRatio === '9:16' ? 'zoom-in' : 'ken-burns',
        weatherFx: 'golden-dust',
        backdropType: 'template',
        imageUrl:
          aspectRatio === '9:16'
            ? '/src/assets/images/studio_shorts_portrait_1795115467460.jpg'
            : '/src/assets/images/studio_cartoon_jungle_1795115468069.jpg',
        palette: { skyTop: '#38BDF8', skyBottom: '#BAE6FD', ground: '#15803D', accent: '#FBBF24' },
        cartoonElements: {
          character: aspectRatio === '9:16' ? 'none' : 'rabbit',
          setting: aspectRatio === '9:16' ? 'mountains' : 'forest',
          mood: 'sunny',
        },
      },
    ],
  };
}

export default function App() {
  const [lang, setLang] = useState<LanguageMode>('te');
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [studioTool, setStudioTool] = useState<StudioSuiteTool>('video');
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [currentProject, setCurrentProject] = useState<VideoProject>(() => createBlankProject('16:9'));
  const [adminSettings, setAdminSettings] = useState<Omit<AdminSettings, 'adminPin'>>(DEFAULT_ADMIN_SETTINGS);
  const [usageStats, setUsageStats] = useState<UsageStats>(DEFAULT_STATS);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [savingProject, setSavingProject] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setCurrentProject(data.projects[0]);
        }
      })
      .catch(() => {});

    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setAdminSettings(data.settings);
        if (data.usageStats) setUsageStats(data.usageStats);
      })
      .catch(() => {});
  }, []);

  const handleSaveProject = async (projToSave: VideoProject = currentProject) => {
    setSavingProject(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projToSave }),
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setCurrentProject(data.project);
        setProjects((prev) => {
          const exists = prev.some((p) => p.id === data.project.id);
          return exists ? prev.map((p) => (p.id === data.project.id ? data.project : p)) : [data.project, ...prev];
        });
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
      }
    } finally {
      setSavingProject(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(1);
    try {
      const wm = adminSettings.watermarkEnabled ? adminSettings.watermarkText : undefined;
      const { blob, ext } = await exportProjectVideo(currentProject, wm, setExportProgress);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.title.replace(/\s+/g, '_')}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      fetch(`/api/projects/${currentProject.id}/export-track`, { method: 'POST' })
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.totalExports === 'number') {
            setUsageStats((s) => ({ ...s, totalExports: d.totalExports }));
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleSwitchToShorts = () => {
    setActiveTab('shorts');
    setStudioTool('video');
    setCurrentProject((prev) => ({
      ...prev,
      aspectRatio: '9:16',
      subtitleStyle: 'shorts-pop',
    }));
  };

  const handleUpdateSeo = (seo: YouTubeSeo) => {
    const updated = { ...currentProject, youtubeSeo: seo };
    setCurrentProject(updated);
    handleSaveProject(updated);
  };

  const handleDuplicateProject = async (proj: VideoProject) => {
    const copy: VideoProject = {
      ...proj,
      id: `proj-${Date.now()}`,
      title: `${proj.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await handleSaveProject(copy);
  };

  const handleDeleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearDemos = async () => {
    const res = await fetch('/api/projects/clear-demos', { method: 'POST' });
    const data = await res.json();
    if (res.ok && Array.isArray(data.projects)) {
      setProjects(data.projects);
    }
  };

  const handleSendPhotoToVideo = (dataUrl: string, title: string, prompt: string) => {
    const newScene: SceneItem = {
      id: `photo-sc-${Date.now()}`,
      title,
      narration: lang === 'te' ? `${title} కదిలే AI దృశ్యం.` : `${title} animated with cinematic motion.`,
      subtitleTe: title,
      subtitleEn: title,
      durationSec: 5,
      cameraMotion: 'ken-burns',
      weatherFx: 'golden-dust',
      backdropType: 'uploaded',
      imageUrl: dataUrl,
      palette: { skyTop: '#0F172A', skyBottom: '#1E293B', ground: '#0F172A', accent: '#F59E0B' },
      cartoonElements: { character: 'none', setting: 'forest', mood: 'sunny' },
    };
    setCurrentProject((prev) => ({
      ...prev,
      mode: 'image-to-video',
      title: title || prev.title,
      prompt: prompt || prev.prompt,
      scenes: [newScene, ...prev.scenes.slice(0, 3)],
    }));
    setActiveTab('studio');
    setStudioTool('video');
  };

  const handleAttachVoiceToScene = (
    text: string,
    audioBase64: string,
    mimeType: string,
    voiceName: VoiceName
  ) => {
    setCurrentProject((prev) => {
      const updatedScenes = prev.scenes.map((sc, idx) =>
        idx === 0
          ? {
              ...sc,
              narration: text,
              subtitleTe: lang === 'te' ? text : sc.subtitleTe,
              subtitleEn: lang === 'en' ? text : sc.subtitleEn,
              audioBase64,
              audioMimeType: mimeType,
              audioStatus: 'ready' as const,
            }
          : sc
      );
      return { ...prev, voiceName, scenes: updatedScenes };
    });
    setActiveTab('studio');
    setStudioTool('video');
  };

  const handleConvertStoryToVideo = (
    title: string,
    topic: string,
    scenes: SceneItem[],
    contentLang: ContentLanguage
  ) => {
    setCurrentProject((prev) => ({
      ...prev,
      id: `proj-${Date.now()}`,
      title,
      prompt: topic,
      mode: 'story-maker',
      style: 'devotional',
      contentLanguage: contentLang,
      scenes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab('studio');
    setStudioTool('video');
  };

  const suiteTools: { id: StudioSuiteTool; label: string; icon: React.ReactNode }[] = [
    { id: 'video', label: t.navCreate, icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'photo', label: t.tabPhoto, icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'audio', label: t.tabAudio, icon: <Mic className="w-3.5 h-3.5" /> },
    { id: 'story', label: t.tabStory, icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 pb-20 md:pb-8 flex flex-col">
      {/* Top Bar Contract: 3 exact zones (Wordmark — 4 concise single-line links — 1 primary CTA) */}
      <header className="sticky top-0 z-40 h-16 bg-[#0B0D12]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
              setStudioTool('video');
            }}
            className="text-lg font-bold tracking-tight text-slate-50 font-display whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            {adminSettings.studioName || t.brandName}
          </button>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-100 transition-colors cursor-pointer ${
                activeTab === 'studio' ? 'text-amber-400 underline underline-offset-8' : ''
              }`}
            >
              {t.navCreate}
            </button>
            <button
              type="button"
              onClick={handleSwitchToShorts}
              className={`whitespace-nowrap shrink-0 hover:text-slate-100 transition-colors cursor-pointer ${
                activeTab === 'shorts' ? 'text-amber-400 underline underline-offset-8' : ''
              }`}
            >
              {t.navShorts}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-100 transition-colors cursor-pointer ${
                activeTab === 'projects' ? 'text-amber-400 underline underline-offset-8' : ''
              }`}
            >
              {t.navProjects}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`whitespace-nowrap shrink-0 hover:text-slate-100 transition-colors cursor-pointer ${
                activeTab === 'admin' ? 'text-amber-400 underline underline-offset-8' : ''
              }`}
            >
              {t.navAdmin}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={isExporting}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {isExporting ? `${exportProgress}%` : t.primaryCta}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Sub-Toolbar (Studio Tool Switcher: Video / Photo / Audio / Story + Language Switch) */}
      <div className="border-b border-white/5 bg-[#0E1118]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 p-1 bg-[#13161F] border border-white/10 rounded-xl">
            {suiteTools.map((tool) => {
              const isSelected = (activeTab === 'studio' || activeTab === 'shorts') && studioTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('studio');
                    setStudioTool(tool.id);
                  }}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tool.icon}
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-slate-400">
              {adminSettings.pricingMode === 'free-starter' ? t.freePlanBadge : 'Freemium Studio'}
              {' · '}
              <span className="font-mono-tabular">
                {usageStats.todayCount}/{adminSettings.freeDailyLimit}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'te' ? 'en' : 'te'))}
              className="min-h-[34px] px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.langSwitch}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {(activeTab === 'studio' || activeTab === 'shorts') && studioTool === 'video' && (
          <CreateStudioView
            project={currentProject}
            lang={lang}
            adminSettings={adminSettings}
            onChangeProject={setCurrentProject}
            onSaveProject={() => handleSaveProject(currentProject)}
            onDownloadVideo={handleDownloadVideo}
            onOpenYouTubeModal={() => setShowYouTubeModal(true)}
            isExporting={isExporting}
            exportProgress={exportProgress}
            savingProject={savingProject}
            savedNotice={savedNotice}
          />
        )}

        {(activeTab === 'studio' || activeTab === 'shorts') && studioTool === 'photo' && (
          <PhotoStudioView lang={lang} onSendPhotoToVideo={handleSendPhotoToVideo} />
        )}

        {(activeTab === 'studio' || activeTab === 'shorts') && studioTool === 'audio' && (
          <AudioStudioView lang={lang} onAttachVoiceToScene={handleAttachVoiceToScene} />
        )}

        {(activeTab === 'studio' || activeTab === 'shorts') && studioTool === 'story' && (
          <StoryStudioView lang={lang} onConvertStoryToVideo={handleConvertStoryToVideo} />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            lang={lang}
            onOpenProject={(proj) => {
              setCurrentProject(proj);
              setActiveTab('studio');
              setStudioTool('video');
            }}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onClearDemos={handleClearDemos}
            onCreateNew={() => {
              setCurrentProject(createBlankProject('16:9'));
              setActiveTab('studio');
              setStudioTool('video');
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanelView
            lang={lang}
            publicSettings={adminSettings}
            usageStats={usageStats}
            onSettingsUpdated={(s, st) => {
              setAdminSettings(s);
              setUsageStats(st);
            }}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-white/5 mt-10 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {adminSettings.studioName} · {adminSettings.proprietorName}
          </span>
          <span>Turangi, Kakinada, Andhra Pradesh · +91 8977776111</span>
        </div>
      </footer>

      {/* Mobile Bottom Thumb-Zone Tab Bar (md:hidden, within 15% mobile sticky cap) */}
      <nav
        aria-label="Mobile Studio Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#13161F]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-4 items-center"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('studio');
            setStudioTool('video');
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium ${
            activeTab === 'studio' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Clapperboard className="w-5 h-5" />
          <span className="mt-0.5">{t.navCreate}</span>
        </button>
        <button
          type="button"
          onClick={handleSwitchToShorts}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium ${
            activeTab === 'shorts' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="mt-0.5">{t.navShorts}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium ${
            activeTab === 'projects' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="mt-0.5">{t.navProjects}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium ${
            activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="mt-0.5">{t.navAdmin}</span>
        </button>
      </nav>

      {/* YouTube Upload & SEO Studio Modal */}
      {showYouTubeModal && (
        <YouTubeUploadModal
          project={currentProject}
          lang={lang}
          onClose={() => setShowYouTubeModal(false)}
          onUpdateSeo={handleUpdateSeo}
          onDownloadVideo={handleDownloadVideo}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />
      )}
    </div>
  );
}
