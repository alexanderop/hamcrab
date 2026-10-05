import { dayLength } from './lifecycle'
import { hour, type PetLife } from './life'

function nextHour(life: PetLife, now: number, atHour: number): number {
  const offset = life.routine.utcOffsetMinutes * 60_000
  const today = Math.floor((now + offset) / dayLength) * dayLength - offset
  const bedtime = today + atHour * hour
  return bedtime > now ? bedtime : bedtime + dayLength
}
export const nextBedtime = (life: PetLife, now: number) =>
  nextHour(life, now, life.routine.bedtime)
export const nextWake = (life: PetLife, now: number) =>
  nextHour(life, now, life.routine.wakeHour)
function nightAt(life: PetLife, now: number): boolean {
  const local =
    ((((now + life.routine.utcOffsetMinutes * 60_000) % dayLength) +
      dayLength) %
      dayLength) /
    hour
  const { bedtime, wakeHour } = life.routine
  return bedtime > wakeHour
    ? local >= bedtime || local < wakeHour
    : local >= bedtime && local < wakeHour
}
export function advanceRoutine(
  life: PetLife,
  energy: number,
  from: number,
  to: number,
) {
  let sleep = life.sleep
  let cursor = Math.max(from, to - dayLength)
  while (true) {
    const day = Math.floor(
      (cursor + life.routine.utcOffsetMinutes * 60_000) / dayLength,
    )
    if (
      (sleep.mode === 'nap' || sleep.mode === 'manual') &&
      sleep.until > 0 &&
      cursor >= sleep.until
    )
      sleep = { ...sleep, mode: 'awake', until: 0 }
    if (
      life.routine.enabled &&
      sleep.mode !== 'manual' &&
      sleep.mode !== 'nap'
    ) {
      const night = nightAt(life, cursor) && cursor >= sleep.overrideUntil
      sleep = { ...sleep, mode: night ? 'night' : 'awake' }
      if (
        !night &&
        energy <= 10 &&
        sleep.napDay !== day &&
        cursor >= sleep.overrideUntil
      ) {
        sleep = { ...sleep, mode: 'nap', until: cursor + hour, napDay: day }
      }
    }
    if (cursor >= to) break
    let end = to
    if (life.routine.enabled) {
      const offset = life.routine.utcOffsetMinutes * 60_000
      const start =
        Math.floor((cursor + offset) / dayLength) * dayLength - offset
      for (const boundary of [
        start + dayLength,
        start + life.routine.bedtime * hour,
        start + life.routine.wakeHour * hour,
        sleep.overrideUntil,
      ]) {
        if (boundary > cursor) end = Math.min(end, boundary)
      }
      if (
        sleep.mode === 'awake' &&
        energy > 10 &&
        sleep.napDay !== day &&
        cursor >= sleep.overrideUntil
      )
        end = Math.min(
          end,
          cursor + Math.max(1, Math.ceil(((energy - 10) / 5) * hour)),
        )
    }
    if (
      (sleep.mode === 'nap' || sleep.mode === 'manual') &&
      sleep.until > cursor
    )
      end = Math.min(end, sleep.until)
    energy = Math.max(
      0,
      Math.min(
        100,
        energy + ((sleep.mode === 'awake' ? -5 : 20) * (end - cursor)) / hour,
      ),
    )
    cursor = end
  }
  return { sleep, energy, sleeping: sleep.mode !== 'awake' }
}
