"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { BookOpen, CloudOff, Feather, Plus, RotateCcw, Tags, Trash2, Trophy, Users } from "lucide-react";
import AuthorCard from "@/components/AuthorCard";
import AuthorForm from "@/components/AuthorForm";
import StatCard from "@/components/StatCard";
import BouncingBook from "@/components/ui/BouncingBook";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Toast, { type ToastData } from "@/components/ui/Toast";
import { readError } from "@/lib/http";
import type { Author, AuthorInput } from "@/lib/types";

type FormState = { open: false } | { open: true; author: Author | null };

const LOAD_ERROR = "No se pudieron cargar los autores.";

async function fetchAuthors(): Promise<Author[]> {
  const res = await fetch("/api/authors", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res, LOAD_ERROR));
  return res.json();
}

export default function AuthorsDashboard() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({ open: false });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [toDelete, setToDelete] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, kind: ToastData["kind"] = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, kind });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Carga la lista; los setState van en los callbacks de la promesa
  const loadAuthors = useCallback((isCancelled: () => boolean = () => false) => {
    fetchAuthors()
      .then((data) => {
        if (isCancelled()) return;
        setAuthors(data);
        setLoadError(null);
      })
      .catch((err) => {
        if (isCancelled()) return;
        setLoadError(err instanceof Error ? err.message : LOAD_ERROR);
      })
      .finally(() => {
        if (!isCancelled()) setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAuthors(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAuthors]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    loadAuthors();
  }

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalBooks = authors.reduce((sum, a) => sum + a._count.books, 0);
    const genres = new Set(
      authors.flatMap((a) => a.books.map((b) => b.genre).filter((g): g is string => !!g))
    );
    const top = authors.reduce<Author | null>(
      (best, a) => (a._count.books > (best?._count.books ?? 0) ? a : best),
      null
    );
    return { totalAuthors: authors.length, totalBooks, genres: genres.size, top };
  }, [authors]);

  async function handleSave(values: AuthorInput): Promise<string | null> {
    if (!form.open) return null;
    const editing = form.author;
    try {
      const res = await fetch(editing ? `/api/authors/${editing.id}` : "/api/authors", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) return await readError(res, "No se pudo guardar el autor.");
      const saved: Author = await res.json();
      // La API devuelve el autor con sus libros pero sin _count: lo completamos
      const withCount: Author = { ...saved, _count: { books: saved.books?.length ?? 0 } };
      setAuthors((prev) =>
        (editing ? prev.map((a) => (a.id === saved.id ? withCount : a)) : [...prev, withCount]).sort((a, b) =>
          a.name.localeCompare(b.name, "es")
        )
      );
      setForm({ open: false });
      showToast(editing ? "Autor actualizado" : "Autor creado");
      return null;
    } catch {
      return "No se pudo conectar con el servidor. Inténtalo de nuevo.";
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/authors/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(await readError(res, "No se pudo eliminar el autor."));
        return;
      }
      setAuthors((prev) => prev.filter((a) => a.id !== toDelete.id));
      setToDelete(null);
      showToast("Autor eliminado");
    } catch {
      setDeleteError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
    }
  }

  const openCreate = () => setForm({ open: true, author: null });
  const closeForm = useCallback(() => setForm({ open: false }), []);
  const closeDelete = useCallback(() => {
    setToDelete(null);
    setDeleteError(null);
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Encabezado */}
      <header className="panel flex flex-wrap items-end justify-between gap-4 rounded-3xl p-6 sm:p-8">
        <div>
          <h1 className="font-display text-4xl font-semibold text-texto sm:text-5xl">Autores <span aria-hidden="true">✨</span></h1>
          <p className="mt-1 text-texto-suave">Las voces que habitan nuestra biblioteca.</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={openCreate}>
          Nuevo autor
        </Button>
      </header>

      {/* Estadísticas */}
      <section aria-label="Estadísticas generales" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Users} label="Autores" value={stats.totalAuthors} index={0} />
            <StatCard icon={BookOpen} label="Libros" value={stats.totalBooks} index={1} />
            <StatCard icon={Tags} label="Géneros distintos" value={stats.genres} index={2} />
            <StatCard
              icon={Trophy}
              label="Con más libros"
              value={stats.top?.name ?? "—"}
              hint={stats.top ? `${stats.top._count.books} libros` : "Aún sin libros"}
              index={3}
            />
          </>
        )}
      </section>

      {/* Lista */}
      <section aria-label="Lista de autores" className="mt-10">
        {loading ? (
          <>
            <BouncingBook label="Cargando autores…" />
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : loadError ? (
          <EmptyState
            icon={<CloudOff size={36} strokeWidth={1.5} />}
            title="No pudimos cargar los autores"
            text={loadError}
            action={
              <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={retry}>
                Reintentar
              </Button>
            }
          />
        ) : authors.length === 0 ? (
          <EmptyState
            icon={<Feather size={36} strokeWidth={1.5} />}
            title="Todavía no hay autores"
            text="Cada biblioteca empieza con una primera voz. ¿Agregamos la primera?"
            action={
              <Button icon={<Plus size={18} />} onClick={openCreate}>
                Crear el primer autor
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {authors.map((author, i) => (
                <AuthorCard
                  key={author.id}
                  author={author}
                  index={i}
                  onEdit={(a) => setForm({ open: true, author: a })}
                  onDelete={(a) => setToDelete(a)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Crear / editar */}
      <Modal
        open={form.open}
        onClose={closeForm}
        locked={formSubmitting}
        title={form.open && form.author ? "Editar autor" : "Nuevo autor"}
        description={form.open && form.author ? "Actualiza los datos del autor." : "Agrega una nueva voz a la biblioteca."}
      >
        {form.open && (
          <AuthorForm
            key={form.author?.id ?? "new"}
            author={form.author}
            onSubmit={handleSave}
            onCancel={closeForm}
            onSubmittingChange={setFormSubmitting}
          />
        )}
      </Modal>

      {/* Confirmar eliminación */}
      <Modal open={!!toDelete} onClose={closeDelete} locked={deleting} title="¿Eliminar autor?">
        {toDelete && (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-texto-suave">
              Se eliminará a <strong className="font-semibold">{toDelete.name}</strong>
              {toDelete._count.books > 0 ? (
                <>
                  {" "}y también{" "}
                  <strong className="font-semibold">
                    {toDelete._count.books === 1 ? "su libro" : `sus ${toDelete._count.books} libros`}
                  </strong>
                </>
              ) : (
                " y todos los libros que tenga"
              )}
              . Esta acción no se puede deshacer.
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

function StatSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-3xl panel p-5">
      <div className="size-11 rounded-xl bg-rosa" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded bg-rosa" />
        <div className="h-6 w-14 rounded bg-lila/70" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl panel p-5">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-rosa" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-rosa" />
          <div className="h-3 w-1/2 rounded bg-lila/70" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-durazno" />
        <div className="h-3 rounded bg-durazno" />
        <div className="h-3 w-2/3 rounded bg-durazno" />
      </div>
      <div className="mt-6 flex gap-2">
        <div className="h-9 w-24 rounded-full bg-lila/70" />
        <div className="h-9 w-20 rounded-full bg-lila/70" />
        <div className="h-9 w-24 rounded-full bg-lila/70" />
      </div>
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
