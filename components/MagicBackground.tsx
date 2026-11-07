"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Book,
  BookMarked,
  BookOpen,
  Bookmark,
  Cloud,
  Heart,
  Library,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

type Floater = { Icon: LucideIcon; filled: boolean; twinkle: boolean };

const KINDS: Floater[] = [
  { Icon: Star, filled: true, twinkle: true },
  { Icon: Heart, filled: true, twinkle: false },
  { Icon: Cloud, filled: true, twinkle: false },
  { Icon: Sparkles, filled: false, twinkle: true },
  { Icon: BookOpen, filled: false, twinkle: false },
  { Icon: Book, filled: false, twinkle: false },
  { Icon: BookMarked, filled: false, twinkle: false },
  { Icon: Library, filled: false, twinkle: false },
  { Icon: Bookmark, filled: false, twinkle: false },
];

// Trazo en tono fuerte y relleno en el pastel correspondiente
const COLORS = [
  { stroke: "#F4A9C8", fill: "#FFD6E8" },
  { stroke: "#C9A7FF", fill: "#E4D4FF" },
  { stroke: "#8FDCC0", fill: "#CFF5E7" },
  { stroke: "#FFB98F", fill: "#FFE3CF" },
  { stroke: "#F2D675", fill: "#FFF3C4" },
  { stroke: "#A9D8F5", fill: "#DDF1FF" },
];

// Generador pseudoaleatorio con semilla: mismos valores en servidor y cliente (sin errores de hidratación).
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seeded(7);
const between = (min: number, max: number) => min + rand() * (max - min);

// 18 elementos en una rejilla 6 × 3 con desplazamiento aleatorio
const FLOATERS = Array.from({ length: 18 }, (_, i) => ({
  ...KINDS[i % KINDS.length],
  color: COLORS[(i * 5) % COLORS.length],
  left: (i % 6) * 16.5 + between(1, 11),
  top: Math.floor(i / 6) * 31 + between(4, 22),
  size: Math.round(between(28, 64)),
  opacity: between(0.5, 0.8),
  rise: between(18, 40),
  sway: between(6, 14),
  duration: between(9, 16),
  delay: between(0, 6),
}));

const BUBBLES = Array.from({ length: 12 }, () => ({
  left: between(2, 96),
  top: between(30, 95),
  size: Math.round(between(14, 56)),
  duration: between(14, 26),
  delay: between(0, 12),
}));

export default function MagicBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="kawaii-bg pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Brillos suaves para dar profundidad */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.65), transparent 40%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.5), transparent 45%)",
        }}
      />

      {/* Estrellitas, corazones, nubes, destellos y libros */}
      {FLOATERS.map(({ Icon, filled, twinkle, color, left, top, size, opacity, rise, sway, duration, delay }, i) => (
        <motion.div
          key={`floater-${i}`}
          className="absolute"
          style={{ left: `${left}%`, top: `${top}%`, opacity }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -rise, 0],
                  rotate: [-sway, sway, -sway],
                  ...(twinkle ? { scale: [1, 1.18, 0.92, 1], opacity: [opacity, opacity * 0.55, opacity] } : {}),
                }
          }
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon
            size={size}
            strokeWidth={2}
            color={color.stroke}
            fill={filled ? color.fill : "none"}
          />
        </motion.div>
      ))}

      {/* Burbujas translúcidas que suben */}
      {BUBBLES.map(({ left, top, size, duration, delay }, i) => (
        <motion.span
          key={`bubble-${i}`}
          className="absolute rounded-full border-[1.5px] border-white/80"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 45%, rgba(228,212,255,0.2) 100%)",
            opacity: 0.7,
          }}
          animate={
            reduceMotion ? undefined : { y: [0, -260], x: [0, 14, -10, 0], opacity: [0, 0.8, 0.8, 0] }
          }
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
