import type { GameItem } from './types'

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`

const SHARMAINE_VARIANTS = [
  assetPath('assets/characters/Sharmaine01.png'),
  assetPath('assets/characters/Sharmaine02.png'),
  assetPath('assets/characters/Sharmaine03.png'),
]
const VANESSA_VARIANTS = [
  assetPath('assets/characters/Vanessa01.png'),
  assetPath('assets/characters/Vanessa02.png'),
  assetPath('assets/characters/Vanessa03.png'),
]
const MELANI_VARIANTS = [
  assetPath('assets/characters/Melani01.png'),
  assetPath('assets/characters/Melani02.png'),
  assetPath('assets/characters/Melani03.png'),
]
const BALIMBING_VARIANTS = [assetPath('assets/characters/Balimbing.png')]

export const BALIMBING_ITEM: GameItem = {
  id: 'balimbing',
  realName: 'Balimbing',
  memeName: 'Lorren',
  image: BALIMBING_VARIANTS[0],
  variants: BALIMBING_VARIANTS,
  choices: ['Imee', 'Camille', 'Lorren']
}

export const ITEMS: GameItem[] = [
  {
    id: 'orange',
    realName: 'Orange',
    memeName: 'Sharmaine',
    image: SHARMAINE_VARIANTS[0],
    variants: SHARMAINE_VARIANTS
  },
  {
    id: 'fly',
    realName: 'Fly',
    memeName: 'Vanessa',
    image: VANESSA_VARIANTS[0],
    variants: VANESSA_VARIANTS
  },
  {
    id: 'avocado',
    realName: 'Avocado',
    memeName: 'Melani',
    image: MELANI_VARIANTS[0],
    variants: MELANI_VARIANTS
  }
]

export function getTimeForLevel(level: number) {
  if (level >= 26) return 1
  if (level >= 21) return 1
  if (level >= 16) return 2
  if (level >= 11) return 3
  if (level >= 6) return 4
  return 5
}

export function getRandomItem(excludeId?: string): GameItem {
  const candidates = excludeId
    ? ITEMS.filter((item) => item.id !== excludeId)
    : ITEMS
  const item = candidates[Math.floor(Math.random() * candidates.length)]
  const playableImages = item.variants.slice(0, 2)
  return {
    ...item,
    image: playableImages[Math.floor(Math.random() * playableImages.length)]
  }
}

export function getItemForLevel(level: number, excludeId?: string): GameItem {
  if (level === 26) return BALIMBING_ITEM
  return getRandomItem(excludeId)
}

export function makeChoices(item: GameItem): string[] {
  if (item.choices) return shuffleArray(item.choices)

  const otherNames = ITEMS.filter((candidate) => candidate.id !== item.id).map(
    (candidate) => candidate.memeName
  )
  const randomOther = otherNames[Math.floor(Math.random() * otherNames.length)]
  const choices = [item.realName, item.memeName, randomOther]
  return shuffleArray(choices)
}

export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
