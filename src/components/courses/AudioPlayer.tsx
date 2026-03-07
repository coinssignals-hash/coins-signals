import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  subtitle?: string;
  onEnded?: () => void;
}

export function AudioPlayer({ src, title, subtitle, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const demoMode = !src;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => { setDuration(audio.duration); setIsLoaded(true); };
    const onEnded_ = () => { setIsPlaying(false); onEnded?.(); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded_);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded_);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || demoMode) return;
    if (isPlaying) audio.pause(); else audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (v: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = v[0];
    setCurrentTime(v[0]);
  };

  const handleVolume = (v: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = v[0];
    setVolume(v[0]);
    setIsMuted(v[0] === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (s: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + s, 0), duration);
  };

  const toggleLoop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/40"
      style={{ background: 'radial-gradient(ellipse at center 30%, hsl(270, 60%, 12%) 0%, hsl(260, 50%, 6%) 70%, hsl(250, 45%, 4%) 100%)' }}
    >
      {!demoMode && <audio ref={audioRef} src={src} preload="metadata" />}

      <div className="p-6 space-y-5">
        {/* Visualizer / Art */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              className="w-28 h-28 rounded-full border-2 border-purple-500/30 flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, hsl(270, 50%, 20%) 0%, hsl(260, 50%, 10%) 100%)' }}
              animate={isPlaying ? { scale: [1, 1.05, 1], boxShadow: ['0 0 20px hsl(270 60% 40%/0.2)', '0 0 40px hsl(270 60% 40%/0.4)', '0 0 20px hsl(270 60% 40%/0.2)'] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Spinning disc effect */}
              <motion.div
                className="w-20 h-20 rounded-full border border-purple-500/20"
                style={{ background: 'conic-gradient(from 0deg, hsl(270, 40%, 15%), hsl(270, 40%, 25%), hsl(270, 40%, 15%))' }}
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-purple-400/60" />
                </div>
              </motion.div>
            </motion.div>

            {/* Pulse rings */}
            {isPlaying && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border border-purple-500/20"
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-purple-500/10"
                  animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title || 'Podcast'}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {demoMode && <p className="text-xs text-purple-400/60">Audio disponible próximamente</p>}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
            disabled={demoMode}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={toggleLoop} className={cn('p-2 rounded-full transition-colors', isLooping ? 'text-purple-400' : 'text-muted-foreground hover:text-foreground')}>
            <Repeat className="w-4 h-4" />
          </button>
          <button onClick={() => skip(-15)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            disabled={demoMode}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all',
              demoMode
                ? 'bg-purple-500/20 text-purple-400/40'
                : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white hover:scale-105 shadow-[0_0_24px_hsl(270_60%_50%/0.4)]'
            )}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button onClick={() => skip(15)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
          <button onClick={toggleMute} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-3">
          <VolumeX className="w-3 h-3 text-muted-foreground" />
          <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.05} onValueChange={handleVolume} className="w-32" />
          <Volume2 className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
