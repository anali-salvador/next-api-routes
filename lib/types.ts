export type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  createdAt: string
  updatedAt: string
}

export type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  createdAt: string
  updatedAt: string
  books: Book[]
  _count: { books: number }
}

/** Libro tal como lo devuelve /api/books/search (con su autor resumido). */
export type BookWithAuthor = Book & {
  author: Pick<Author, 'id' | 'name' | 'email'>
}

export type PaginationInfo = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type BookSearchResponse = {
  data: BookWithAuthor[]
  pagination: PaginationInfo
}

/** Datos que se envían al crear o editar un libro (los textos vacíos van como null). */
export type BookInput = {
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
}

/** Respuesta de /api/authors/[id]/stats. */
export type AuthorStats = {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number | null
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

/** Datos que se envían al crear o editar un autor. */
export type AuthorInput = {
  name: string
  email: string
  nationality: string | null
  birthYear: number | null
  bio: string | null
}
