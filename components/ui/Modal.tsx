"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Evita cerrar mientras se envía algo. */
  locked?: boolean;
};

export default function Modal({ open, onClose, title, description, children, locked = false }: ModalProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape para cerrar, bloquear el scroll y enfocar el primer campo
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([data-modal-close])"
    );
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, locked, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          {/* Fondo: click fuera para cerrar */}
          <div
            className="absolute inset-0 bg-[rgba(75,59,92,0.25)] backdrop-blur-sm"
            onClick={() => !locked && onClose()}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl panel p-6 border-rosa-fuerte shadow-[0_24px_60px_-20px_rgba(169,133,245,0.7)] sm:p-8"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <button
              type="button"
              data-modal-close
              onClick={onClose}
              disabled={locked}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-1.5 text-texto-suave transition-colors hover:bg-lila/60 hover:text-texto disabled:opacity-40"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
            <h2 id={titleId} className="pr-8 font-display text-2xl font-semibold text-texto">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-texto-suave">{description}</p>}
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
