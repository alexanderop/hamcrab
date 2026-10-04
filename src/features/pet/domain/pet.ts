import { foods, type FoodId } from './foods'

export type PetSnapshot = Readonly<{
  version: 1
  name: string
  fullness: number
  happiness: number
  energy: number
  sleeping: boolean
  careCount: number
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
  { type: 'feed'; food: FoodId } | { type: 'play' | 'sleep' | 'wake' | 'pet' }
export type CareMessage =
  | Exclude<CareAction['type'], 'feed'>
  | FoodId
  | 'sleeping'
  | 'tired'
  | 'alreadySleeping'
  | 'alreadyAwake'
export type CareResult = {
  pet: PetSnapshot
  accepted: boolean
  message: CareMessage
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))

export function createPet(now: number): PetSnapshot {
  return {
    version: 1,
    name: 'Pinchy',
    fullness: 65,
    happiness: 78,
    energy: 72,
    sleeping: false,
    careCount: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function advancePet(pet: PetSnapshot, now: number): PetSnapshot {
  const hours = Math.min(24, Math.max(0, now - pet.updatedAt) / 3_600_000)
  return {
    ...pet,
    fullness: clamp(pet.fullness - 4 * hours),
    happiness: clamp(pet.happiness - 3 * hours),
    energy: clamp(pet.energy + (pet.sleeping ? 20 : -5) * hours),
    updatedAt: Math.max(pet.updatedAt, now),
  }
}

export function careForPet(
  snapshot: PetSnapshot,
  action: CareAction,
  now: number,
): CareResult {
  const pet = advancePet(snapshot, now)
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
  const cared = { ...pet, careCount: pet.careCount + 1 }
  switch (action.type) {
    case 'feed': {
      const food = foods[action.food]
      return {
        pet: {
          ...cared,
          fullness: clamp(pet.fullness + food.fullness),
          happiness: clamp(pet.happiness + food.happiness),
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
          happiness: clamp(pet.happiness + 15),
          energy: clamp(pet.energy - 10),
        },
        accepted: true,
        message: 'play',
      }
    case 'pet':
      return {
        pet: { ...cared, happiness: clamp(pet.happiness + 5) },
        accepted: true,
        message: 'pet',
      }
    case 'sleep':
      return {
        pet: { ...cared, sleeping: true },
        accepted: true,
        message: 'sleep',
      }
    case 'wake':
      return {
        pet: { ...cared, sleeping: false },
        accepted: true,
        message: 'wake',
      }
  }
}
