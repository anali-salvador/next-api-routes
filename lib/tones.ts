/** Hash estable de un texto (djb2), para elegir colores y proporciones de forma determinista. */
export function hashText(text: string) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h
}

/**
 * Tonos pastel. Las clases van escritas completas para que Tailwind las genere.
 * Todos mantienen el texto #4B3B5C / #6B5A7B con contraste AA.
 */
export const TONES = [
  { card: 'bg-[#FFF2F8] border-rosa-fuerte', soft: 'bg-rosa border-rosa-fuerte', icon: 'text-[#B0457A]' },
  { card: 'bg-[#F7F1FF] border-lila-fuerte', soft: 'bg-lila border-lila-fuerte', icon: 'text-[#7446C9]' },
  { card: 'bg-[#F0FCF7] border-menta-fuerte', soft: 'bg-menta border-menta-fuerte', icon: 'text-[#2E7D63]' },
  { card: 'bg-[#FFF6EF] border-[#FFC4A3]', soft: 'bg-durazno border-[#FFC4A3]', icon: 'text-[#A6532F]' },
  { card: 'bg-[#FFFBEA] border-[#F2D675]', soft: 'bg-mantequilla border-[#F2D675]', icon: 'text-[#8A6A12]' },
  { card: 'bg-[#F2F9FF] border-[#A9D8F5]', soft: 'bg-celeste border-[#A9D8F5]', icon: 'text-[#2F6E96]' },
] as const

export type Tone = (typeof TONES)[number]

export const toneAt = (index: number): Tone => TONES[((index % TONES.length) + TONES.length) % TONES.length]
export const toneFor = (text: string): Tone => toneAt(hashText(text))
