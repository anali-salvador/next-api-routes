"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { LoaderCircle } from "lucide-react";

export type Variant = "primary" | "secondary" | "danger";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
};

// Todos con texto #4B3B5C (contraste ≥ 7:1 sobre su fondo)
const VARIANTS: Record<Variant, string> = {
  primary:
    "border-2 border-[#E98DB9] bg-gradient-to-r from-rosa to-lila shadow-[0_10px_22px_-12px_rgba(233,141,185,0.95)] hover:from-[#FFC8E0] hover:to-[#DACAFF]",
  secondary:
    "border-2 border-menta-fuerte bg-menta shadow-[0_10px_22px_-12px_rgba(143,220,192,0.95)] hover:bg-[#BDEFDC]",
  danger:
    "border-2 border-coral bg-[#FFDCCF] shadow-[0_10px_22px_-12px_rgba(242,160,138,0.95)] hover:bg-[#FFCDBB]",
};

const BASE =
  "group inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 font-display text-[0.95rem] font-semibold text-texto transition-[background-color,border-color,box-shadow] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-lila-foco disabled:cursor-not-allowed disabled:opacity-55";

/** Burbuja del ícono (22 px) para botones y enlaces con forma de botón. */
export function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span className="btn-icon" aria-hidden="true">
      {children}
    </span>
  );
}

/** Clases de botón para un Link: con rebote al pasar el mouse y al hacer click. */
export function buttonClasses(variant: Variant = "primary", className = "") {
  return `${BASE} ${VARIANTS[variant]} transition-transform duration-200 hover:scale-105 active:scale-95 ${className}`;
}

export default function Button({
  variant = "primary",
  icon,
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;
  const animated = !isDisabled && !reduceMotion;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileHover={animated ? { scale: 1.06, y: -2 } : undefined}
      whileTap={animated ? { scale: 0.92 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 14 }}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <IconBubble>
          <LoaderCircle className="animate-spin" />
        </IconBubble>
      ) : (
        icon && <IconBubble>{icon}</IconBubble>
      )}
      {children}
    </motion.button>
  );
}
