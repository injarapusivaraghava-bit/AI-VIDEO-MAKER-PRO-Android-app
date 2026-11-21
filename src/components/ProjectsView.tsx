import React, { useState } from 'react';
import { FolderOpen, Copy, Trash2, Search, Film, Plus } from 'lucide-react';
import { AspectRatio, LanguageMode, VideoProject } from '../types/studio';
import { TRANSLATIONS } from '../i18n/translations';
import { getTotalDuration } from '../utils/canvasRenderer';

interface ProjectsViewProps {
  projects: VideoProject[];
  lang: LanguageMode;
  onOpenProject: (project: VideoProject) => void;
  onDuplicateProject: (project: VideoProject) => void;
  onDeleteProject: (id: string) => void;
  onClearDemos: () => void;
  onCreateNew: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  lang,
  onOpenProject,
  onDuplicateProject,
  onDeleteProject,
  onClearDemos,
  onCreateNew,
}) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [ratioFilter, setRatioFilter] = useState<'all' | AspectRatio>('all');

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase());
    const matchesRatio = ratioFilter === 'all' || p.aspectRatio === ratioFilter;
    return matchesSearch && matchesRatio;
  });

  const hasDemos = projects.some(
    (p) => p.id === 'proj-cartoon-rabbit' || p.id === 'proj-kakinada-short'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t.projectsTitle}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {projects.length} {lang === 'te' ? 'ప్రాజెక్టులు సేవ్ చేయబడ్డాయి' : 'saved video projects'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasDemos && (
            <button
              type="button"
              onClick={onClearDemos}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 text-slate-300 hover:text-rose-300 text-xs font-medium cursor-pointer"
            >
              {lang === 'te' ? 'Demo ప్రాజెక్టులను తొలగించండి' : 'Clear Demo Projects'}
            </button>
          )}
          <button
            type="button"
            onClick={onCreateNew}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'te' ? 'కొత్త వీడియో తయారు చేయండి' : 'New AI Video'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchProjects}
            className="w-full bg-[#13161F] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#13161F] border border-white/10 rounded-xl self-start">
          {(['all', '9:16', '16:9'] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setRatioFilter(val)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                ratioFilter === val ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {val === 'all' ? t.filterAll : val === '9:16' ? t.filterShorts : t.filterLong}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-[#13161F] border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-400">
            <Film className="w-6 h-6" />
          </div>
          <p className="text-slate-300 text-sm max-w-md">{t.projectsEmpty}</p>
          <button
            type="button"
            onClick={onCreateNew}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm cursor-pointer"
          >
            {t.generateBtn}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => {
            const firstImg = proj.scenes.find((s) => s.imageUrl)?.imageUrl;
            const totalSec = getTotalDuration(proj.scenes);
            return (
              <div
                key={proj.id}
                className="bg-[#13161F] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video bg-[#07090D] relative overflow-hidden">
                    {firstImg ? (
                      <img
                        src={firstImg}
                        alt={proj.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${proj.scenes[0]?.palette?.skyTop || '#1E293B'}, ${proj.scenes[0]?.palette?.ground || '#0F172A'})`,
                        }}
                      >
                        <Film className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#13161F] to-transparent" />
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <h3 className="text-base font-semibold text-slate-100 line-clamp-1">{proj.title}</h3>
                    <p className="text-xs text-slate-400 font-mono-tabular">
                      {proj.aspectRatio} · {proj.style} · {proj.scenes.length} {lang === 'te' ? 'సీన్లు' : 'scenes'} ·{' '}
                      {totalSec}s
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.prompt}</p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProject(proj)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{t.openInStudio}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(proj)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                      aria-label={t.duplicateBtn}
                      title={t.duplicateBtn}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 cursor-pointer"
                      aria-label={t.deleteBtn}
                      title={t.deleteBtn}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
