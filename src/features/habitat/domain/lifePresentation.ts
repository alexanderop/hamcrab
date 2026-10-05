export type LifeStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult'
export type Outfit = 'none' | 'ribbon' | 'cap'
export type Toy = 'none' | 'ball' | 'shell'
export type Decoration = 'none' | 'flower' | 'pebble'

export const stageProportions = {
  egg: { body: 1, head: 1, claws: 1 },
  baby: { body: 0.72, head: 1.15, claws: 0.65 },
  child: { body: 0.82, head: 1.1, claws: 0.76 },
  teen: { body: 0.92, head: 1.04, claws: 0.88 },
  adult: { body: 1, head: 1, claws: 1 },
} as const satisfies Record<
  LifeStage,
  { body: number; head: number; claws: number }
>

export function visibleWaste(waste: number): number {
  return Number.isFinite(waste)
    ? Math.max(0, Math.min(3, Math.floor(waste)))
    : 0
}
