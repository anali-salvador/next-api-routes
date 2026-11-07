"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  BookPlus,
  Bookmark,
  Cake,
  Calculator,
  ChevronRight,
  CloudOff,
  History,
  Mail,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Tags,
  Trash2,
  UserRoundX,
  X,
} from "lucide-react";
import AuthorForm from "@/components/AuthorForm";
import BookCard from "@/components/BookCard";
import BookForm from "@/components/BookForm";
import StatCard from "@/components/StatCard";
import BouncingBook from "@/components/ui/BouncingBook";
import Button, { IconBubble, buttonClasses } from "@/components/ui/Button";
import IconCircle from "@/components/ui/IconCircle";
import { toneAt } from "@/lib/tones";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Toast, { useToast } from "@/components/ui/Toast";
import { booksLabel, initials } from "@/lib/format";
import { NETWORK_ERROR, readError } from "@/lib/http";
import type { Author, AuthorInput, AuthorStats, Book, BookInput, BookWithAuthor } from "@/lib/types";

const LOAD_ERROR = "No se pudo cargar la información del autor.";

type Loaded =
  | { id: string; status: "ready"; author: Author; stats: AuthorStats }
  | { id: string; status: "notfound" }
  | { id: string; status: "error"; error: string };

type BookFormState = { open: false } | { open: true; book: BookWithAuthor | null };

const glass =
  "rounded-3xl panel";

export default function AuthorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const reduceMotion = useReducedMotion();

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [editing, setEditing] = useState(false);
  const [bookForm, setBookForm] = useState<BookFormState>({ open: false });
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<BookWithAuthor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { toast, showToast } = useToast();

  // Autor y estadísticas; se vuelven a pedir tras cada cambio (reloadToken)
  useEffect(() => {
    const controller = new AbortController();
    const opts = { cache: "no-store" as const, signal: controller.signal };
    Promise.all([fetch(`/api/authors/${id}`, opts), fetch(`/api/authors/${id}/stats`, opts)])
      .then(async ([authorRes, statsRes]): Promise<Loaded> => {
        if (authorRes.status === 404) return { id, status: "notfound" };
        if (!authorRes.ok) throw new Error(await readError(authorRes, LOAD_ERROR));
        if (!statsRes.ok) throw new Error(await readError(statsRes, LOAD_ERROR));
        const [author, stats] = await Promise.all([authorRes.json(), statsRes.json()]);
        return { id, status: "ready", author, stats };
      })
      .then(setLoaded)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoaded({ id, status: "error", error: err instanceof Error ? err.message : LOAD_ERROR });
      });
    return () => controller.abort();
  }, [id, reloadToken]);

  const refresh = () => setReloadToken((t) => t + 1);

  function retry() {
    setLoaded(null);
    refresh();
  }

  const closeBookForm = useCallback(() => setBookForm({ open: false }), []);
  const closeDelete = useCallback(() => {
    setToDelete(null);
    setDeleteError(null);
  }, []);

  if (!loaded || loaded.id !== id) return <AuthorDetailSkeleton />;

  if (loaded.status === "notfound") {
    return (
      <Message
        icon={<UserRoundX size={36} strokeWidth={1.5} />}
        title="Autor no encontrado"
        text="Puede que haya sido eliminado o que el enlace no sea correcto."
        action={
          <Link href="/" className={buttonClasses("secondary")}>
            <IconBubble>
              <ArrowLeft />
            </IconBubble>
            Volver a autores
          </Link>
        }
      />
    );
  }

  if (loaded.status === "error") {
    return (
      <Message
        icon={<CloudOff size={36} strokeWidth={1.5} />}
        title="Algo salió mal"
        text={loaded.error}
        action={
          <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={retry}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const { author, stats } = loaded;
  const books: BookWithAuthor[] = author.books.map((b: Book) => ({
    ...b,
    author: { id: author.id, name: author.name, email: author.email },
  }));

  async function saveAuthor(values: AuthorInput): Promise<string | null> {
    try {
      // Siempre se envían los 5 campos (el PUT pone birthYear en null si no llega)
      const res = await fetch(`/api/authors/${author.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) return await readError(res, "No se pudo guardar el autor.");
      setEditing(false);
      showToast("Información actualizada");
      refresh();
      return null;
    } catch {
      return NETWORK_ERROR;
    }
  }

  async function saveBook(values: BookInput): Promise<string | null> {
    if (!bookForm.open) return null;
    const current = bookForm.book;
    try {
      const res = await fetch(current ? `/api/books/${current.id}` : "/api/books", {
        method: current ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, authorId: author.id }),
      });
      if (!res.ok) return await readError(res, "No se pudo guardar el libro.");
      setBookForm({ open: false });
      showToast(current ? "Libro actualizado" : "Libro agregado");
      refresh();
      return null;
    } catch {
      return NETWORK_ERROR;
    }
  }

  async function deleteBook() {
    if (!toDelete) return;
    const bookId = toDelete.id;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(await readError(res, "No se pudo eliminar el libro."));
        return;
      }
      // Se quita al instante (animación de salida) y se recargan datos y estadísticas
      setLoaded((l) =>
        l && l.status === "ready"
          ? {
              ...l,
              author: {
                ...l.author,
                books: l.author.books.filter((b) => b.id !== bookId),
                _count: { books: Math.max(0, l.author._count.books - 1) },
              },
            }
          : l
      );
      setToDelete(null);
      showToast("Libro eliminado");
      refresh();
    } catch {
      setDeleteError(NETWORK_ERROR);
    } finally {
      setDeleting(false);
    }
  }

  const openNewBook = () => setBookForm({ open: true, book: null });
  const dash = "—";

  return (
    <div className="mx-auto max-w-7xl">
      {/* Migas de pan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Migas de pan" className="flex min-w-0 items-center gap-1.5 font-display font-semibold text-texto">
          <Link href="/" className="rounded font-medium text-acento hover:underline">
            Autores
          </Link>
          <ChevronRight size={18} strokeWidth={2.5} className="shrink-0 text-texto" />
          <span aria-current="page" className="truncate">
            {author.name}
          </span>
        </nav>
        <Link href="/" className={buttonClasses("secondary", "px-4 py-2")}>
          <IconBubble>
            <ArrowLeft />
          </IconBubble>
          Volver
        </Link>
      </div>

      {/* Panel del autor */}
      <motion.section
        className={`${glass} mt-5 p-6 sm:p-8`}
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div
            aria-hidden="true"
            className="flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-rosa via-lila to-menta font-display text-3xl font-semibold text-texto ring-2 ring-lila-fuerte shadow-[0_12px_30px_-12px_rgba(201,167,255,0.9)] sm:size-28 sm:text-4xl"
          >
            {initials(author.name)}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold leading-tight text-texto sm:text-4xl">
              {author.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-texto-suave">
              {author.nationality && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} /> {author.nationality}
                </span>
              )}
              {author.birthYear && (
                <span className="flex items-center gap-1.5">
                  <Cake size={15} /> Nació en {author.birthYear}
                </span>
              )}
              <a href={`mailto:${author.email}`} className="flex min-w-0 items-center gap-1.5 hover:underline">
                <Mail size={15} className="shrink-0" /> <span className="truncate">{author.email}</span>
              </a>
              <span className="flex items-center gap-1.5 font-medium text-acento">
                <BookOpen size={15} /> {booksLabel(author._count.books)}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-line leading-7 text-texto-suave">
              {author.bio || <span className="italic text-texto-suave">Sin biografía todavía.</span>}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
            <Button
              variant="secondary"
              icon={editing ? <X size={16} /> : <Pencil size={16} />}
              onClick={() => setEditing((v) => !v)}
              aria-expanded={editing}
              aria-controls="author-edit-panel"
            >
              {editing ? "Cerrar edición" : "Editar información"}
            </Button>
            <Button icon={<Plus size={18} />} onClick={openNewBook}>
              Agregar libro
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Edición en línea */}
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            id="author-edit-panel"
            key="edit"
            className="overflow-hidden"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <div className="pt-5">
              <Card lift={false} className="sm:p-8">
                <h2 className="mb-4 font-display text-2xl font-semibold text-texto">Editar información</h2>
                <AuthorForm
                  key={author.updatedAt}
                  author={author}
                  layout="wide"
                  onSubmit={saveAuthor}
                  onCancel={() => setEditing(false)}
                />
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estadísticas */}
      <section aria-label="Estadísticas del autor" className="mt-8">
        <h2 className="font-display text-2xl font-semibold text-texto">Estadísticas</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="Total de libros" value={stats.totalBooks} index={0} />
          <StatCard
            icon={Calculator}
            label="Promedio de páginas"
            value={stats.averagePages ?? dash}
            hint={stats.averagePages !== null ? "páginas por libro" : undefined}
            index={1}
          />
          <StatCard
            icon={History}
            label="Primer libro"
            value={stats.firstBook?.title ?? dash}
            hint={stats.firstBook ? String(stats.firstBook.year) : undefined}
            index={2}
          />
          <StatCard
            icon={Sparkles}
            label="Último libro"
            value={stats.latestBook?.title ?? dash}
            hint={stats.latestBook ? String(stats.latestBook.year) : undefined}
            index={3}
          />
          <StatCard
            icon={BookMarked}
            label="Más páginas"
            value={stats.longestBook?.title ?? dash}
            hint={stats.longestBook ? `${stats.longestBook.pages} páginas` : undefined}
            index={4}
          />
          <StatCard
            icon={Bookmark}
            label="Menos páginas"
            value={stats.shortestBook?.title ?? dash}
            hint={stats.shortestBook ? `${stats.shortestBook.pages} páginas` : undefined}
            index={5}
          />
          <GenresCard genres={stats.genres} index={6} />
        </div>
      </section>

      {/* Libros */}
      <section aria-label={`Libros de ${author.name}`} className="mt-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold text-texto sm:text-3xl">Libros de {author.name}</h2>
          <span className="chip text-sm">
            {author.books.length}
          </span>
        </div>

        {books.length === 0 ? (
          <Card lift={false} className="mx-auto mt-6 flex max-w-md flex-col items-center px-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-lila-fuerte bg-gradient-to-br from-rosa to-lila text-[#7446C9]">
              <BookPlus size={34} strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-texto">Aún no hay libros</h3>
            <p className="mt-2 text-sm text-texto-suave">
              La obra de {author.name} espera su primera página en esta biblioteca.
            </p>
            <Button className="mt-6" icon={<Plus size={18} />} onClick={openNewBook}>
              Agregar primer libro
            </Button>
          </Card>
        ) : (
          <div className="mt-5 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            <AnimatePresence>
              {books.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  onEdit={(b) => setBookForm({ open: true, book: b })}
                  onDelete={(b) => setToDelete(b)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Crear / editar libro */}
      <Modal
        open={bookForm.open}
        onClose={closeBookForm}
        locked={bookSubmitting}
        title={bookForm.open && bookForm.book ? "Editar libro" : "Agregar libro"}
        description={`Libro de ${author.name}.`}
      >
        {bookForm.open && (
          <BookForm
            key={bookForm.book?.id ?? "new"}
            book={bookForm.book}
            authors={[{ id: author.id, name: author.name }]}
            genres={stats.genres}
            lockedAuthorId={author.id}
            onSubmit={saveBook}
            onCancel={closeBookForm}
            onSubmittingChange={setBookSubmitting}
          />
        )}
      </Modal>

      {/* Confirmar eliminación */}
      <Modal open={!!toDelete} onClose={closeDelete} locked={deleting} title="¿Eliminar libro?">
        {toDelete && (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-texto-suave">
              Se eliminará <strong className="font-semibold">“{toDelete.title}”</strong>. Esta acción no se puede
              deshacer.
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
              <Button variant="danger" loading={deleting} icon={<Trash2 size={16} />} onClick={deleteBook}>
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

function GenresCard({ genres, index }: { genres: string[]; index: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={`panel rounded-3xl p-5 sm:col-span-2 ${toneAt(index).card}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div className="flex items-center gap-3">
        <IconCircle icon={Tags} tone={index} size="lg" />
        <p className="text-xs font-extrabold uppercase tracking-wide text-texto-suave">Géneros</p>
      </div>
      {genres.length === 0 ? (
        <p className="mt-3 font-display text-2xl font-semibold text-texto">—</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {genres.map((g, i) => (
            <motion.li
              key={g}
              className={`chip text-sm ${toneAt(i).soft}`}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.08 + i * 0.05 }}
            >
              {g}
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function Message({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <div className={`${glass} mx-auto mt-10 flex max-w-md flex-col items-center px-6 py-12 text-center`}>
      <div className="flex size-16 items-center justify-center rounded-full border-2 border-lila-fuerte bg-gradient-to-br from-rosa to-lila text-[#7446C9]">
        {icon}
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold text-texto">{title}</h1>
      <p className="mt-2 text-sm text-texto-suave">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

const pulse = "animate-pulse rounded bg-lila/70";

export function AuthorDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl" aria-busy="true" aria-label="Cargando autor">
      <BouncingBook label="Cargando autor…" />
      <div className="flex items-center justify-between">
        <div className={`${pulse} h-4 w-48`} />
        <div className={`${pulse} h-9 w-24 rounded-full`} />
      </div>
      <div className={`${glass} mt-5 flex flex-col gap-6 p-6 sm:p-8 md:flex-row`}>
        <div className="size-24 shrink-0 animate-pulse rounded-full bg-rosa sm:size-28" />
        <div className="flex-1 space-y-3">
          <div className={`${pulse} h-8 w-2/3`} />
          <div className={`${pulse} h-4 w-1/2`} />
          <div className={`${pulse} h-3 w-full`} />
          <div className={`${pulse} h-3 w-full`} />
          <div className={`${pulse} h-3 w-3/4`} />
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 rounded-3xl panel p-5">
            <div className="size-11 rounded-xl bg-rosa" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-rosa" />
              <div className="h-6 w-14 rounded bg-lila/70" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {["aspect-[3/4]", "aspect-[2/3]", "aspect-[4/5]", "aspect-[2/3]"].map((ratio, i) => (
          <div key={i} className="mb-5 break-inside-avoid animate-pulse overflow-hidden rounded-3xl panel">
            <div className={`${ratio} bg-lila/70`} />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-rosa" />
              <div className="h-3 w-1/2 rounded bg-lila/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
