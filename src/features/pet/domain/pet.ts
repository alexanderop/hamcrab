import {
  createLife,
  syncInventory,
  toiletInterval,
  hour,
  type PetLife,
} from './life'
import { advanceRoutine, nextBedtime, nextWake } from './routine'
import { dayLength, recordCare, type Lifecycle } from './lifecycle'
import { foods, type FoodId } from './foods'
import {
  advanceFriendship,
  createFriendship,
  foodAvailable,
  rewardCare,
  isUsefulCare,
  type Friendship,
} from './friendship'

export type PetSnapshot = Readonly<{
  version: 1
  life: PetLife
  name: string
  fullness: number
  happiness: number
  energy: number
  sleeping: boolean
  careCount: number
  lifecycle: Lifecycle
  friendship: Friendship
  createdAt: number
  updatedAt: number
}>

export function parsePetName(
  value: string,
): { success: true; data: string } | { success: false } {
  const name = value.trim()
  return name.length >= 1 && name.length <= 24 && !/\p{Cc}/u.test(name)
    ? { success: true, data: name }
    : { success: false }
}

export type CareAction =
  | { type: 'feed'; food: FoodId }
  | { type: 'play' }
  | { type: 'sleep' }
  | { type: 'wake' }
  | { type: 'pet' }
export type CareMessage =
  | Exclude<CareAction['type'], 'feed'>
  | FoodId
  | 'sleeping'
  | 'tired'
  | 'alreadySleeping'
  | 'alreadyAwake'
  | 'foodLocked'
  | 'egg'
export type CareResult = {
  pet: PetSnapshot
  accepted: boolean
  message: CareMessage
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))

export function createPet(now: number): PetSnapshot {
  return {
    version: 1,
    life: createLife(now),
    name: 'Pinchy',
    fullness: 65,
    happiness: 78,
    energy: 72,
    sleeping: false,
    careCount: 0,
    lifecycle: { stage: 'egg' },
    friendship: createFriendship(now),
    createdAt: now,
    updatedAt: now,
  }
}

export function advancePet(pet: PetSnapshot, now: number): PetSnapshot {
  if (pet.lifecycle.stage === 'egg') return pet
  const effective = Math.max(pet.updatedAt, now)
  const hours = Math.min(24, (effective - pet.updatedAt) / hour)
  const routine = advanceRoutine(pet.life, pet.energy, pet.updatedAt, effective)
  const due = pet.life.health.nextToiletAt
  const misses =
    effective >= due
      ? Math.min(
          4,
          Math.floor(
            (effective - Math.max(due, effective - dayLength)) / toiletInterval,
          ) + 1,
        )
      : 0
  const waste = Math.min(3, pet.life.health.waste + misses)
  return {
    ...pet,
    fullness: clamp(pet.fullness - 4 * hours),
    happiness: clamp(pet.happiness - 3 * hours),
    energy: routine.energy,
    sleeping: routine.sleeping,
    life: syncInventory(
      {
        ...pet.life,
        sleep: routine.sleep,
        health: {
          waste,
          unwell: pet.life.health.unwell || waste >= 3,
          nextToiletAt:
            effective >= due
              ? due +
                (Math.floor((effective - due) / toiletInterval) + 1) *
                  toiletInterval
              : due,
        },
      },
      pet.friendship.points,
    ),
    updatedAt: effective,
    friendship: advanceFriendship(pet.friendship, effective),
  }
}

export function careForPet(
  snapshot: PetSnapshot,
  action: CareAction,
  now: number,
): CareResult {
  const pet = advancePet(snapshot, now)
  if (pet.lifecycle.stage === 'egg')
    return { pet, accepted: false, message: 'egg' }
  if (pet.sleeping && action.type !== 'wake' && action.type !== 'sleep') {
    return {
      pet,
      accepted: false,
      message: 'sleeping',
    }
  }
  if (action.type === 'play' && pet.energy < 10) {
    return {
      pet,
      accepted: false,
      message: 'tired',
    }
  }
  if (
    (action.type === 'sleep' && pet.sleeping) ||
    (action.type === 'wake' && !pet.sleeping)
  ) {
    return {
      pet,
      accepted: false,
      message: pet.sleeping ? 'alreadySleeping' : 'alreadyAwake',
    }
  }
  if (action.type === 'feed' && !foodAvailable(pet.friendship, action.food)) {
    return { pet, accepted: false, message: 'foodLocked' }
  }
  const cared = {
    ...pet,
    careCount: pet.careCount + 1,
    friendship: rewardCare(pet, action.type),
    lifecycle:
      isUsefulCare(pet, action.type) &&
      action.type !== 'sleep' &&
      action.type !== 'wake'
        ? recordCare(
            pet.lifecycle,
            Math.floor(pet.updatedAt / dayLength),
            action,
          )
        : pet.lifecycle,
  }
  switch (action.type) {
    case 'feed': {
      const food = foods[action.food]
      return {
        pet: {
          ...cared,
          fullness: clamp(pet.fullness + food.fullness),
          happiness: clamp(
            pet.happiness +
              food.happiness +
              (action.food === pet.life.favoriteFood ? 3 : 0),
          ),
          energy: clamp(pet.energy + food.energy),
        },
        accepted: true,
        message: action.food,
      }
    }
    case 'play':
      return {
        pet: {
          ...cared,
          happiness: clamp(
            pet.happiness +
              15 +
              (pet.life.equipment.toy === pet.life.favoriteToy ? 2 : 0),
          ),
          energy: clamp(pet.energy - 10),
        },
        accepted: true,
        message: 'play',
      }
    case 'pet':
      return {
        pet: {
          ...cared,
          happiness: clamp(
            pet.happiness + 5 + (pet.life.personality === 'gentle' ? 2 : 0),
          ),
        },
        accepted: true,
        message: 'pet',
      }
    case 'sleep':
      return {
        pet: {
          ...cared,
          sleeping: true,
          life: {
            ...pet.life,
            sleep: {
              ...pet.life.sleep,
              mode: 'manual',
              until: pet.life.routine.enabled
                ? nextWake(pet.life, pet.updatedAt)
                : 0,
            },
          },
        },
        accepted: true,
        message: 'sleep',
      }
    case 'wake':
      return {
        pet: {
          ...cared,
          sleeping: false,
          life: {
            ...pet.life,
            sleep: {
              ...pet.life.sleep,
              mode: 'awake',
              until: 0,
              overrideUntil: nextBedtime(pet.life, pet.updatedAt),
            },
          },
        },
        accepted: true,
        message: 'wake',
      }
  }
}

export function hatchPet(
  pet: PetSnapshot,
  now: number,
): { pet: PetSnapshot; hatched: boolean } {
  if (pet.lifecycle.stage !== 'egg') return { pet, hatched: false }
  const updatedAt = Math.max(pet.updatedAt, now)
  return {
    pet: {
      ...pet,
      lifecycle: { stage: 'baby', days: [] },
      life: {
        ...pet.life,
        health: {
          ...pet.life.health,
          nextToiletAt: updatedAt + toiletInterval,
        },
      },
      updatedAt,
      friendship: advanceFriendship(pet.friendship, updatedAt),
    },
    hatched: true,
  }
}
