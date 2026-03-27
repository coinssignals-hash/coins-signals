// Notification sound utility using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

export type SoundType = 
  | 'signal' | 'alert' | 'buy' | 'sell' 
  | 'pattern_bullish' | 'pattern_bearish' | 'pattern_neutral'
  // Money / Cash register sounds
  | 'money_cashregister' | 'money_coins' | 'money_jackpot' | 'money_vault'
  // Winning sounds
  | 'win_fanfare' | 'win_levelup' | 'win_chime' | 'win_triumph'
  // Attention sounds
  | 'attention_urgent' | 'attention_radar' | 'attention_siren' | 'attention_bell'
  // Smart alert sounds
  | 'smart_pulse' | 'smart_digital' | 'smart_sonar' | 'smart_crystal';

export type SoundCategory = 'money' | 'winning' | 'attention' | 'smart';

export interface SoundOption {
  id: SoundType;
  category: SoundCategory;
  labelKey: string;
  descKey: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  // Money sounds
  { id: 'money_cashregister', category: 'money', labelKey: 'sound_cashregister', descKey: 'sound_cashregister_desc' },
  { id: 'money_coins', category: 'money', labelKey: 'sound_coins', descKey: 'sound_coins_desc' },
  { id: 'money_jackpot', category: 'money', labelKey: 'sound_jackpot', descKey: 'sound_jackpot_desc' },
  { id: 'money_vault', category: 'money', labelKey: 'sound_vault', descKey: 'sound_vault_desc' },
  // Winning sounds
  { id: 'win_fanfare', category: 'winning', labelKey: 'sound_fanfare', descKey: 'sound_fanfare_desc' },
  { id: 'win_levelup', category: 'winning', labelKey: 'sound_levelup', descKey: 'sound_levelup_desc' },
  { id: 'win_chime', category: 'winning', labelKey: 'sound_chime', descKey: 'sound_chime_desc' },
  { id: 'win_triumph', category: 'winning', labelKey: 'sound_triumph', descKey: 'sound_triumph_desc' },
  // Attention sounds
  { id: 'attention_urgent', category: 'attention', labelKey: 'sound_urgent', descKey: 'sound_urgent_desc' },
  { id: 'attention_radar', category: 'attention', labelKey: 'sound_radar', descKey: 'sound_radar_desc' },
  { id: 'attention_siren', category: 'attention', labelKey: 'sound_siren', descKey: 'sound_siren_desc' },
  { id: 'attention_bell', category: 'attention', labelKey: 'sound_bell', descKey: 'sound_bell_desc' },
  // Smart alert sounds
  { id: 'smart_pulse', category: 'smart', labelKey: 'sound_pulse', descKey: 'sound_pulse_desc' },
  { id: 'smart_digital', category: 'smart', labelKey: 'sound_digital', descKey: 'sound_digital_desc' },
  { id: 'smart_sonar', category: 'smart', labelKey: 'sound_sonar', descKey: 'sound_sonar_desc' },
  { id: 'smart_crystal', category: 'smart', labelKey: 'sound_crystal', descKey: 'sound_crystal_desc' },
];

export const SOUND_CATEGORIES: { id: SoundCategory; labelKey: string; color: string; icon: string }[] = [
  { id: 'money', labelKey: 'sound_cat_money', color: '142 71% 45%', icon: '💰' },
  { id: 'winning', labelKey: 'sound_cat_winning', color: '45 95% 55%', icon: '🏆' },
  { id: 'attention', labelKey: 'sound_cat_attention', color: '0 84% 60%', icon: '🚨' },
  { id: 'smart', labelKey: 'sound_cat_smart', color: '270 70% 60%', icon: '🤖' },
];

// Helper to play a sequence of notes
function playNotes(
  ctx: AudioContext,
  type: OscillatorType,
  notes: { freq: number; time: number }[],
  gain: number,
  fadeEnd: number,
  totalDuration: number
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = type;
  for (const n of notes) {
    osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);
  }
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + fadeEnd);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + totalDuration);
}

// Play two oscillators together for richer sound
function playChord(
  ctx: AudioContext,
  type: OscillatorType,
  notes1: { freq: number; time: number }[],
  notes2: { freq: number; time: number }[],
  gain: number,
  fadeEnd: number,
  totalDuration: number
) {
  playNotes(ctx, type, notes1, gain * 0.7, fadeEnd, totalDuration);
  playNotes(ctx, type, notes2, gain * 0.5, fadeEnd, totalDuration);
}

export const playNotificationSound = (type: SoundType = 'signal') => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    switch (type) {
      // ── Original sounds ──
      case 'buy':
        playNotes(ctx, 'sine', [
          { freq: 523.25, time: 0 }, { freq: 659.25, time: 0.1 }, { freq: 783.99, time: 0.2 }
        ], 0.3, 0.4, 0.4);
        break;
      case 'sell':
        playNotes(ctx, 'sine', [
          { freq: 783.99, time: 0 }, { freq: 659.25, time: 0.1 }, { freq: 523.25, time: 0.2 }
        ], 0.3, 0.4, 0.4);
        break;
      case 'alert':
        playNotes(ctx, 'square', [
          { freq: 587.33, time: 0 }, { freq: 783.99, time: 0.1 }, { freq: 587.33, time: 0.2 }
        ], 0.2, 0.4, 0.4);
        break;
      case 'pattern_bullish':
        playNotes(ctx, 'sine', [
          { freq: 440, time: 0 }, { freq: 554.37, time: 0.08 }, { freq: 659.25, time: 0.16 }, { freq: 880, time: 0.24 }
        ], 0.25, 0.5, 0.5);
        break;
      case 'pattern_bearish':
        playNotes(ctx, 'triangle', [
          { freq: 880, time: 0 }, { freq: 659.25, time: 0.1 }, { freq: 440, time: 0.2 }, { freq: 329.63, time: 0.3 }
        ], 0.25, 0.5, 0.5);
        break;
      case 'pattern_neutral':
        playNotes(ctx, 'sine', [
          { freq: 523.25, time: 0 }, { freq: 659.25, time: 0.15 }, { freq: 523.25, time: 0.3 }
        ], 0.2, 0.45, 0.45);
        break;

      // ── Money / Cash sounds ──
      case 'money_cashregister':
        // Ka-ching! Sharp ascending with metallic ring
        playNotes(ctx, 'square', [
          { freq: 1200, time: 0 }, { freq: 1600, time: 0.05 }, { freq: 2400, time: 0.1 }
        ], 0.15, 0.25, 0.25);
        playNotes(ctx, 'sine', [
          { freq: 2000, time: 0.1 }, { freq: 2200, time: 0.15 }
        ], 0.2, 0.4, 0.4);
        break;
      case 'money_coins':
        // Coins jingling - multiple quick high tones
        playNotes(ctx, 'sine', [
          { freq: 3000, time: 0 }, { freq: 2800, time: 0.04 }, { freq: 3200, time: 0.08 },
          { freq: 2600, time: 0.12 }, { freq: 3400, time: 0.16 }, { freq: 2900, time: 0.2 }
        ], 0.15, 0.35, 0.35);
        break;
      case 'money_jackpot':
        // Jackpot! Exciting ascending fanfare
        playChord(ctx, 'sine',
          [{ freq: 523, time: 0 }, { freq: 659, time: 0.1 }, { freq: 784, time: 0.2 }, { freq: 1047, time: 0.3 }, { freq: 1319, time: 0.4 }],
          [{ freq: 659, time: 0 }, { freq: 784, time: 0.1 }, { freq: 1047, time: 0.2 }, { freq: 1319, time: 0.3 }, { freq: 1568, time: 0.4 }],
          0.25, 0.6, 0.6);
        break;
      case 'money_vault':
        // Deep vault opening with resonance
        playNotes(ctx, 'sine', [
          { freq: 200, time: 0 }, { freq: 300, time: 0.15 }, { freq: 500, time: 0.3 }, { freq: 800, time: 0.4 }
        ], 0.3, 0.6, 0.6);
        playNotes(ctx, 'triangle', [
          { freq: 400, time: 0.3 }, { freq: 600, time: 0.4 }
        ], 0.15, 0.6, 0.6);
        break;

      // ── Winning sounds ──
      case 'win_fanfare':
        // Triumphant fanfare C-E-G-C
        playChord(ctx, 'sine',
          [{ freq: 523, time: 0 }, { freq: 659, time: 0.12 }, { freq: 784, time: 0.24 }, { freq: 1047, time: 0.36 }],
          [{ freq: 784, time: 0 }, { freq: 988, time: 0.12 }, { freq: 1175, time: 0.24 }, { freq: 1568, time: 0.36 }],
          0.25, 0.6, 0.6);
        break;
      case 'win_levelup':
        // Game-like level up - rapid ascending sweep
        playNotes(ctx, 'square', [
          { freq: 400, time: 0 }, { freq: 500, time: 0.05 }, { freq: 600, time: 0.1 },
          { freq: 750, time: 0.15 }, { freq: 900, time: 0.2 }, { freq: 1100, time: 0.25 }, { freq: 1300, time: 0.3 }
        ], 0.15, 0.45, 0.45);
        break;
      case 'win_chime':
        // Elegant wind chime
        playNotes(ctx, 'sine', [
          { freq: 1047, time: 0 }, { freq: 1319, time: 0.08 }, { freq: 1568, time: 0.16 },
          { freq: 2093, time: 0.24 }, { freq: 1568, time: 0.32 }
        ], 0.2, 0.5, 0.5);
        break;
      case 'win_triumph':
        // Victory triumph - bold major chord progression
        playNotes(ctx, 'sawtooth', [
          { freq: 440, time: 0 }, { freq: 554, time: 0.15 }, { freq: 660, time: 0.3 }
        ], 0.12, 0.55, 0.55);
        playNotes(ctx, 'sine', [
          { freq: 880, time: 0.3 }, { freq: 1100, time: 0.4 }, { freq: 1320, time: 0.45 }
        ], 0.2, 0.65, 0.65);
        break;

      // ── Attention sounds ──
      case 'attention_urgent':
        // Fast pulsing alert
        playNotes(ctx, 'square', [
          { freq: 880, time: 0 }, { freq: 1100, time: 0.08 }, { freq: 880, time: 0.16 }, { freq: 1100, time: 0.24 }
        ], 0.2, 0.4, 0.4);
        break;
      case 'attention_radar':
        // Radar ping sweep
        playNotes(ctx, 'sine', [
          { freq: 1500, time: 0 }, { freq: 800, time: 0.15 }
        ], 0.25, 0.35, 0.35);
        setTimeout(() => {
          try {
            playNotes(ctx, 'sine', [
              { freq: 1500, time: 0 }, { freq: 800, time: 0.15 }
            ], 0.15, 0.3, 0.3);
          } catch {}
        }, 400);
        break;
      case 'attention_siren':
        // Mini siren wail
        playNotes(ctx, 'sawtooth', [
          { freq: 600, time: 0 }, { freq: 900, time: 0.15 }, { freq: 600, time: 0.3 }, { freq: 900, time: 0.45 }
        ], 0.12, 0.55, 0.55);
        break;
      case 'attention_bell':
        // Classic bell ring
        playNotes(ctx, 'sine', [
          { freq: 1200, time: 0 }, { freq: 1200, time: 0.2 }
        ], 0.3, 0.5, 0.5);
        playNotes(ctx, 'sine', [
          { freq: 2400, time: 0 }, { freq: 2400, time: 0.2 }
        ], 0.1, 0.5, 0.5);
        break;

      // ── Smart alert sounds ──
      case 'smart_pulse':
        // Digital pulse - futuristic
        playNotes(ctx, 'sine', [
          { freq: 800, time: 0 }, { freq: 1000, time: 0.06 }, { freq: 1200, time: 0.12 }, { freq: 800, time: 0.18 }
        ], 0.2, 0.35, 0.35);
        break;
      case 'smart_digital':
        // Digital beep sequence
        playNotes(ctx, 'square', [
          { freq: 1000, time: 0 }, { freq: 1200, time: 0.08 }, { freq: 1500, time: 0.16 }
        ], 0.12, 0.3, 0.3);
        playNotes(ctx, 'sine', [
          { freq: 2000, time: 0.2 }
        ], 0.15, 0.35, 0.35);
        break;
      case 'smart_sonar':
        // Sonar ping
        playNotes(ctx, 'sine', [
          { freq: 1500, time: 0 }
        ], 0.3, 0.5, 0.5);
        playNotes(ctx, 'sine', [
          { freq: 3000, time: 0 }
        ], 0.08, 0.5, 0.5);
        break;
      case 'smart_crystal':
        // Crystal clear chime
        playNotes(ctx, 'sine', [
          { freq: 2093, time: 0 }, { freq: 2637, time: 0.1 }, { freq: 3136, time: 0.2 }
        ], 0.15, 0.45, 0.45);
        playNotes(ctx, 'sine', [
          { freq: 4186, time: 0.2 }
        ], 0.08, 0.45, 0.45);
        break;

      case 'signal':
      default:
        playNotes(ctx, 'sine', [
          { freq: 880, time: 0 }, { freq: 1108.73, time: 0.1 }
        ], 0.3, 0.3, 0.3);
        break;
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// Enable audio after user interaction (required by browsers)
export const enableAudio = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (error) {
    console.error('Error enabling audio:', error);
  }
};

// Sound preference storage
const SOUND_PREF_KEY = 'alert_sound_preferences';

export interface SoundPreferences {
  buySignal: SoundType;
  sellSignal: SoundType;
  criticalAlert: SoundType;
  smartAlert: SoundType;
}

const DEFAULT_PREFS: SoundPreferences = {
  buySignal: 'buy',
  sellSignal: 'sell',
  criticalAlert: 'alert',
  smartAlert: 'smart_pulse',
};

export const getSoundPreferences = (): SoundPreferences => {
  try {
    const saved = localStorage.getItem(SOUND_PREF_KEY);
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
};

export const saveSoundPreferences = (prefs: Partial<SoundPreferences>) => {
  const current = getSoundPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(SOUND_PREF_KEY, JSON.stringify(updated));
  return updated;
};
