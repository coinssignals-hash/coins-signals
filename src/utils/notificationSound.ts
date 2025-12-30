// Notification sound utility using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

export const playNotificationSound = (type: 'signal' | 'alert' = 'signal') => {
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

    if (type === 'signal') {
      // Pleasant two-tone notification for new signals
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else {
      // Alert sound for critical indicators
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
      oscillator.frequency.setValueAtTime(587.33, ctx.currentTime + 0.2); // D5
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
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
