/** Iniciales (máximo dos) de un nombre: "Gabriel García Márquez" → "GG". */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/** "1 libro" / "N libros" */
export function booksLabel(count: number) {
  return count === 1 ? '1 libro' : `${count} libros`
}
