import { MusicTrackId } from '../types/studio';

export const MUSIC_TRACK_OPTIONS: { id: MusicTrackId; labelTe: string; labelEn: string; bpm: number }[] = [
  { id: 'kids-playful', labelTe: 'పిల్లల కార్టూన్ మ్యూజిక్', labelEn: 'Kids Playful Cartoon', bpm: 120 },
  { id: 'cinematic-dawn', labelTe: 'సినిమాటిక్ డాన్', labelEn: 'Cinematic Dawn', bpm: 78 },
  { id: 'devotional-flute', labelTe: 'వేణుగానం / భక్తి', labelEn: 'Serene Flute & Drone', bpm: 70 },
  { id: 'shorts-beat', labelTe: 'షార్ట్స్ రిథమ్ బీట్', labelEn: 'Upbeat Shorts Beat', bpm: 128 },
  { id: 'calm-documentary', labelTe: 'డాక్యుమెంటరీ పియానో', labelEn: 'Calm Documentary', bpm: 86 },
  { id: 'none', labelTe: 'సంగీతం వద్దు (వాయిస్ మాత్రమే)', labelEn: 'No Music (Voice Only)', bpm: 0 },
];

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function decodeWavBase64(ctx: AudioContext, base64: string): Promise<AudioBuffer> {
  const bytes = base64ToUint8Array(base64);
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return ctx.decodeAudioData(copy);
}

/**
 * Schedules procedural, copyright-free background music onto an AudioContext GainNode.
 * Works identically for live preview playback and MediaStreamDestination video recording.
 */
export function scheduleProceduralMusic(
  ctx: AudioContext,
  destNode: AudioNode,
  trackId: MusicTrackId,
  startTime: number,
  totalDurationSec: number
): () => void {
  if (trackId === 'none' || totalDurationSec <= 0) {
    return () => {};
  }

  const activeNodes: AudioScheduledSourceNode[] = [];
  const track = MUSIC_TRACK_OPTIONS.find((t) => t.id === trackId) || MUSIC_TRACK_OPTIONS[0];
  const beatSec = 60 / (track.bpm || 90);

  const playTone = (
    freq: number,
    when: number,
    dur: number,
    type: OscillatorType,
    peakGain: number,
    attack = 0.02
  ) => {
    if (when > startTime + totalDurationSec) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peakGain, when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    osc.connect(gain);
    gain.connect(destNode);
    osc.start(when);
    osc.stop(when + dur + 0.05);
    activeNodes.push(osc);
  };

  if (trackId === 'kids-playful') {
    // Cheerful marimba/xylophone pentatonic bounce
    const notes = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33];
    const bass = [261.63, 196.0, 220.0, 196.0];
    const step = beatSec / 2;
    const steps = Math.ceil(totalDurationSec / step);
    for (let i = 0; i < steps; i++) {
      const t = startTime + i * step;
      playTone(notes[i % notes.length], t, step * 0.85, 'triangle', 0.22, 0.01);
      if (i % 4 === 0) {
        playTone(bass[(i / 4) % bass.length], t, step * 3.5, 'sine', 0.18, 0.02);
      }
    }
  } else if (trackId === 'cinematic-dawn') {
    // Lush warm chord pads + gentle top arpeggio
    const chords = [
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [196, 246.94, 293.66],
      [164.81, 196, 246.94],
    ];
    const chordDur = beatSec * 4;
    const count = Math.ceil(totalDurationSec / chordDur);
    for (let i = 0; i < count; i++) {
      const t = startTime + i * chordDur;
      const chord = chords[i % chords.length];
      chord.forEach((f) => playTone(f, t, chordDur * 0.96, 'sine', 0.12, 0.35));
      chord.forEach((f, idx) => {
        playTone(f * 2, t + idx * beatSec, beatSec * 1.4, 'triangle', 0.08, 0.04);
      });
    }
  } else if (trackId === 'devotional-flute') {
    // Serene tanpura-like Sa-Pa drone + bansuri pentatonic melody (Bhupali raga feel)
    const sa = 261.63;
    const pa = 392.0;
    playTone(sa / 2, startTime, totalDurationSec, 'sine', 0.14, 0.5);
    playTone(pa / 2, startTime, totalDurationSec, 'sine', 0.08, 0.5);
    const raga = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
    const step = beatSec * 1.5;
    const count = Math.ceil(totalDurationSec / step);
    for (let i = 0; i < count; i++) {
      const t = startTime + i * step;
      playTone(raga[(i * 3) % raga.length], t, step * 0.92, 'sine', 0.16, 0.18);
    }
  } else if (trackId === 'shorts-beat') {
    // Crisp energetic pulse + synth bass
    const bassLine = [110, 110, 130.81, 146.83];
    const lead = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440];
    const step = beatSec / 2;
    const count = Math.ceil(totalDurationSec / step);
    for (let i = 0; i < count; i++) {
      const t = startTime + i * step;
      if (i % 2 === 0) {
        playTone(65, t, 0.12, 'sine', 0.3, 0.005); // kick pulse
        playTone(bassLine[(i / 2) % bassLine.length], t, step * 1.5, 'sawtooth', 0.06, 0.01);
      }
      playTone(lead[i % lead.length], t, step * 0.75, 'triangle', 0.14, 0.01);
    }
  } else if (trackId === 'calm-documentary') {
    const arp = [261.63, 329.63, 392.0, 493.88, 392.0, 329.63];
    const step = beatSec;
    const count = Math.ceil(totalDurationSec / step);
    for (let i = 0; i < count; i++) {
      const t = startTime + i * step;
      playTone(arp[i % arp.length], t, step * 1.6, 'sine', 0.15, 0.05);
      if (i % 6 === 0) {
        playTone(130.81, t, step * 5.8, 'triangle', 0.1, 0.25);
      }
    }
  }

  return () => {
    activeNodes.forEach((n) => {
      try {
        n.stop();
        n.disconnect();
      } catch {
        // already stopped
      }
    });
  };
}
