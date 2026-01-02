// Notification sound utility using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

export type SoundType = 'signal' | 'alert' | 'buy' | 'sell' | 'pattern_bullish' | 'pattern_bearish' | 'pattern_neutral';

export const playNotificationSound = (type: SoundType = 'signal') => {
  try {
    const ctx = getAudioContext();
    
    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'buy':
        // Ascending tones - positive/bullish feeling
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;

      case 'sell':
        // Descending tones - cautious/bearish feeling
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.2); // C5
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;

      case 'alert':
        // Alert sound for critical indicators
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
        oscillator.frequency.setValueAtTime(587.33, ctx.currentTime + 0.2); // D5
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;

      case 'pattern_bullish':
        // Bullish pattern - bright ascending chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
        oscillator.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08); // C#5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16); // E5
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.24); // A5
        
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case 'pattern_bearish':
        // Bearish pattern - descending warning tone
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.2); // A4
        oscillator.frequency.setValueAtTime(329.63, ctx.currentTime + 0.3); // E4
        
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case 'pattern_neutral':
        // Neutral pattern - gentle two-tone chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.3); // C5
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.45);
        break;

      case 'signal':
      default:
        // Generic two-tone notification
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
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
