import type { FoodId } from './foods'

export const adultVariants = ['gourmet', 'whirlwind', 'cuddly'] as const
export type AdultVariant = (typeof adultVariants)[number]
export type VariantChoices = readonly [
  AdultVariant,
  AdultVariant,
  ...AdultVariant[],
]
export type DailyExperience = Readonly<{
  day: number
  foods: readonly FoodId[]
  played: boolean
  cuddled: boolean
}>
export type AdultIdentity =
  | Readonly<{ status: 'chosen'; variant: AdultVariant }>
  | Readonly<{ status: 'pending'; options: VariantChoices }>
export type Lifecycle =
  | Readonly<{ stage: 'egg' }>
  | Readonly<{
      stage: 'baby' | 'child' | 'teen'
      days: readonly DailyExperience[]
    }>
  | Readonly<{ stage: 'adult'; identity: AdultIdentity }>
export const requiredCareDays = 10
export const dayLength = 86_400_000
export const pendingAdult = (): Lifecycle => ({
  stage: 'adult',
  identity: { status: 'pending', options: adultVariants },
})
export const neutralDay = (day: number): DailyExperience => ({
  day,
  foods: [],
  played: false,
  cuddled: false,
})

export function experienceScores(days: readonly DailyExperience[]) {
  const scores = { gourmet: 0, whirlwind: 0, cuddly: 0 }
  let previousFood: FoodId | undefined
  for (const day of days) {
    const different = day.foods.find((food) => food !== previousFood)
    if (different !== undefined) {
      scores.gourmet++
      previousFood = different
    }
    if (day.played) scores.whirlwind++
    if (day.cuddled) scores.cuddly++
  }
  return scores
}
export function recordCare(
  lifecycle: Lifecycle,
  day: number,
  action: { type: 'feed'; food: FoodId } | { type: 'play' | 'pet' },
): Lifecycle {
  if (lifecycle.stage === 'egg' || lifecycle.stage === 'adult') return lifecycle
  const row =
    lifecycle.days.find((entry) => entry.day === day) ?? neutralDay(day)
  const updated: DailyExperience = {
    ...row,
    foods:
      action.type === 'feed' && !row.foods.includes(action.food)
        ? [...row.foods, action.food]
        : row.foods,
    played: row.played || action.type === 'play',
    cuddled: row.cuddled || action.type === 'pet',
  }
  const days = [
    ...lifecycle.days.filter((entry) => entry.day !== day),
    updated,
  ].sort((a, b) => a.day - b.day)
  if (days.length < requiredCareDays)
    return { stage: growingStage(days.length), days }
  const scores = experienceScores(days)
  const maximum = Math.max(...Object.values(scores))
  const options = adultVariants.filter((variant) => scores[variant] === maximum)
  const [first, second, ...rest] = options
  if (first === undefined) return pendingAdult()
  return {
    stage: 'adult',
    identity:
      second === undefined
        ? { status: 'chosen', variant: first }
        : { status: 'pending', options: [first, second, ...rest] },
  }
}
export function chooseAdultVariant(
  lifecycle: Lifecycle,
  variant: AdultVariant,
): Lifecycle {
  return lifecycle.stage === 'adult' &&
    lifecycle.identity.status === 'pending' &&
    lifecycle.identity.options.includes(variant)
    ? { stage: 'adult', identity: { status: 'chosen', variant } }
    : lifecycle
}
export function lifecycleView(lifecycle: Lifecycle) {
  const careDays =
    lifecycle.stage === 'baby' ||
    lifecycle.stage === 'child' ||
    lifecycle.stage === 'teen'
      ? lifecycle.days.length
      : lifecycle.stage === 'adult'
        ? requiredCareDays
        : 0
  return {
    stage: lifecycle.stage,
    careDays,
    remainingDays: requiredCareDays - careDays,
    adultVariant:
      lifecycle.stage === 'adult' && lifecycle.identity.status === 'chosen'
        ? lifecycle.identity.variant
        : null,
    choices:
      lifecycle.stage === 'adult' && lifecycle.identity.status === 'pending'
        ? lifecycle.identity.options
        : [],
    scores: experienceScores(
      lifecycle.stage === 'baby' ||
        lifecycle.stage === 'child' ||
        lifecycle.stage === 'teen'
        ? lifecycle.days
        : [],
    ),
  }
}

export function growingStage(days: number): 'baby' | 'child' | 'teen' {
  return days >= 6 ? 'teen' : days >= 3 ? 'child' : 'baby'
}
