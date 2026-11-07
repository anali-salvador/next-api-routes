import type { ReactNode } from "react";

/** Estilo común de inputs, selects y textareas (definido en globals.css). */
export const inputClass = "field";

export function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-extrabold text-texto">
        {label}
        {required && <span className="text-acento"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-bold text-error-texto">{error}</p>}
    </div>
  );
}

/** Clases del aviso de error (fondo durazno suave, borde coral). */
export const alertClass =
  "rounded-2xl border-2 border-coral bg-[#FFEDE6] px-3.5 py-2.5 text-sm font-bold text-texto";

export function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className={alertClass}>
      {message}
    </div>
  );
}
