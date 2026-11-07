"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  ArrowUpDown,
  BookPlus,
  CloudOff,
  Eraser,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Tags,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import BookCard from "@/components/BookCard";
import BookForm from "@/components/BookForm";
import Pagination from "@/components/Pagination";
import BouncingBook from "@/components/ui/BouncingBook";
import Button from "@/components/ui/Button";
import IconCircle from "@/components/ui/IconCircle";
import Modal from "@/components/ui/Modal";
import Toast, { useToast } from "@/components/ui/Toast";
import { NETWORK_ERROR, readError } from "@/lib/http";
import type { Author, Book, BookInput, BookSearchResponse, BookWithAuthor, PaginationInfo } from "@/lib/types";

const LIMIT = 12;
const DEBOUNCE_MS = 350;
const LOAD_ERROR = "No se pudieron cargar los libros.";

const SORTS = [
  { value: "recent", label: "Más recientes", sortBy: "createdAt", order: "desc" },
  { value: "title-asc", label: "Título A-Z", sortBy: "title", order: "asc" },
  { value: "title-desc", label: "Título Z-A", sortBy: "title", order: "desc" },
  { value: "year-desc", label: "Año (más nuevo)", sortBy: "publishedYear", order: "desc" },
  { value: "year-asc", label: "Año (más antiguo)", sortBy: "publishedYear", order: "asc" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

type Result = {
  /** Parámetros con los que se obtuvo este resultado; si no coinciden con los actuales, está cargando. */
  key: string;
  data?: BookWithAuthor[];
  pagination?: PaginationInfo;
  error?: string;
};

type FormState = { open: false } | { open: true; book: BookWithAuthor | null };

const selectClass = "field";

export default function BooksPage() {
  // Filtros
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [sort, setSort] = useState<SortValue>("recent");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  // Datos auxiliares
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [genresToken, setGenresToken] = useState(0);

  const [result, setResult] = useState<Result>({ key: "" });

  // Modales
  const [form, setForm] = useState<FormState>({ open: false });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<BookWithAuthor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { toast, showToast } = useToast();

  // Debounce de la búsqueda por título (vuelve a la página 1)
  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const t = setTimeout(() => {
      setSearch(next);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const authorName = authors.find((a) => a.id === authorId)?.name ?? "";
  const sortDef = SORTS.find((s) => s.value === sort) ?? SORTS[0];

  const paramsKey = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (genre) p.set("genre", genre);
    if (authorName) p.set("authorName", authorName);
    p.set("page", String(page));
    p.set("limit", String(LIMIT));
    p.set("sortBy", sortDef.sortBy);
    p.set("order", sortDef.order);
    return p.toString();
  }, [search, genre, authorName, page, sortDef]);

  // Lista de libros; AbortController cancela la petición anterior
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/books/search?${paramsKey}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res, LOAD_ERROR));
        return (await res.json()) as BookSearchResponse;
      })
      .then((body) => {
        // Si la página quedó vacía (por ejemplo, tras eliminar), salta a la última que exista
        const { page: current, totalPages } = body.pagination;
        if (body.data.length === 0 && current > 1 && totalPages > 0) {
          setPage(totalPages);
          return;
        }
        setResult({ key: paramsKey, data: body.data, pagination: body.pagination });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ key: paramsKey, error: err instanceof Error ? err.message : LOAD_ERROR });
      });
    return () => controller.abort();
  }, [paramsKey, reloadToken]);

  // Autores para el filtro y el formulario
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/authors", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Author[]>) : []))
      .then((data) => setAuthors(data))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Géneros distintos (se vuelven a pedir tras crear, editar o eliminar)
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/books", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Book[]>) : []))
      .then((books) => {
        const unique = [...new Set(books.map((b) => b.genre).filter((g): g is string => !!g))];
        setGenres(unique.sort((a, b) => a.localeCompare(b, "es")));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [genresToken]);

  const loading = result.key !== paramsKey;
  const books = loading ? [] : (result.data ?? []);
  const total = result.pagination?.total ?? 0;
  const hasFilters = !!(searchInput || genre || authorId || sort !== "recent");

  function refreshAll() {
    setReloadToken((t) => t + 1);
    setGenresToken((t) => t + 1);
  }

  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setGenre("");
    setAuthorId("");
    setSort("recent");
    setPage(1);
  }

  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retry() {
    setResult({ key: "" });
    setReloadToken((t) => t + 1);
  }

  async function handleSave(values: BookInput): Promise<string | null> {
    if (!form.open) return null;
    const editing = form.book;
    try {
      const res = await fetch(editing ? `/api/books/${editing.id}` : "/api/books", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) return await readError(res, "No se pudo guardar el libro.");
      setForm({ open: false });
      showToast(editing ? "Libro actualizado" : "Libro creado");
      refreshAll();
      return null;
    } catch {
      return NETWORK_ERROR;
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(await readError(res, "No se pudo eliminar el libro."));
        return;
      }
      // Se quita al instante (animación de salida) y luego se recarga en segundo plano
      setResult((r) => ({ ...r, data: r.data?.filter((b) => b.id !== id) }));
      setToDelete(null);
      showToast("Libro eliminado");
      refreshAll();
    } catch {
      setDeleteError(NETWORK_ERROR);
    } finally {
      setDeleting(false);
    }
  }

  const closeForm = useCallback(() => setForm({ open: false }), []);
  const closeDelete = useCallback(() => {
    setToDelete(null);
    setDeleteError(null);
  }, []);
  const openCreate = () => setForm({ open: true, book: null });

  return (
    <div className="mx-auto max-w-7xl">
      {/* Encabezado */}
      <header className="panel flex flex-wrap items-end justify-between gap-4 rounded-3xl p-6 sm:p-8">
        <div>
          <h1 className="font-display text-4xl font-semibold text-texto sm:text-5xl">Libros <span aria-hidden="true">📚</span></h1>
          <p className="mt-1 text-texto-suave">Historias para hojear, buscar y volver a descubrir.</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={openCreate}>
          Nuevo libro
        </Button>
      </header>

      {/* Búsqueda y filtros */}
      <section
        aria-label="Búsqueda y filtros"
        className="mt-8 rounded-3xl panel p-4 sm:p-5"
      >
        <label htmlFor="book-search" className="sr-only">
          Buscar por título
        </label>
        <div className="relative">
          <Search
            size={22}
            strokeWidth={2.5}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B0457A]"
          />
          <input
            id="book-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título…"
            className="field rounded-full py-3 pl-11 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-texto-suave hover:bg-lila/60 hover:text-texto"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <FilterSelect
            id="filter-genre"
            label="Género"
            icon={Tags}
            tone={0}
            value={genre}
            onChange={(v) => changeFilter(() => setGenre(v))}
          >
            <option value="">Todos</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="filter-author"
            label="Autor"
            icon={UserRound}
            tone={1}
            value={authorId}
            onChange={(v) => changeFilter(() => setAuthorId(v))}
          >
            <option value="">Todos</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            id="filter-sort"
            label="Ordenar por"
            icon={ArrowUpDown}
            tone={2}
            value={sort}
            onChange={(v) => changeFilter(() => setSort(v as SortValue))}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </FilterSelect>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              icon={<Eraser size={16} />}
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>

      {/* Total */}
      <p className="mt-6 min-h-6 font-display font-semibold text-texto" aria-live="polite">
        {!loading && !result.error && (total === 1 ? "1 libro encontrado" : `${total} libros encontrados`)}
      </p>

      {/* Resultados */}
      <section aria-label="Libros" className="mt-4">
        {loading ? (
          <>
            <BouncingBook label="Buscando libros…" />
            <div className="mt-4">
              <MasonrySkeleton />
            </div>
          </>
        ) : result.error ? (
          <EmptyState
            icon={<CloudOff size={36} strokeWidth={1.5} />}
            title="No pudimos cargar los libros"
            text={result.error}
            action={
              <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={retry}>
                Reintentar
              </Button>
            }
          />
        ) : books.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<SearchX size={36} strokeWidth={1.5} />}
              title="Ningún libro coincide"
              text="Prueba con otras palabras o quita algunos filtros."
              action={
                <Button variant="secondary" icon={<Eraser size={16} />} onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<BookPlus size={36} strokeWidth={1.5} />}
              title="La estantería está vacía"
              text="Aún no hay libros. ¿Agregamos el primero?"
              action={
                <Button icon={<Plus size={18} />} onClick={openCreate}>
                  Crear el primer libro
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
              <AnimatePresence>
                {books.map((book, i) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={i}
                    onEdit={(b) => setForm({ open: true, book: b })}
                    onDelete={(b) => setToDelete(b)}
                  />
                ))}
              </AnimatePresence>
            </div>
            {result.pagination && <Pagination pagination={result.pagination} onChange={goToPage} />}
          </>
        )}
      </section>

      {/* Crear / editar */}
      <Modal
        open={form.open}
        onClose={closeForm}
        locked={formSubmitting}
        title={form.open && form.book ? "Editar libro" : "Nuevo libro"}
        description={form.open && form.book ? "Actualiza los datos del libro." : "Suma una nueva historia a la estantería."}
      >
        {form.open && (
          <BookForm
            key={form.book?.id ?? "new"}
            book={form.book}
            authors={authors}
            genres={genres}
            onSubmit={handleSave}
            onCancel={closeForm}
            onSubmittingChange={setFormSubmitting}
          />
        )}
      </Modal>

      {/* Confirmar eliminación */}
      <Modal open={!!toDelete} onClose={closeDelete} locked={deleting} title="¿Eliminar libro?">
        {toDelete && (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-texto-suave">
              Se eliminará <strong className="font-semibold">“{toDelete.title}”</strong> de{" "}
              {toDelete.author.name}. Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <p role="alert" className="rounded-2xl border-2 border-coral bg-[#FFEDE6] px-3.5 py-2.5 text-sm font-medium text-texto">
                {deleteError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={closeDelete} disabled={deleting}>
                Cancelar
              </Button>
              <Button variant="danger" loading={deleting} icon={<Trash2 size={16} />} onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}

function FilterSelect({
  id,
  label,
  icon,
  tone,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: number;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-texto">
        <IconCircle icon={icon} tone={tone} size="sm" />
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
    </div>
  );
}

const SKELETON_RATIOS = ["aspect-[3/4]", "aspect-[2/3]", "aspect-[4/5]", "aspect-[2/3]", "aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-[3/4]"];

function MasonrySkeleton() {
  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4" aria-hidden="true">
      {SKELETON_RATIOS.map((ratio, i) => (
        <div
          key={i}
          className="mb-5 break-inside-avoid animate-pulse overflow-hidden rounded-3xl panel"
        >
          <div className={`${ratio} bg-lila/70`} />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 rounded bg-rosa" />
            <div className="h-3 w-1/2 rounded bg-lila/70" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 rounded-full bg-menta" />
              <div className="h-6 w-12 rounded-full bg-lila/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl panel px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border-2 border-lila-fuerte bg-gradient-to-br from-rosa to-lila text-[#7446C9]">
        {icon}
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold text-texto">{title}</h2>
      <p className="mt-2 text-sm text-texto-suave">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
