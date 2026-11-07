"use client";

import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, FileText, Pencil, Trash2, UserRound } from "lucide-react";
import BookCover from "@/components/BookCover";
import Button from "@/components/ui/Button";
import IconCircle from "@/components/ui/IconCircle";
import { toneFor } from "@/lib/tones";
import type { BookWithAuthor } from "@/lib/types";

type BookCardProps = {
  book: BookWithAuthor;
  index: number;
  onEdit: (book: BookWithAuthor) => void;
  onDelete: (book: BookWithAuthor) => void;
};

export default function BookCard({ book, index, onEdit, onDelete }: BookCardProps) {
  const reduceMotion = useReducedMotion();
  const genreTone = book.genre ? toneFor(book.genre) : null;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, delay: Math.min(index, 11) * 0.05 } }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9, rotate: -3, transition: { duration: 0.25 } }}
      whileHover={reduceMotion ? undefined : { y: -6, rotate: index % 2 === 0 ? 1.5 : -1.5 }}
      className="panel mb-5 break-inside-avoid overflow-hidden rounded-3xl p-3 transition-shadow hover:shadow-[0_18px_36px_-16px_rgba(169,133,245,0.7)]"
    >
      <BookCover
        key={`${book.title}|${book.author.name}|${book.isbn ?? ""}`}
        title={book.title}
        author={book.author.name}
        isbn={book.isbn}
      />

      <div className="px-1 pb-1 pt-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-texto">{book.title}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-sm font-bold text-texto-suave">
          <IconCircle icon={UserRound} tone={1} size="sm" />
          <span className="truncate">{book.author.name}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-texto-suave">
          {book.genre && genreTone && <span className={`chip text-xs ${genreTone.soft}`}>{book.genre}</span>}
          {book.publishedYear && (
            <span className="flex items-center gap-1.5">
              <IconCircle icon={CalendarDays} tone={4} size="sm" /> {book.publishedYear}
            </span>
          )}
          {book.pages && (
            <span className="flex items-center gap-1.5">
              <IconCircle icon={FileText} tone={2} size="sm" /> {book.pages} págs.
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-lila pt-3">
          <Button variant="secondary" className="flex-1" icon={<Pencil />} onClick={() => onEdit(book)}>
            Editar
          </Button>
          <Button variant="danger" className="flex-1" icon={<Trash2 />} onClick={() => onDelete(book)}>
            Eliminar
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
