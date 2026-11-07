import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Devuelve el elemento con el valor mínimo (o máximo) según `pick`, o null si la lista está vacía
function extreme<T>(items: T[], value: (item: T) => number, pick: 'min' | 'max'): T | null {
  return items.reduce<T | null>((best, item) => {
    if (best === null) return item
    const better = pick === 'min' ? value(item) < value(best) : value(item) > value(best)
    return better ? item : best
  }, null)
}

// GET - Estadísticas de un autor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({ where: { id } })
    if (!author) {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }

    const books = await prisma.book.findMany({ where: { authorId: id } })

    // Libros con año y con páginas (se ignoran los null)
    const withYear = books.filter(
      (b): b is typeof b & { publishedYear: number } => b.publishedYear !== null
    )
    const withPages = books.filter((b): b is typeof b & { pages: number } => b.pages !== null)

    const first = extreme(withYear, (b) => b.publishedYear, 'min')
    const latest = extreme(withYear, (b) => b.publishedYear, 'max')
    const longest = extreme(withPages, (b) => b.pages, 'max')
    const shortest = extreme(withPages, (b) => b.pages, 'min')

    const averagePages =
      withPages.length > 0
        ? Math.round(withPages.reduce((sum, b) => sum + b.pages, 0) / withPages.length)
        : null

    const genres = [
      ...new Set(books.map((b) => b.genre).filter((g): g is string => g !== null)),
    ].sort((a, b) => a.localeCompare(b, 'es'))

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: first ? { title: first.title, year: first.publishedYear } : null,
      latestBook: latest ? { title: latest.title, year: latest.publishedYear } : null,
      averagePages,
      genres,
      longestBook: longest ? { title: longest.title, pages: longest.pages } : null,
      shortestBook: shortest ? { title: shortest.title, pages: shortest.pages } : null,
    })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
