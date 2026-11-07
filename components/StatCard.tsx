"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import IconCircle from "@/components/ui/IconCircle";
import { toneAt } from "@/lib/tones";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  /** Un número se anima contando desde 0; un texto se muestra tal cual. */
  value: number | string;
  hint?: string;
  /** Posición: define el retraso de entrada y el color pastel de la tarjeta. */
  index?: number;
};

function CountUp({ to }: { to: number }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, to, {
      duration: reduceMotion ? 0 : 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, reduceMotion]);

  return <>{display.toLocaleString("es")}</>;
}

export default function StatCard({ icon, label, value, hint, index = 0 }: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const tone = toneAt(index);

  return (
    <motion.div
      className={`panel flex items-center gap-4 rounded-3xl p-5 ${tone.card}`}
      initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={reduceMotion ? undefined : { y: -4, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: index * 0.07 }}
    >
      <IconCircle icon={icon} tone={tone} size="lg" />
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-wide text-texto-suave">{label}</p>
        <p className="truncate font-display text-2xl font-semibold text-texto" title={String(value)}>
          {typeof value === "number" ? <CountUp to={value} /> : value}
        </p>
        {hint && <p className="truncate text-sm font-semibold text-texto-suave">{hint}</p>}
      </div>
    </motion.div>
  );
}
