export const foods = {
  franzbroetchen: { fullness: 20, happiness: 0, energy: 0 },
  doener: { fullness: 30, happiness: 5, energy: 0 },
  augustiner: { fullness: 5, happiness: 10, energy: -5 },
  strawberry: { fullness: 10, happiness: 12, energy: 0 },
} as const

export type FoodId = keyof typeof foods
export const foodIds: FoodId[] = [
  'franzbroetchen',
  'doener',
  'augustiner',
  'strawberry',
]
