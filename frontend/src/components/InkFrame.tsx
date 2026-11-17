import React, { useEffect, useMemo, useRef, useState } from 'react';

interface InkFrameProps {
  seed?: number;
  strokeWidth?: number;
  doublePass?: boolean;
  className?: string;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHandDrawnRectPath(
  w: number,
  h: number,
  inset: number,
  seed: number,
  wobble: number
): string {
  if (w < 8 || h < 8) return '';
  const rand = mulberry32(seed);
  const j = (scale = 1) => (rand() - 0.5) * wobble * scale;

  const x0 = inset + j(0.7);
  const y0 = inset + j(0.7);
  const x1 = w - inset + j(0.7);
  const y1 = h - inset + j(0.7);
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;

  return [
    `M ${x0.toFixed(1)} ${y0.toFixed(1)}`,
    `Q ${mx.toFixed(1)} ${(y0 + j(1.4)).toFixed(1)} ${x1.toFixed(1)} ${(y0 + j(0.8)).toFixed(1)}`,
    `Q ${(x1 + j(1.4)).toFixed(1)} ${my.toFixed(1)} ${(x1 + j(0.8)).toFixed(1)} ${y1.toFixed(1)}`,
    `Q ${mx.toFixed(1)} ${(y1 + j(1.4)).toFixed(1)} ${(x0 + j(0.8)).toFixed(1)} ${(y1 + j(0.8)).toFixed(1)}`,
    `Q ${(x0 + j(1.4)).toFixed(1)} ${my.toFixed(1)} ${x0.toFixed(1)} ${y0.toFixed(1)}`,
    'Z',
  ].join(' ');
}

/**
 * Draws a seeded hand-drawn <svg data-ink> pen outline behind any container,
 * matching Looseleaf's signature paper-and-ink aesthetic.
 */
export const InkFrame: React.FC<InkFrameProps> = ({
  seed = 17,
  strokeWidth = 1.75,
  doublePass = false,
  className = '',
}) => {
  const hostRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const parent = hostRef.current?.parentElement;
    if (!parent) return;

    const update = () => {
      const rect = parent.getBoundingClientRect();
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const paths = useMemo(() => {
    const primary = buildHandDrawnRectPath(size.w, size.h, 2, seed, 2.2);
    const secondary = doublePass ? buildHandDrawnRectPath(size.w, size.h, 2.6, seed + 97, 2.6) : '';
    return { primary, secondary };
  }, [size.w, size.h, seed, doublePass]);

  return (
    <svg
      ref={hostRef}
      data-ink="frame"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full overflow-visible ${className}`}
      viewBox={`0 0 ${Math.max(1, size.w)} ${Math.max(1, size.h)}`}
      preserveAspectRatio="none"
    >
      {paths.primary && (
        <path
          d={paths.primary}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {paths.secondary && (
        <path
          d={paths.secondary}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
