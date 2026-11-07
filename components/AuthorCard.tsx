"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, Cake, MapPin, Pencil, Trash2 } from "lucide-react";
import Button, { IconBubble, buttonClasses } from "@/components/ui/Button";
import IconCircle from "@/components/ui/IconCircle";
import { booksLabel, initials } from "@/lib/format";
import type { Author } from "@/lib/types";

type AuthorCardProps = {
  author: Author;
  index: number;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
};

// forwardRef para que AnimatePresence (mode="popLayout") pueda medir la tarjeta al salir
const AuthorCard = forwardRef<HTMLDivElement, AuthorCardProps>(function AuthorCard(
  { author, index, onEdit, onDelete },
  ref
) {
  const reduceMotion = useReducedMotion();
  const count = author._count.books;

  return (
    <motion.article
      ref={ref}
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, delay: Math.min(index, 8) * 0.06 } }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9, rotate: -3, transition: { duration: 0.25 } }}
      whileHover={reduceMotion ? undefined : { y: -6, rotate: index % 2 === 0 ? 1.2 : -1.2 }}
      className="panel flex flex-col rounded-3xl p-5 transition-shadow hover:shadow-[0_18px_36px_-16px_rgba(169,133,245,0.7)]"
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-rosa via-lila to-menta font-display text-xl font-semibold text-texto ring-2 ring-lila-fuerte"
        >
          {initials(author.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-semibold text-texto" title={author.name}>
            {author.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-bold text-texto-suave">
            {author.nationality && (
              <span className="flex items-center gap-1.5">
                <IconCircle icon={MapPin} tone={2} size="sm" /> {author.nationality}
              </span>
            )}
            {author.birthYear && (
              <span className="flex items-center gap-1.5">
                <IconCircle icon={Cake} tone={0} size="sm" /> {author.birthYear}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm font-medium leading-6 text-texto-suave">
        {author.bio || <span className="italic">Sin biografía todavía.</span>}
      </p>

      <p className="mt-3 flex items-center gap-2 font-display font-semibold text-acento">
        <IconCircle icon={BookOpen} tone={1} size="sm" />
        {booksLabel(count)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-lila pt-4">
        <Link href={`/authors/${author.id}`} className={buttonClasses("secondary")}>
          <IconBubble>
            <BookOpen />
          </IconBubble>
          Ver libros
        </Link>
        <Button variant="secondary" icon={<Pencil />} onClick={() => onEdit(author)}>
          Editar
        </Button>
        <Button variant="danger" icon={<Trash2 />} onClick={() => onDelete(author)}>
          Eliminar
        </Button>
      </div>
    </motion.article>
  );
});

export default AuthorCard;
