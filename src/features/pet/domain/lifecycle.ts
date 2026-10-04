export type Lifecycle =
  | Readonly<{ stage: 'egg' }>
  | Readonly<{ stage: 'baby'; careDays: readonly number[] }>
  | Readonly<{ stage: 'adult' }>

export const requiredCareDays = 10
export const dayLength = 86_400_000

export function rewardGrowth(lifecycle: Lifecycle, day: number): Lifecycle {
  if (lifecycle.stage !== 'baby' || lifecycle.careDays.includes(day))
    return lifecycle
  const careDays = [...lifecycle.careDays, day].sort((a, b) => a - b)
  return careDays.length >= requiredCareDays
    ? { stage: 'adult' }
    : { stage: 'baby', careDays }
}

export function lifecycleView(lifecycle: Lifecycle) {
  const careDays =
    lifecycle.stage === 'baby'
      ? lifecycle.careDays.length
      : lifecycle.stage === 'adult'
        ? requiredCareDays
        : 0
  return {
    stage: lifecycle.stage,
    careDays,
    remainingDays: requiredCareDays - careDays,
  }
}
