'use client';

import { useEffect, useState } from 'react';

export interface RingFractions {
  calories: number; // 0-1
  protein: number;
  carbs: number;
  fat: number;
}

const RINGS = [
  { r: 66, sw: 12, track: 'var(--av-green-track)', color: 'url(#avoRingGreen)' },
  { r: 51, sw: 10, track: 'var(--av-protein-tint)', color: 'var(--av-protein)' },
  { r: 38, sw: 10, track: 'var(--av-carbs-tint)', color: 'var(--av-carbs)' },
  { r: 25, sw: 10, track: 'var(--av-fat-tint)', color: 'var(--av-fat)' },
] as const;

export function CalorieRing({ size = 156, fractions }: { size?: number; fractions: RingFractions }) {
  const [animateIn, setAnimateIn] = useState(false);
  const values = [fractions.calories, fractions.protein, fractions.carbs, fractions.fat];

  useEffect(() => {
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimateIn(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 156;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="avoRingGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--av-green-grad-1)" />
          <stop offset="1" stopColor="var(--av-green-grad-2)" />
        </linearGradient>
      </defs>
      {RINGS.map((ring, i) => {
        const r = ring.r * scale;
        const circ = 2 * Math.PI * r;
        const frac = animateIn ? Math.max(0, Math.min(1, values[i])) : 0;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring.track} strokeWidth={ring.sw} />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.sw}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - frac)}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                transition: `stroke-dashoffset 1.1s cubic-bezier(.34,1.2,.44,1) ${i * 0.12}s`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
