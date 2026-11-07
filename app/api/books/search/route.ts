import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50
const SORT_FIELDS = ['title', 'publishedYear', 'createdAt'] as const

type SortField = (typeof SORT_FIELDS)[number]

// Entero >= 1; si no es válido devuelve null
function parsePositiveInt(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 ? n : null
}

// GET - Buscar libros con filtros, paginación y orden
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.trim()
    const genre = searchParams.get('genre')?.trim()
    const authorName = searchParams.get('authorName')?.trim()

    const page = parsePositiveInt(searchParams.get('page')) ?? DEFAULT_PAGE
    const limit = Math.min(parsePositiveInt(searchParams.get('limit')) ?? DEFAULT_LIMIT, MAX_LIMIT)

    const sortByParam = searchParams.get('sortBy')
    const sortBy: SortField = SORT_FIELDS.includes(sortByParam as SortField)
      ? (sortByParam as SortField)
      : 'createdAt'

    const orderParam = searchParams.get('order')
    const order: Prisma.SortOrder = orderParam === 'asc' || orderParam === 'desc' ? orderParam : 'desc'

    // Filtros combinados con AND
    const where: Prisma.BookWhereInput = {
      AND: [
        ...(search ? [{ title: { contains: search, mode: 'insensitive' as const } }] : []),
        ...(genre ? [{ genre }] : []),
        ...(authorName
          ? [{ author: { name: { contains: authorName, mode: 'insensitive' as const } } }]
          : []),
      ],
    }

    const [total, data] = await prisma.$transaction([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error al buscar libros' }, { status: 500 })
  }
}
