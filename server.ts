import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'studio-db.json');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface DbSchema {
  projects: any[];
  adminSettings: {
    studioName: string;
    proprietorName: string;
    adminNote?: string;
    freeDailyLimit: number;
    watermarkEnabled: boolean;
    watermarkText: string;
    enableCartoon: boolean;
    enableRealistic: boolean;
    enableImageToVideo: boolean;
    pricingMode: 'free-starter' | 'freemium';
    proMonthlyInr: number;
    maintenanceMode: boolean;
    adminPin: string;
  };
  usageStats: {
    totalStoryboards: number;
    totalVoices: number;
    totalExports: number;
    totalYouTubePreps: number;
    todayCount: number;
    lastResetDate: string;
  };
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSeedDb(): DbSchema {
  const now = new Date().toISOString();
  return {
    projects: [
      {
        id: 'proj-cartoon-rabbit',
        title: 'చిట్టి కుందేలు & తెలివైన తాబేలు',
        mode: 'cartoon-maker',
        style: 'cartoon',
        aspectRatio: '16:9',
        contentLanguage: 'bilingual',
        prompt: 'పిల్లల కోసం చిట్టి కుందేలు మరియు తెలివైన తాబేలు స్నేహ కథ',
        voiceName: 'Kore',
        voiceStyle: 'cartoon',
        musicTrack: 'kids-playful',
        musicVolume: 0.25,
        voiceVolume: 1.0,
        subtitleStyle: 'cinema',
        exportCount: 2,
        createdAt: now,
        updatedAt: now,
        youtubeSeo: {
          title: 'చిట్టి కుందేలు మరియు తెలివైన తాబేలు | Telugu Kids Cartoon Moral Story',
          description:
            'అందమైన అడవిలో చిట్టి కుందేలు మరియు తెలివైన తాబేలు ఎలా స్నేహితులు అయ్యాయో చూడండి. పిల్లల కోసం నీతి కథ!',
          tags: ['Telugu Stories', 'Kids Cartoon', 'Moral Stories Telugu', 'AI Cartoon Video'],
          hashtags: ['#TeluguStories', '#KidsCartoon', '#TeluguMoralStories'],
          thumbnailHook: 'అడవిలో అద్భుతమైన స్నేహం!',
          uploadedStatus: 'ready',
        },
        scenes: [
          {
            id: 'sc-1',
            title: 'అడవి ఉదయం (Forest Morning)',
            narration: 'పచ్చని అడవిలో ఒక చిట్టి కుందేలు, తెలివైన తాబేలు మంచి స్నేహితులుగా ఉండేవి.',
            subtitleTe: 'పచ్చని అడవిలో చిట్టి కుందేలు, తెలివైన తాబేలు స్నేహితులుగా ఉండేవి.',
            subtitleEn: 'In a lush green forest, a little rabbit and a wise turtle were best friends.',
            durationSec: 5,
            cameraMotion: 'zoom-in',
            weatherFx: 'golden-dust',
            backdropType: 'template',
            imageUrl: '/src/assets/images/studio_cartoon_jungle_1795115468069.jpg',
            palette: { skyTop: '#38BDF8', skyBottom: '#BAE6FD', ground: '#15803D', accent: '#FBBF24' },
            cartoonElements: { character: 'rabbit', secondaryCharacter: 'turtle', setting: 'forest', mood: 'sunny' },
          },
          {
            id: 'sc-2',
            title: 'చిరు జల్లు సమస్య (Sudden Stream)',
            narration: 'ఒకరోజు పెద్ద వర్షం రావడంతో వాగు పొంగింది. కుందేలు భయపడింది.',
            subtitleTe: 'పెద్ద వర్షం రావడంతో వాగు పొంగి, కుందేలు భయపడింది.',
            subtitleEn: 'When heavy rain swelled the stream, the little rabbit grew worried.',
            durationSec: 5,
            cameraMotion: 'bounce-cartoon',
            weatherFx: 'rain',
            backdropType: 'procedural',
            palette: { skyTop: '#1E293B', skyBottom: '#475569', ground: '#14532D', accent: '#38BDF8' },
            cartoonElements: { character: 'rabbit', secondaryCharacter: 'owl', setting: 'forest', mood: 'night' },
          },
          {
            id: 'sc-3',
            title: 'తాబేలు సాయం (Turtle Rescue)',
            narration: 'తెలివైన తాబేలు తన బలమైన చిప్పపై కుందేలును ఎక్కించుకుని సురక్షితంగా అవతలికి చేర్చింది.',
            subtitleTe: 'తాబేలు కుందేలును సురక్షితంగా ఒడ్డుకు చేర్చింది.',
            subtitleEn: 'The wise turtle carried the rabbit safely across the sparkling stream.',
            durationSec: 5,
            cameraMotion: 'pan-right',
            weatherFx: 'fireflies',
            backdropType: 'procedural',
            palette: { skyTop: '#F59E0B', skyBottom: '#FDE68A', ground: '#166534', accent: '#F97316' },
            cartoonElements: { character: 'turtle', secondaryCharacter: 'rabbit', setting: 'forest', mood: 'sunset' },
          },
        ],
      },
      {
        id: 'proj-kakinada-short',
        title: 'అద్భుతమైన పల్లె & తీర ప్రయాణం (Shorts)',
        mode: 'text-to-video',
        style: 'realistic',
        aspectRatio: '9:16',
        contentLanguage: 'bilingual',
        prompt: 'ఆంధ్రప్రదేశ్ అందమైన తీర ప్రాంతం మరియు పల్లెటూరి సాయంత్రం పై 9:16 యూట్యూబ్ షార్ట్',
        voiceName: 'Charon',
        voiceStyle: 'documentary',
        musicTrack: 'cinematic-dawn',
        musicVolume: 0.3,
        voiceVolume: 1.0,
        subtitleStyle: 'shorts-pop',
        exportCount: 1,
        createdAt: now,
        updatedAt: now,
        youtubeSeo: {
          title: 'మన తెలుగు ప్రకృతి అందాలు | Cinematic Telugu Travel Short',
          description: 'సూర్యోదయం నుండి సంధ్యా దీపాల వరకు మన తెలుగు నేల సౌందర్యాన్ని ఈ 60 సెకన్ల వీడియోలో చూడండి.',
          tags: ['Telugu Shorts', 'Andhra Pradesh', 'Travel Cinema', 'AI Video'],
          hashtags: ['#TeluguShorts', '#Kakinada', '#CinematicIndia'],
          thumbnailHook: 'ప్రకృతి మాయాజాలం!',
          uploadedStatus: 'draft',
        },
        scenes: [
          {
            id: 'sh-1',
            title: 'గిరి శిఖర సూర్యాస్తమయం',
            narration: 'ప్రయాణం ఎప్పుడూ ఒక చిన్న దీపపు వెలుగుతోనే మొదలవుతుంది.',
            subtitleTe: 'ప్రయాణం ఎప్పుడూ ఒక చిన్న దీపపు వెలుగుతోనే మొదలవుతుంది.',
            subtitleEn: 'Every great journey begins with a single lantern above the clouds.',
            durationSec: 5,
            cameraMotion: 'zoom-in',
            weatherFx: 'stars',
            backdropType: 'template',
            imageUrl: '/src/assets/images/studio_shorts_portrait_1795115467460.jpg',
            palette: { skyTop: '#0F172A', skyBottom: '#312E81', ground: '#1E293B', accent: '#F59E0B' },
            cartoonElements: { character: 'none', setting: 'mountains', mood: 'night' },
          },
          {
            id: 'sh-2',
            title: 'నదీ తీర దీపాలు',
            narration: 'సాయంత్రం వేళ గోదావరి తీరంలో వెలిగే దీపాలు మనసుకు ప్రశాంతతను ఇస్తాయి.',
            subtitleTe: 'సాయంత్రం వేళ నదీ తీర దీపాలు మనసుకు ప్రశాంతతను ఇస్తాయి.',
            subtitleEn: 'At dusk, oil lamps along the riverside bring timeless peace.',
            durationSec: 5,
            cameraMotion: 'ken-burns',
            weatherFx: 'fireflies',
            backdropType: 'template',
            imageUrl: '/src/assets/images/studio_telugu_village_1795115467329.jpg',
            palette: { skyTop: '#1E1B4B', skyBottom: '#9A3412', ground: '#0F172A', accent: '#FBBF24' },
            cartoonElements: { character: 'none', setting: 'village', mood: 'sunset' },
          },
        ],
      },
    ],
    adminSettings: {
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
      adminPin: '1234',
    },
    usageStats: {
      totalStoryboards: 2,
      totalVoices: 0,
      totalExports: 3,
      totalYouTubePreps: 1,
      todayCount: 0,
      lastResetDate: getTodayStr(),
    },
  };
}

function normalizeHexColor(val: any, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
}

function readDb(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = getSeedDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DbSchema;
    let dirty = false;
    if (
      parsed.adminSettings?.studioName === 'Kala AI Video Studio' ||
      parsed.adminSettings?.studioName === 'AI VIDEO MAKER – PRO'
    ) {
      parsed.adminSettings.studioName = 'AI VIDEO MAKER PRO';
      dirty = true;
    }
    if (
      parsed.adminSettings?.watermarkText === 'Kala AI Studio' ||
      parsed.adminSettings?.watermarkText === 'AI VIDEO MAKER – PRO'
    ) {
      parsed.adminSettings.watermarkText = 'AI VIDEO MAKER PRO';
      dirty = true;
    }
    if (Array.isArray(parsed.projects)) {
      for (const proj of parsed.projects) {
        if (Array.isArray(proj.scenes)) {
          for (const sc of proj.scenes) {
            if (sc.palette) {
              const sTop = normalizeHexColor(sc.palette.skyTop, '#0F172A');
              const sBot = normalizeHexColor(sc.palette.skyBottom, '#1E3A8A');
              const grd = normalizeHexColor(sc.palette.ground, '#14532D');
              const acc = normalizeHexColor(sc.palette.accent, '#F59E0B');
              if (
                sTop !== sc.palette.skyTop ||
                sBot !== sc.palette.skyBottom ||
                grd !== sc.palette.ground ||
                acc !== sc.palette.accent
              ) {
                sc.palette = { skyTop: sTop, skyBottom: sBot, ground: grd, accent: acc };
                dirty = true;
              }
            }
          }
        }
      }
    }
    if (parsed.usageStats.lastResetDate !== getTodayStr()) {
      parsed.usageStats.todayCount = 0;
      parsed.usageStats.lastResetDate = getTodayStr();
      dirty = true;
    }
    if (dirty) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch {
    const seed = getSeedDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function writeDb(db: DbSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw err;
      }
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, 800 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

function handleGeminiError(res: express.Response, err: any) {
  console.error('Gemini API Error:', err);
  const message = err?.message || 'AI service error occurred';
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({ error: message });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // Projects CRUD
  app.get('/api/projects', (_req, res) => {
    const db = readDb();
    res.json({ projects: db.projects });
  });

  app.post('/api/projects', (req, res) => {
    const project = req.body?.project;
    if (!project || !project.id) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }
    const db = readDb();
    // Strip oversized inline audioBase64 if needed? Keep up to reasonable size; JSON supports it cleanly for typical 4-6 scenes.
    const idx = db.projects.findIndex((p) => p.id === project.id);
    const updated = { ...project, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      db.projects[idx] = updated;
    } else {
      db.projects.unshift(updated);
    }
    writeDb(db);
    res.json({ project: updated });
  });

  app.post('/api/projects/:id/export-track', (req, res) => {
    const db = readDb();
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx >= 0) {
      db.projects[idx].exportCount = (db.projects[idx].exportCount || 0) + 1;
    }
    db.usageStats.totalExports += 1;
    writeDb(db);
    res.json({ ok: true, totalExports: db.usageStats.totalExports });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const db = readDb();
    db.projects = db.projects.filter((p) => p.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Admin Settings & Stats
  app.get('/api/admin/settings', (_req, res) => {
    const db = readDb();
    const { adminPin: _pin, ...publicSettings } = db.adminSettings;
    res.json({
      settings: publicSettings,
      usageStats: db.usageStats,
    });
  });

  app.post('/api/admin/verify-pin', (req, res) => {
    const { pin } = req.body || {};
    const db = readDb();
    if (String(pin) === String(db.adminSettings.adminPin)) {
      return res.json({ unlocked: true, settings: db.adminSettings, usageStats: db.usageStats });
    }
    return res.status(401).json({ unlocked: false, error: 'Invalid Admin PIN' });
  });

  app.post('/api/admin/settings', (req, res) => {
    const { pin, settings } = req.body || {};
    const db = readDb();
    if (String(pin) !== String(db.adminSettings.adminPin)) {
      return res.status(403).json({ error: 'Unauthorized: Invalid Admin PIN' });
    }
    db.adminSettings = {
      ...db.adminSettings,
      ...settings,
      adminPin: settings?.newPin ? String(settings.newPin) : db.adminSettings.adminPin,
    };
    writeDb(db);
    res.json({ settings: db.adminSettings, usageStats: db.usageStats });
  });

  // Generate AI Video Storyboard (Text-to-Video, Cartoon Maker, Story Maker)
  app.post('/api/studio/generate-storyboard', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }
    const db = readDb();
    if (db.adminSettings.maintenanceMode) {
      return res.status(503).json({ error: 'Studio is currently in maintenance mode set by Admin.' });
    }
    if (db.usageStats.todayCount >= db.adminSettings.freeDailyLimit) {
      return res.status(429).json({
        error: `Daily free limit (${db.adminSettings.freeDailyLimit}) reached. Admin can raise this limit in Admin Controls.`,
      });
    }

    const { prompt, style, aspectRatio, contentLanguage, mode, targetDurationSec = 30 } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const numericTarget = Math.min(120, Math.max(10, Number(targetDurationSec) || 30));
    const sceneCount = numericTarget <= 15 ? 3 : numericTarget <= 30 ? 5 : numericTarget <= 60 ? 8 : 10;
    const perSceneSec = Math.max(4, Math.round(numericTarget / sceneCount));

    const langInstruction =
      contentLanguage === 'te'
        ? 'Write narration and title in natural, expressive Telugu script (తెలుగు). Also provide English subtitle translation.'
        : contentLanguage === 'en'
          ? 'Write narration and title in engaging English. Also provide natural Telugu subtitle translation.'
          : 'Write narration in natural Telugu script (తెలుగు), and fill both subtitleTe (Telugu) and subtitleEn (English) accurately.';

    const styleInstruction =
      style === 'cartoon'
        ? 'Style is vibrant Kids AI Cartoon animation. Pick fitting cartoon characters (rabbit, turtle, kid, elder, owl, robot) and cheerful palettes.'
        : style === 'anime'
          ? 'Style is expressive Anime visual storytelling with dramatic twilight/sky gradients, petals or stars FX, and dynamic zoom/pan camera motion.'
          : style === '3d-render'
            ? 'Style is sleek 3D Motion Art with deep volumetric color palettes, futuristic robots/scenery, and smooth pan/zoom camera motion.'
            : style === 'devotional'
              ? 'Style is Telugu Heritage / Village / Devotional storytelling with warm golden oil-lamp tones, river/temple/village settings.'
              : style === 'explainer'
                ? 'Style is crisp Tech & Educational explainer with sleek contrast palettes, short visualCallout headlines (2-4 words), and clear structured narration.'
                : 'Style is Realistic Cinematic storytelling with dramatic atmospheric palettes, camera pans, and poetic narration.';

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Create a ${sceneCount}-scene video storyboard (total target duration ~${numericTarget} seconds, ~${perSceneSec}s per scene) for this text description: "${prompt}". Mode: ${mode || 'text-to-video'}. Aspect ratio: ${aspectRatio || '16:9'}.`,
          config: {
            systemInstruction: `You are an expert Telugu and English AI Video Director and Storyboard Writer for YouTube creators. ${langInstruction} ${styleInstruction} Keep each scene narration paced naturally for ~${perSceneSec} seconds (about ${perSceneSec * 2.5} words). Choose valid enum values for cameraMotion, weatherFx, character, setting, and mood.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                videoTitle: { type: Type.STRING, description: 'Catchy title for the video project' },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      narration: { type: Type.STRING, description: 'Spoken voiceover text for TTS' },
                      subtitleTe: { type: Type.STRING, description: 'Telugu subtitle text' },
                      subtitleEn: { type: Type.STRING, description: 'English subtitle text' },
                      visualCallout: { type: Type.STRING, description: 'Short 2-4 word visual highlight caption for explainer/title overlay' },
                      durationSec: { type: Type.INTEGER, description: `Recommended duration around ${perSceneSec} seconds (between 4 and 10)` },
                      cameraMotion: {
                        type: Type.STRING,
                        description: 'One of: zoom-in, zoom-out, pan-left, pan-right, ken-burns, bounce-cartoon',
                      },
                      weatherFx: {
                        type: Type.STRING,
                        description: 'One of: none, fireflies, golden-dust, rain, stars, petals',
                      },
                      suggestedBackdrop: {
                        type: Type.STRING,
                        description: 'One of: procedural, cartoon-jungle, realistic-cinema, shorts-ridge, telugu-village',
                      },
                      skyTop: { type: Type.STRING, description: 'Hex color for top of sky' },
                      skyBottom: { type: Type.STRING, description: 'Hex color for horizon' },
                      ground: { type: Type.STRING, description: 'Hex color for foreground terrain' },
                      accent: { type: Type.STRING, description: 'Hex color for sun/moon/glow highlight' },
                      character: {
                        type: Type.STRING,
                        description: 'One of: rabbit, turtle, kid, elder, owl, robot, none',
                      },
                      secondaryCharacter: {
                        type: Type.STRING,
                        description: 'One of: rabbit, turtle, kid, elder, owl, robot, none',
                      },
                      setting: {
                        type: Type.STRING,
                        description: 'One of: forest, village, ocean, mountains, temple, space, city',
                      },
                      mood: {
                        type: Type.STRING,
                        description: 'One of: sunny, sunset, night, magical',
                      },
                    },
                    required: [
                      'title',
                      'narration',
                      'subtitleTe',
                      'subtitleEn',
                      'durationSec',
                      'cameraMotion',
                      'weatherFx',
                      'suggestedBackdrop',
                      'skyTop',
                      'skyBottom',
                      'ground',
                      'accent',
                      'character',
                      'setting',
                      'mood',
                    ],
                  },
                },
              },
              required: ['videoTitle', 'scenes'],
            },
          },
        })
      );

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);

      const backdropMap: Record<string, string> = {
        'cartoon-jungle': '/src/assets/images/studio_cartoon_jungle_1795115468069.jpg',
        'realistic-cinema': '/src/assets/images/studio_realistic_cinema_1795115468140.jpg',
        'shorts-ridge': '/src/assets/images/studio_shorts_portrait_1795115467460.jpg',
        'telugu-village': '/src/assets/images/studio_telugu_village_1795115467329.jpg',
      };

      const mappedScenes = (parsed.scenes || []).map((s: any, idx: number) => {
        const templateUrl = backdropMap[s.suggestedBackdrop];
        const useTemplate = Boolean(templateUrl) && idx === 0 && style !== 'anime' && style !== '3d-render';
        return {
          id: `scene-${Date.now()}-${idx}`,
          title: s.title || `Scene ${idx + 1}`,
          narration: s.narration || '',
          subtitleTe: s.subtitleTe || s.narration || '',
          subtitleEn: s.subtitleEn || s.narration || '',
          visualCallout: s.visualCallout || '',
          durationSec: Math.min(12, Math.max(4, Number(s.durationSec) || perSceneSec)),
          cameraMotion: s.cameraMotion || (style === 'cartoon' ? 'bounce-cartoon' : 'ken-burns'),
          weatherFx: s.weatherFx || 'golden-dust',
          backdropType: useTemplate ? 'template' : 'procedural',
          imageUrl: useTemplate ? templateUrl : undefined,
          palette: {
            skyTop: normalizeHexColor(s.skyTop, '#0F172A'),
            skyBottom: normalizeHexColor(s.skyBottom, '#1E3A8A'),
            ground: normalizeHexColor(s.ground, '#14532D'),
            accent: normalizeHexColor(s.accent, '#F59E0B'),
          },
          cartoonElements: {
            character: style === 'realistic' ? 'none' : s.character || 'none',
            secondaryCharacter: style === 'realistic' ? 'none' : s.secondaryCharacter || 'none',
            setting: s.setting || 'forest',
            mood: s.mood || 'sunny',
          },
        };
      });

      db.usageStats.totalStoryboards += 1;
      db.usageStats.todayCount += 1;
      writeDb(db);

      res.json({
        videoTitle: parsed.videoTitle || prompt.slice(0, 48),
        scenes: mappedScenes,
      });
    } catch (err: any) {
      handleGeminiError(res, err);
    }
  });

  // Generate AI Voiceover via gemini-3.8-flash-lite-tts
  app.post('/api/studio/generate-voice', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }
    const { text, voiceName = 'Kore', voiceStyle = 'storyteller' } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Narration text is required' });
    }

    const styleDescMap: Record<string, string> = {
      storyteller: 'Warm, expressive storyteller narration with natural pacing',
      cartoon: 'Cheerful, animated, friendly kids cartoon narrator',
      documentary: 'Clear, authoritative, calm documentary film narrator',
      energetic: 'Upbeat, energetic YouTube Shorts creator voice',
    };

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  speechMetadata: {
                    style: styleDescMap[voiceStyle] || styleDescMap.storyteller,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(voiceName)
                    ? voiceName
                    : 'Kore',
                },
              },
            },
          },
        })
      );

      const inlineData = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)?.inlineData;
      if (!inlineData?.data) {
        return res.status(502).json({ error: 'No audio generated by TTS model.' });
      }

      const db = readDb();
      db.usageStats.totalVoices += 1;
      writeDb(db);

      res.json({
        audioBase64: inlineData.data,
        mimeType: inlineData.mimeType || 'audio/wav',
      });
    } catch (err: any) {
      handleGeminiError(res, err);
    }
  });

  // Generate YouTube Upload SEO Metadata
  app.post('/api/studio/youtube-seo', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }
    const { title, scenes = [], aspectRatio = '16:9', contentLanguage = 'bilingual', style = 'cartoon' } = req.body || {};
    const scriptSummary = (scenes as any[])
      .map((s, i) => `Scene ${i + 1} (${s.durationSec}s): ${s.title} - ${s.narration}`)
      .join('\n');

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Generate YouTube SEO metadata for this AI video.\nTitle: ${title}\nFormat: ${aspectRatio === '9:16' ? 'YouTube Shorts (9:16)' : 'YouTube Full Video (16:9)'}\nStyle: ${style}\nLanguage: ${contentLanguage}\nStoryboard:\n${scriptSummary}`,
          config: {
            systemInstruction:
              'You are a YouTube growth strategist specializing in Telugu and English channels. Generate a high-CTR title, detailed SEO description with scene timestamps, 12 relevant tags, 5 hashtags, and a 3-5 word bold thumbnail hook text.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                thumbnailHook: { type: Type.STRING },
              },
              required: ['title', 'description', 'tags', 'hashtags', 'thumbnailHook'],
            },
          },
        })
      );

      const seo = JSON.parse((response.text ?? '{}').trim());
      const db = readDb();
      db.usageStats.totalYouTubePreps += 1;
      writeDb(db);

      res.json({
        seo: {
          ...seo,
          uploadedStatus: 'ready',
        },
      });
    } catch (err: any) {
      handleGeminiError(res, err);
    }
  });

  // Clear starter demo projects
  app.post('/api/projects/clear-demos', (_req, res) => {
    const db = readDb();
    db.projects = db.projects.filter(
      (p) => p.id !== 'proj-cartoon-rabbit' && p.id !== 'proj-kakinada-short'
    );
    writeDb(db);
    res.json({ projects: db.projects });
  });

  // AI Photo Studio: generate enhanced prompt + safe SVG illustration artwork (free-tier Gemini 4 Hydrogen)
  app.post('/api/studio/generate-photo', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }
    const { prompt, style = '3D Cartoon', size = '1024x1024' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image description is required' });
    }

    const [wStr, hStr] = String(size).split('x');
    const vw = Number(wStr) || 1024;
    const vh = Number(hStr) || 1024;

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Create a detailed visual illustration and enhanced AI image prompt for: "${prompt}". Style: ${style}. Target viewBox: 0 0 ${vw} ${vh}.`,
          config: {
            systemInstruction: `You are an expert visual illustrator and AI prompt engineer. Return JSON with:
1. "title": short Telugu or English artwork title
2. "enhancedPrompt": rich, professional photography/illustration prompt describing lighting, composition, textures, and colors
3. "svgMarkup": a complete, rich, layered, artistic <svg viewBox="0 0 ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg">...</svg> scene matching the prompt and style (use linearGradient/radialGradient, paths, circles, hills, characters/objects, lighting highlights). Do NOT include <script>, <foreignObject>, or event attributes.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                enhancedPrompt: { type: Type.STRING },
                svgMarkup: { type: Type.STRING },
              },
              required: ['title', 'enhancedPrompt', 'svgMarkup'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      let cleanSvg = String(parsed.svgMarkup || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
        .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '');

      if (!cleanSvg.includes('<svg')) {
        cleanSvg = `<svg viewBox="0 0 ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg"><rect width="${vw}" height="${vh}" fill="#0F172A"/></svg>`;
      }

      res.json({
        title: parsed.title || 'AI Artwork',
        enhancedPrompt: parsed.enhancedPrompt || prompt,
        svgMarkup: cleanSvg,
        width: vw,
        height: vh,
      });
    } catch (err: any) {
      handleGeminiError(res, err);
    }
  });

  // Telugu & English Story Studio: generate structured story & scene plan
  app.post('/api/studio/generate-story', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }
    const {
      topic,
      storyType = 'పిల్లల కథ',
      sceneCount = 3,
      language = 'te',
    } = req.body || {};

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Story topic is required' });
    }

    const count = Math.min(8, Math.max(2, Number(sceneCount) || 3));
    const langRule =
      language === 'en'
        ? 'Write the story, moral, and scene narrations in clear, vivid English, with Telugu subtitle translations.'
        : 'Write the story, moral, and scene narrations in natural, engaging Telugu (తెలుగు), with English subtitle translations.';

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Write a ${count}-scene story on topic: "${topic}". Category: ${storyType}.`,
          config: {
            systemInstruction: `You are a master Telugu & English storyteller. ${langRule} Return JSON with title, moral, fullStory (formatted paragraphs), and ${count} scenes ready to turn into a video.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                moral: { type: Type.STRING },
                fullStory: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      narration: { type: Type.STRING },
                      subtitleTe: { type: Type.STRING },
                      subtitleEn: { type: Type.STRING },
                      durationSec: { type: Type.INTEGER },
                      character: { type: Type.STRING },
                      setting: { type: Type.STRING },
                      skyTop: { type: Type.STRING },
                      skyBottom: { type: Type.STRING },
                      ground: { type: Type.STRING },
                      accent: { type: Type.STRING },
                    },
                    required: [
                      'title',
                      'narration',
                      'subtitleTe',
                      'subtitleEn',
                      'durationSec',
                      'character',
                      'setting',
                      'skyTop',
                      'skyBottom',
                      'ground',
                      'accent',
                    ],
                  },
                },
              },
              required: ['title', 'moral', 'fullStory', 'scenes'],
            },
          },
        })
      );

      const data = JSON.parse((response.text ?? '{}').trim());
      const scenes = (data.scenes || []).map((s: any, idx: number) => ({
        id: `story-sc-${Date.now()}-${idx}`,
        title: s.title || `Scene ${idx + 1}`,
        narration: s.narration || '',
        subtitleTe: s.subtitleTe || s.narration || '',
        subtitleEn: s.subtitleEn || s.narration || '',
        durationSec: Math.min(10, Math.max(4, Number(s.durationSec) || 6)),
        cameraMotion: 'ken-burns',
        weatherFx: 'golden-dust',
        backdropType: 'procedural',
        palette: {
          skyTop: normalizeHexColor(s.skyTop, '#0F172A'),
          skyBottom: normalizeHexColor(s.skyBottom, '#1E3A8A'),
          ground: normalizeHexColor(s.ground, '#14532D'),
          accent: normalizeHexColor(s.accent, '#F59E0B'),
        },
        cartoonElements: {
          character: ['rabbit', 'turtle', 'kid', 'elder', 'owl', 'robot'].includes(s.character)
            ? s.character
            : 'kid',
          setting: ['forest', 'village', 'ocean', 'mountains', 'temple', 'space', 'city'].includes(s.setting)
            ? s.setting
            : 'village',
          mood: 'sunny',
        },
      }));

      res.json({
        title: data.title || topic,
        moral: data.moral || '',
        fullStory: data.fullStory || '',
        scenes,
      });
    } catch (err: any) {
      handleGeminiError(res, err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kala AI Video Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
