'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#D33A24', '#274690', '#FFC61A', '#1F7A3D', '#16150F', '#E25640'];

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  duration: number;
}

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Génère les particules quand l'animation s'active (effet de bord visuel).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!active) { setParticles([]); return; }

    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 300,
      size: 4 + Math.random() * 4,
      duration: 600 + Math.random() * 400,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 1200);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '40%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.id % 3 === 0 ? '50%' : '1px',
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}ms ease-in ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
