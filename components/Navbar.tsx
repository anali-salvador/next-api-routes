import Link from "next/link";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import IconCircle from "@/components/ui/IconCircle";
import NavLinks, { NavLinksStatic } from "./NavLinks";

export default function Navbar() {
  return (
    <header className="panel fixed inset-x-3 top-3 z-50 rounded-full border-rosa-fuerte sm:inset-x-6">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-texto">
          <IconCircle icon={BookOpen} tone={0} size="md" />
          <span className="truncate font-display text-lg font-semibold sm:text-xl">Biblioteca Mágica</span>
        </Link>
        {/* usePathname necesita Suspense con cacheComponents en rutas dinámicas */}
        <Suspense fallback={<NavLinksStatic />}>
          <NavLinks />
        </Suspense>
      </nav>
    </header>
  );
}
