import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

export function ConfettiEffect({ 
  trigger, 
  duration = 3000, 
  particleCount = 50,
  colors = ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#facc15']
}: ConfettiEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20, // Start near center
        y: 30 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 8,
        speedY: -2 - Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        opacity: 1,
      });
    }
    return newParticles;
  }, [particleCount, colors]);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      setParticles(createParticles());

      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, isActive, duration, createParticles]);

  useEffect(() => {
    if (!isActive || particles.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setParticles(prevParticles => 
        prevParticles
          .map(p => ({
            ...p,
            x: p.x + p.speedX * 0.1,
            y: p.y + p.speedY * 0.1,
            speedY: p.speedY + 0.15, // gravity
            rotation: p.rotation + p.rotationSpeed,
            opacity: p.opacity - 0.008,
          }))
          .filter(p => p.opacity > 0 && p.y < 120)
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, particles]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            boxShadow: `0 0 ${particle.size}px ${particle.color}40`,
          }}
        />
      ))}
    </div>
  );
}

// Sparkle effect for subtle celebration
export function SparkleEffect({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 200}ms`,
            animationDuration: '1.5s',
          }}
        />
      ))}
    </div>
  );
}
