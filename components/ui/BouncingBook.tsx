"use client";

import { motion, useReducedMotion } from "motion/react";
import { BookOpen } from "lucide-react";

/** Libro que rebota mientras algo carga. */
export default function BouncingBook({ label = "Cargando…" }: { label?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div role="status" className="flex flex-col items-center gap-2 py-4">
      <motion.div
        className="flex size-16 items-center justify-center rounded-full border-2 border-rosa-fuerte bg-gradient-to-br from-rosa to-lila text-[#B0457A] shadow-[0_10px_24px_-10px_rgba(244,169,200,0.9)]"
        animate={reduceMotion ? undefined : { y: [0, -18, 0], rotate: [0, -6, 6, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      >
        <BookOpen size={32} strokeWidth={2.25} />
      </motion.div>
      <motion.span
        aria-hidden="true"
        className="h-2 w-12 rounded-full bg-lila-fuerte/50"
        animate={reduceMotion ? undefined : { scaleX: [1, 0.6, 1], opacity: [0.7, 0.35, 0.7] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="font-display text-sm font-semibold text-texto">{label}</span>
    </div>
  );
}
