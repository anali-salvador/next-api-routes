"use client";

import { useEffect, useState } from "react";
import { BookOpen, Heart, Sparkles } from "lucide-react";
import { hashText, toneFor } from "@/lib/tones";

// Degradados pastel para la portada generada
const GRADIENTS = [
  "linear-gradient(160deg, #FFD6E8 0%, #E4D4FF 100%)",
  "linear-gradient(160deg, #CFF5E7 0%, #DDF1FF 100%)",
  "linear-gradient(160deg, #FFE3CF 0%, #FFF3C4 100%)",
  "linear-gradient(160deg, #E4D4FF 0%, #CFF5E7 100%)",
  "linear-gradient(160deg, #FFD6E8 0%, #FFE3CF 100%)",
  "linear-gradient(160deg, #FFF3C4 0%, #CFF5E7 100%)",
];

const RATIOS = ["aspect-[3/4]", "aspect-[2/3]", "aspect-[4/5]"];

const CACHE_PREFIX = "biblioteca:cover:v1:";
const NONE = "none";

type Lookup = { done: false } | { done: true; coverId: number | null };

/** Lee la caché de localStorage; si no está disponible o no hay dato, la búsqueda queda pendiente. */
function readCache(key: string): Lookup {
  if (typeof window === "undefined") return { done: false };
  try {
    const value = window.localStorage.getItem(key);
    if (value === NONE) return { done: true, coverId: null };
    if (value && /^\d+$/.test(value)) return { done: true, coverId: Number(value) };
  } catch {
    // localStorage bloqueado (modo privado, etc.): se busca igual, sin caché
  }
  return { done: false };
}

function writeCache(key: string, coverId: number | null) {
  try {
    window.localStorage.setItem(key, coverId === null ? NONE : String(coverId));
  } catch {
    // sin caché: no pasa nada
  }
}

type BookCoverProps = { title: string; author: string; isbn: string | null };

/**
 * Portada con prioridad: (a) búsqueda en Open Library por título y autor (cover_i),
 * (b) portada por ISBN, (c) portada kawaii generada.
 * El padre debe darle `key` con título, autor e ISBN para reiniciarla si cambian.
 */
export default function BookCover({ title, author, isbn }: BookCoverProps) {
  const cacheKey = `${CACHE_PREFIX}${title.toLowerCase()}|${author.toLowerCase()}`;
  const [lookup, setLookup] = useState<Lookup>(() => readCache(cacheKey));
  const [failures, setFailures] = useState(0);

  useEffect(() => {
    if (lookup.done) return;
    const controller = new AbortController();
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1&fields=cover_i`;
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { docs?: { cover_i?: unknown }[] }) => {
        const id = body.docs?.[0]?.cover_i;
        const coverId = typeof id === "number" ? id : null;
        writeCache(cacheKey, coverId);
        setLookup({ done: true, coverId });
      })
      .catch(() => {
        // Error de red o de la API: se pasa al ISBN / portada generada sin guardar en caché
        if (!controller.signal.aborted) setLookup({ done: true, coverId: null });
      });
    return () => controller.abort();
  }, [cacheKey, lookup.done, title, author]);

  const sources = [
    lookup.done && lookup.coverId !== null ? `https://covers.openlibrary.org/b/id/${lookup.coverId}-M.jpg` : null,
    lookup.done && isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false` : null,
  ].filter((s): s is string => s !== null);
  const src = sources[failures];

  const h = hashText(title);
  const gradient = GRADIENTS[h % GRADIENTS.length];
  const ratio = RATIOS[Math.floor(h / GRADIENTS.length) % RATIOS.length];
  const tone = toneFor(title);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border-2 ${tone.soft} ${ratio}`}
      style={{ background: gradient }}
    >
      {/* Portada kawaii generada (se ve mientras busca, si no hay portada o si la imagen falla) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
        <Sparkles size={22} strokeWidth={2.25} className="absolute left-4 top-4 text-[#B48CFF]" />
        <Heart size={20} strokeWidth={2.25} fill="#FFD6E8" className="absolute bottom-4 right-4 text-[#EC8FB7]" />
        <span
          className={`flex size-20 items-center justify-center rounded-full border-2 border-white bg-white/85 ${tone.icon}`}
        >
          <BookOpen size={44} strokeWidth={2} />
        </span>
        <p className="line-clamp-4 font-display text-lg font-semibold leading-snug text-texto">{title}</p>
      </div>

      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`Portada de ${title}`}
          loading="lazy"
          onError={() => setFailures((f) => f + 1)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}
