import type { LucideIcon } from "lucide-react";
import { toneAt, type Tone } from "@/lib/tones";

type IconCircleProps = {
  icon: LucideIcon;
  /** Tono pastel (o índice de tono). */
  tone?: Tone | number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: { box: "size-8", icon: 18 },
  md: { box: "size-10", icon: 22 },
  lg: { box: "size-14", icon: 28 },
  xl: { box: "size-20", icon: 40 },
};

/** Ícono dentro de un círculo pastel con borde. */
export default function IconCircle({ icon: Icon, tone = 0, size = "md", className = "" }: IconCircleProps) {
  const t = typeof tone === "number" ? toneAt(tone) : tone;
  const s = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 ${t.soft} ${t.icon} ${s.box} ${className}`}
    >
      <Icon size={s.icon} strokeWidth={2.25} />
    </span>
  );
}
