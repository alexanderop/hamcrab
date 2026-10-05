import type { FoodId } from './foods'
import { dayLength, type AdultVariant } from './lifecycle'
import type { PetSnapshot } from './pet'

export type Outfit = 'none' | 'cap' | 'ribbon'
export type Toy = 'none' | 'shell' | 'ball'
export type Decoration = 'none' | 'pebble' | 'flower'
export type Routine = Readonly<{
  enabled: boolean
  bedtime: number
  wakeHour: number
  utcOffsetMinutes: number
}>
export type FamilyEntry = Readonly<{
  generation: number
  name: string
  variant: AdultVariant
  bornAt: number
  movedOutAt: number
}>
export type ShellGame = Readonly<{
  id: number
  generation: number
  round: number
  score: number
  target: 0 | 1 | 2
  lastCorrect: boolean | null
}>
export type PetLife = Readonly<{
  health: Readonly<{ waste: number; nextToiletAt: number; unwell: boolean }>
  personality: 'curious' | 'playful' | 'gentle'
  favoriteFood: FoodId
  favoriteToy: 'shell' | 'ball'
  equipment: Readonly<{ outfit: Outfit; toy: Toy; decoration: Decoration }>
  selected: Readonly<{ outfit: boolean; toy: boolean; decoration: boolean }>
  owned: Readonly<{ ribbon: boolean; ball: boolean; flower: boolean }>
  generation: number
  visits: readonly number[]
  album: readonly FamilyEntry[]
  routine: Routine
  sleep: Readonly<{
    mode: 'awake' | 'manual' | 'night' | 'nap'
    until: number
    overrideUntil: number
    napDay: number
  }>
  gameSequence: number
  game: ShellGame | null
  lastGame: Readonly<{ id: number; score: number }> | null
}>
export type LifeCommand =
  | {
      type:
        | 'clean'
        | 'toilet'
        | 'medicine'
        | 'startGame'
        | 'cancelGame'
        | 'visitCompanion'
    }
  | { type: 'guessShell'; gameId: number; round: number; shell: 0 | 1 | 2 }
  | { type: 'equip'; slot: 'outfit'; item: Outfit }
  | { type: 'equip'; slot: 'toy'; item: Toy }
  | { type: 'equip'; slot: 'decoration'; item: Decoration }
  | { type: 'nextGeneration'; expectedGeneration: number }
  | ({ type: 'setRoutine' } & Routine)
export type LifeMessage =
  | 'cleaned'
  | 'toilet'
  | 'noToilet'
  | 'medicine'
  | 'alreadyWell'
  | 'equipped'
  | 'itemLocked'
  | 'gameStarted'
  | 'gameCancelled'
  | 'roundCorrect'
  | 'roundMissed'
  | 'gameFinished'
  | 'staleGame'
  | 'companionVisited'
  | 'alreadyVisited'
  | 'adultRequired'
  | 'familyNotReady'
  | 'newGeneration'
  | 'routineSaved'
  | 'invalidRoutine'
  | 'egg'
  | 'sleeping'
  | 'tired'
export type LifeResult = {
  pet: PetSnapshot
  accepted: boolean
  message: LifeMessage
}
export const hour = 3_600_000
export const toiletInterval = 6 * hour
export const toiletWindow = hour / 2

export function createLife(now: number, sleeping = false): PetLife {
  const seed = Math.floor(now / 1000) % 3
  return {
    health: { waste: 0, nextToiletAt: now + toiletInterval, unwell: false },
    personality: (['curious', 'playful', 'gentle'] as const)[seed]!,
    favoriteFood: (['doener', 'franzbroetchen', 'strawberry'] as const)[seed]!,
    favoriteToy: seed === 1 ? 'ball' : 'shell',
    equipment: { outfit: 'none', toy: 'none', decoration: 'none' },
    selected: { outfit: false, toy: false, decoration: false },
    owned: { ribbon: false, ball: false, flower: false },
    generation: 1,
    visits: [],
    album: [],
    routine: { enabled: false, bedtime: 22, wakeHour: 8, utcOffsetMinutes: 0 },
    sleep: {
      mode: sleeping ? 'manual' : 'awake',
      until: 0,
      overrideUntil: 0,
      napDay: -1,
    },
    gameSequence: 0,
    game: null,
    lastGame: null,
  }
}
export function syncInventory(life: PetLife, points: number): PetLife {
  const owned = {
    ribbon: life.owned.ribbon || points >= 10,
    ball: life.owned.ball || points >= 60,
    flower: life.owned.flower || points >= 100,
  }
  return {
    ...life,
    owned,
    equipment: {
      outfit:
        !life.selected.outfit && owned.ribbon
          ? 'ribbon'
          : life.equipment.outfit,
      toy: !life.selected.toy && owned.ball ? 'ball' : life.equipment.toy,
      decoration:
        !life.selected.decoration && owned.flower
          ? 'flower'
          : life.equipment.decoration,
    },
  }
}
export function shellTarget(
  id: number,
  generation: number,
  round: number,
): 0 | 1 | 2 {
  return ((id * 7 + generation * 11 + round * round + round * 7) % 3) as
    0 | 1 | 2
}
export function lifeView(pet: PetSnapshot) {
  const life = syncInventory(pet.life, pet.friendship.points)
  const day = Math.floor(pet.updatedAt / dayLength)
  const adult =
    pet.lifecycle.stage === 'adult' &&
    pet.lifecycle.identity.status === 'chosen'
  const toiletCue =
    pet.lifecycle.stage !== 'egg' &&
    pet.updatedAt >= life.health.nextToiletAt - toiletWindow &&
    pet.updatedAt < life.health.nextToiletAt
  const localHour =
    ((pet.updatedAt + life.routine.utcOffsetMinutes * 60_000) % dayLength) /
    hour
  const attention = life.health.unwell
    ? 'unwell'
    : toiletCue
      ? 'toilet'
      : life.health.waste > 0
        ? 'dirty'
        : pet.sleeping
          ? 'sleeping'
          : pet.fullness < 30
            ? 'hungry'
            : pet.energy < 20
              ? 'tired'
              : life.routine.enabled &&
                  localHour >= life.routine.wakeHour &&
                  localHour < life.routine.wakeHour + 1
                ? 'morning'
                : 'content'
  return {
    waste: life.health.waste,
    unwell: life.health.unwell,
    toiletCue,
    personality: life.personality,
    favoriteFood: life.favoriteFood,
    favoriteToy: life.favoriteToy,
    ...life.equipment,
    owned: life.owned,
    generation: life.generation,
    visits: life.visits.length,
    canVisit: adult && !life.visits.includes(day) && life.visits.length < 3,
    canStartGeneration: adult && life.visits.length >= 3,
    album: life.album,
    routine: life.routine,
    game: life.game,
    lastGame: life.lastGame,
    attention,
  } as const
}
