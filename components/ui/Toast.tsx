"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck } from "lucide-react";
import IconCircle from "@/components/ui/IconCircle";

export type ToastData = { id: number; message: string; kind: "success" | "error" };

/** Estado de un aviso breve que se oculta solo a los 3 s. */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, kind: ToastData["kind"] = "success") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, kind });
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { toast, showToast };
}

export default function Toast({ toast }: { toast: ToastData | null }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            className="panel flex items-center gap-2 rounded-full border-menta-fuerte px-4 py-2 font-display font-semibold text-texto shadow-[0_12px_30px_-12px_rgba(143,220,192,0.9)]"
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {toast.kind === "success" ? (
              <IconCircle icon={CircleCheck} tone={2} size="sm" />
            ) : (
              <IconCircle icon={CircleAlert} tone={3} size="sm" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
