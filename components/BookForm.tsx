"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { Field, FormAlert, inputClass } from "@/components/ui/FormField";
import type { Author, BookInput, BookWithAuthor } from "@/lib/types";

type BookFormProps = {
  book?: BookWithAuthor | null;
  authors: Pick<Author, "id" | "name">[];
  genres: string[];
  /** Devuelve un mensaje de error para mostrar, o null si todo salió bien. */
  onSubmit: (values: BookInput) => Promise<string | null>;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  /** Fija el autor: el selector se muestra con ese autor y bloqueado. */
  lockedAuthorId?: string;
};

type Errors = Partial<Record<"title" | "authorId" | "pages" | "publishedYear", string>>;

const CURRENT_YEAR = new Date().getFullYear();

/** Texto recortado, o null si queda vacío (el ISBN es único: nunca cadena vacía). */
const orNull = (value: string) => value.trim() || null;

export default function BookForm({
  book,
  authors,
  genres,
  onSubmit,
  onCancel,
  onSubmittingChange,
  lockedAuthorId,
}: BookFormProps) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const [publishedYear, setPublishedYear] = useState(book?.publishedYear?.toString() ?? "");
  const [genre, setGenre] = useState(book?.genre ?? "");
  const [pages, setPages] = useState(book?.pages?.toString() ?? "");
  const [selectedAuthorId, setAuthorId] = useState(book?.authorId ?? "");
  const authorId = lockedAuthorId ?? selectedAuthorId;
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (title.trim().length < 3) next.title = "El título debe tener al menos 3 caracteres.";
    if (!authorId) next.authorId = "Elige un autor.";
    if (pages.trim()) {
      const n = Number(pages);
      if (!Number.isInteger(n) || n < 1) next.pages = "Las páginas deben ser un número mayor a 0.";
    }
    if (publishedYear.trim()) {
      const y = Number(publishedYear);
      if (!Number.isInteger(y) || y < 1 || y > CURRENT_YEAR) {
        next.publishedYear = `Escribe un año entre 1 y ${CURRENT_YEAR}.`;
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
    const error = await onSubmit({
      title: title.trim(),
      description: orNull(description),
      isbn: orNull(isbn),
      publishedYear: publishedYear.trim() ? Number(publishedYear) : null,
      genre: orNull(genre),
      pages: pages.trim() ? Number(pages) : null,
      authorId,
    });
    setSubmitting(false);
    onSubmittingChange?.(false);
    if (error) setApiError(error);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {apiError && <FormAlert message={apiError} />}

      <Field label="Título" required error={errors.title} htmlFor="book-title">
        <input
          id="book-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cien años de soledad"
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field label="Autor" required error={errors.authorId} htmlFor="book-author">
        <select
          id="book-author"
          className={inputClass}
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          disabled={!!lockedAuthorId}
          aria-invalid={!!errors.authorId}
        >
          <option value="">Elige un autor…</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Género" htmlFor="book-genre">
          <input
            id="book-genre"
            className={inputClass}
            list="book-genre-options"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Novela"
          />
          <datalist id="book-genre-options">
            {genres.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="ISBN" htmlFor="book-isbn">
          <input
            id="book-isbn"
            className={inputClass}
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="9780307474728"
          />
        </Field>
        <Field label="Año de publicación" error={errors.publishedYear} htmlFor="book-year">
          <input
            id="book-year"
            type="number"
            inputMode="numeric"
            className={inputClass}
            value={publishedYear}
            onChange={(e) => setPublishedYear(e.target.value)}
            placeholder="1967"
            aria-invalid={!!errors.publishedYear}
          />
        </Field>
        <Field label="Páginas" error={errors.pages} htmlFor="book-pages">
          <input
            id="book-pages"
            type="number"
            inputMode="numeric"
            min={1}
            className={inputClass}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="417"
            aria-invalid={!!errors.pages}
          />
        </Field>
      </div>

      <Field label="Descripción" htmlFor="book-description">
        <textarea
          id="book-description"
          rows={3}
          className={`${inputClass} resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="De qué trata el libro…"
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting} icon={<Save size={16} />}>
          {book ? "Guardar cambios" : "Crear libro"}
        </Button>
      </div>
    </form>
  );
}
