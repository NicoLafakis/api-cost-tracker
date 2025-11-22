import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    rotation: number;
  }>>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-3 h-3"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confetti 3s ease-out ${particle.delay}s forwards`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0'
          }}
        />
      ))}
    </div>
  );
}
