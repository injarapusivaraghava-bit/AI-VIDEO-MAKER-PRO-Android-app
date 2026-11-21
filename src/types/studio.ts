export type LanguageMode = 'te' | 'en';
export type ContentLanguage = 'te' | 'en' | 'bilingual';
export type VideoStyle = 'cartoon' | 'realistic' | 'anime' | '3d-render' | 'devotional' | 'explainer';
export type VideoLengthOption = 15 | 30 | 60 | 90;
export type AspectRatio = '16:9' | '9:16';
export type CreationMode = 'text-to-video' | 'image-to-video' | 'cartoon-maker' | 'story-maker';
export type CameraMotion =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'ken-burns'
  | 'bounce-cartoon';

export type WeatherFx = 'none' | 'fireflies' | 'golden-dust' | 'rain' | 'stars' | 'petals';

export type MusicTrackId =
  | 'none'
  | 'cinematic-dawn'
  | 'kids-playful'
  | 'devotional-flute'
  | 'shorts-beat'
  | 'calm-documentary';

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type VoiceStylePreset = 'storyteller' | 'cartoon' | 'documentary' | 'energetic';
export type SubtitleStyle = 'cinema' | 'shorts-pop' | 'minimal' | 'off';

export type CartoonCharacter = 'rabbit' | 'turtle' | 'kid' | 'elder' | 'owl' | 'robot' | 'none';
export type SceneSetting = 'forest' | 'village' | 'ocean' | 'mountains' | 'temple' | 'space' | 'city';

export interface ScenePalette {
  skyTop: string;
  skyBottom: string;
  ground: string;
  accent: string;
}

export interface CartoonElements {
  character: CartoonCharacter;
  secondaryCharacter?: CartoonCharacter;
  setting: SceneSetting;
  mood: 'sunny' | 'sunset' | 'night' | 'magical';
}

export interface SceneItem {
  id: string;
  title: string;
  narration: string;
  subtitleTe: string;
  subtitleEn: string;
  visualCallout?: string;
  durationSec: number;
  cameraMotion: CameraMotion;
  weatherFx: WeatherFx;
  backdropType: 'procedural' | 'template' | 'uploaded';
  imageUrl?: string;
  palette: ScenePalette;
  cartoonElements: CartoonElements;
  audioBase64?: string;
  audioMimeType?: string;
  audioStatus?: 'idle' | 'generating' | 'ready' | 'error';
}

export interface YouTubeSeo {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailHook: string;
  uploadedStatus: 'draft' | 'ready' | 'uploaded';
  uploadedAt?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  mode: CreationMode;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  targetDurationSec?: VideoLengthOption;
  contentLanguage: ContentLanguage;
  prompt: string;
  voiceName: VoiceName;
  voiceStyle: VoiceStylePreset;
  musicTrack: MusicTrackId;
  musicVolume: number;
  voiceVolume: number;
  subtitleStyle: SubtitleStyle;
  scenes: SceneItem[];
  youtubeSeo?: YouTubeSeo;
  createdAt: string;
  updatedAt: string;
  exportCount: number;
}

export interface AdminSettings {
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
}

export interface UsageStats {
  totalStoryboards: number;
  totalVoices: number;
  totalExports: number;
  totalYouTubePreps: number;
  todayCount: number;
  lastResetDate: string;
}

export const STUDIO_BACKDROPS = [
  {
    id: 'cartoon-jungle',
    labelTe: 'కార్టూన్ అడవి',
    labelEn: 'Cartoon Forest',
    url: '/src/assets/images/studio_cartoon_jungle_1795115468069.jpg',
    style: 'cartoon' as VideoStyle,
    aspectRatio: '16:9' as AspectRatio,
  },
  {
    id: 'realistic-cinema',
    labelTe: 'సముద్ర తీర సినిమా',
    labelEn: 'Coastal Cinema',
    url: '/src/assets/images/studio_realistic_cinema_1795115468140.jpg',
    style: 'realistic' as VideoStyle,
    aspectRatio: '16:9' as AspectRatio,
  },
  {
    id: 'shorts-ridge',
    labelTe: 'పర్వత యాత్ర (9:16)',
    labelEn: 'Mountain Twilight (9:16)',
    url: '/src/assets/images/studio_shorts_portrait_1795115467460.jpg',
    style: 'realistic' as VideoStyle,
    aspectRatio: '9:16' as AspectRatio,
  },
  {
    id: 'telugu-village',
    labelTe: 'తెలుగు పల్లెటూరు',
    labelEn: 'Telugu Riverside Village',
    url: '/src/assets/images/studio_telugu_village_1795115467329.jpg',
    style: 'devotional' as VideoStyle,
    aspectRatio: '16:9' as AspectRatio,
  },
];
