"use client";

import { useState, type FormEvent } from "react";
import { CircleAlert, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/FormField";
import type { Author, AuthorInput } from "@/lib/types";

type AuthorFormProps = {
  author?: Author | null;
  /** Devuelve un mensaje de error para mostrar, o null si todo salió bien. */
  onSubmit: (values: AuthorInput) => Promise<string | null>;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  /** "stacked" para modales; "wide" aprovecha el ancho dentro de una Card. */
  layout?: "stacked" | "wide";
};

type Errors = Partial<Record<"name" | "email" | "birthYear", string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENT_YEAR = new Date().getFullYear();

export default function AuthorForm({
  author,
  onSubmit,
  onCancel,
  onSubmittingChange,
  layout = "stacked",
}: AuthorFormProps) {
  const wide = layout === "wide";
  const [name, setName] = useState(author?.name ?? "");
  const [email, setEmail] = useState(author?.email ?? "");
  const [nationality, setNationality] = useState(author?.nationality ?? "");
  const [birthYear, setBirthYear] = useState(author?.birthYear?.toString() ?? "");
  const [bio, setBio] = useState(author?.bio ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (!name.trim()) next.name = "El nombre es obligatorio.";
    if (!email.trim()) next.email = "El email es obligatorio.";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "Escribe un email válido.";
    if (birthYear.trim()) {
      const year = Number(birthYear);
      if (!Number.isInteger(year) || year < 1 || year > CURRENT_YEAR) {
        next.birthYear = `Escribe un año entre 1 y ${CURRENT_YEAR}.`;
      }
    }
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setApiError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    onSubmittingChange?.(true);
    // Siempre se envían todos los campos (el PUT pone birthYear en null si no llega)
    const error = await onSubmit({
      name: name.trim(),
      email: email.trim(),
      nationality: nationality.trim() || null,
      birthYear: birthYear.trim() ? Number(birthYear) : null,
      bio: bio.trim() || null,
    });
    setSubmitting(false);
    onSubmittingChange?.(false);
    if (error) setApiError(error);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border-2 border-coral bg-[#FFEDE6] px-3.5 py-2.5 text-sm font-medium text-texto"
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-error-texto" />
          {apiError}
        </div>
      )}

      <div className={wide ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
      <Field label="Nombre" required error={errors.name} htmlFor="author-name">
        <input
          id="author-name"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gabriel García Márquez"
          aria-invalid={!!errors.name}
        />
      </Field>

      <Field label="Email" required error={errors.email} htmlFor="author-email">
        <input
          id="author-email"
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="autor@correo.com"
          aria-invalid={!!errors.email}
        />
      </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nacionalidad" htmlFor="author-nationality">
          <input
            id="author-nationality"
            className={inputClass}
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Colombiana"
          />
        </Field>
        <Field label="Año de nacimiento" error={errors.birthYear} htmlFor="author-birthyear">
          <input
            id="author-birthyear"
            type="number"
            inputMode="numeric"
            className={inputClass}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="1927"
            aria-invalid={!!errors.birthYear}
          />
        </Field>
      </div>

      <Field label="Biografía" htmlFor="author-bio">
        <textarea
          id="author-bio"
          rows={wide ? 5 : 4}
          className={`${inputClass} resize-y`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Unas líneas sobre su vida y su obra…"
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting} icon={<Save size={16} />}>
          {author ? "Guardar cambios" : "Crear autor"}
        </Button>
      </div>
    </form>
  );
}
