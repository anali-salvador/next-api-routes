"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Library } from "lucide-react";

const LINKS = [
  { href: "/", label: "Inicio", Icon: House },
  { href: "/books", label: "Libros", Icon: Library },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Links({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex shrink-0 items-center gap-1 sm:gap-2">
      {LINKS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-display text-[0.95rem] font-semibold transition-[background-color,border-color,transform] duration-200 hover:scale-105 ${
                active
                  ? "border-rosa-fuerte bg-rosa text-texto"
                  : "border-transparent text-texto-suave hover:border-lila-fuerte hover:bg-lila/60 hover:text-texto"
              }`}
            >
              <Icon size={20} strokeWidth={2.25} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Versión sin enlace activo, usada como fallback mientras se resuelve la ruta. */
export function NavLinksStatic() {
  return <Links pathname={null} />;
}

export default function NavLinks() {
  return <Links pathname={usePathname()} />;
}
