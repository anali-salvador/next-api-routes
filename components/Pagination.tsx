"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationInfo } from "@/lib/types";

/** Números a mostrar: siempre la primera, la última y las vecinas de la actual; el resto como "…". */
function pageItems(page: number, total: number): (number | "dots")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "dots")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) items.push("dots");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("dots");
  items.push(total);
  return items;
}

const base =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-full border-2 px-3 font-display text-[0.95rem] font-semibold text-texto transition-[background-color,border-color,transform] duration-200 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-lila-foco enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
const idle = "border-lila-fuerte bg-white hover:bg-lila/60";

export default function Pagination({
  pagination,
  onChange,
}: {
  pagination: PaginationInfo;
  onChange: (page: number) => void;
}) {
  const { page, totalPages, hasNext, hasPrev } = pagination;
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button type="button" className={`${base} ${idle} gap-1`} disabled={!hasPrev} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={22} strokeWidth={2.5} /> Anterior
      </button>

      {pageItems(page, totalPages).map((item, i) =>
        item === "dots" ? (
          <span key={`dots-${i}`} className="px-1 font-bold text-texto-suave" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            disabled={item === page}
            onClick={() => onChange(item)}
            className={`${base} ${
              item === page
                ? "border-[#E98DB9] bg-gradient-to-r from-rosa to-lila shadow-[0_8px_18px_-10px_rgba(233,141,185,0.95)] disabled:cursor-default disabled:opacity-100"
                : idle
            }`}
          >
            {item}
          </button>
        )
      )}

      <button type="button" className={`${base} ${idle} gap-1`} disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Siguiente <ChevronRight size={22} strokeWidth={2.5} />
      </button>
    </nav>
  );
}
